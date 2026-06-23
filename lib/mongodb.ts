import { execFile } from "node:child_process";
import dns from "node:dns";
import { promisify } from "node:util";
import mongoose from "mongoose";
import { env } from "./env";

const execFileAsync = promisify(execFile);

type MongoCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    modelsRegistered: boolean;
    resolvedUri: string | null;
};

let cached = (global as any).mongoose as MongoCache | undefined;

if (!cached) {
    cached = (global as any).mongoose = {
        conn: null,
        promise: null,
        modelsRegistered: false,
        resolvedUri: null,
    };
}

/**
 * mongodb+srv:// uses DNS SRV lookups. Some Windows/ISP DNS setups reject those
 * queries in Node (querySrv ECONNREFUSED) even when nslookup works. Turbopack
 * can also break global dns.setServers(), so we use a dedicated Resolver plus
 * an nslookup fallback on Windows.
 */
function getMongoDnsServers(): string[] {
    const customServers = process.env.MONGODB_DNS_SERVERS;
    if (customServers) {
        return customServers
            .split(",")
            .map((server) => server.trim())
            .filter(Boolean);
    }

    if (process.platform === "win32") {
        return ["8.8.8.8", "1.1.1.1"];
    }

    return [];
}

function applyDnsFix() {
    const servers = getMongoDnsServers();
    if (servers.length > 0) {
        dns.setServers(servers);
    }
}

function createMongoResolver() {
    const resolver = new dns.Resolver();
    const servers = getMongoDnsServers();
    if (servers.length > 0) {
        resolver.setServers(servers);
    }
    return resolver;
}

const mongoResolver = createMongoResolver();
const resolveSrvNative = promisify(mongoResolver.resolveSrv.bind(mongoResolver));

applyDnsFix();

async function resolveSrvViaNslookup(srvHost: string): Promise<dns.SrvRecord[]> {
    const server = getMongoDnsServers()[0] ?? "8.8.8.8";
    const { stdout } = await execFileAsync(
        "nslookup",
        ["-type=SRV", srvHost, server],
        { windowsHide: true, maxBuffer: 1024 * 1024 }
    );

    const records: dns.SrvRecord[] = [];
    let port: number | undefined;
    let name: string | undefined;

    for (const line of stdout.split(/\r?\n/)) {
        const portMatch = line.match(/port\s*=\s*(\d+)/i);
        const hostMatch = line.match(/svr hostname\s*=\s*(\S+)/i);

        if (portMatch) {
            port = Number.parseInt(portMatch[1], 10);
        }

        if (hostMatch) {
            name = hostMatch[1].replace(/\.$/, "");
            if (port && name) {
                records.push({ name, port, priority: 0, weight: 0 });
                port = undefined;
                name = undefined;
            }
        }
    }

    if (records.length === 0) {
        throw new Error(`No SRV records found for ${srvHost}`);
    }

    return records;
}

async function lookupMongoSrv(srvHost: string): Promise<dns.SrvRecord[]> {
    try {
        return await resolveSrvNative(srvHost);
    } catch (error) {
        if (process.platform !== "win32") {
            throw error;
        }

        console.warn(
            "[MongoDB] Node SRV lookup failed, falling back to nslookup:",
            error instanceof Error ? error.message : error
        );
        return resolveSrvViaNslookup(srvHost);
    }
}

async function resolveMongoUri(uri: string): Promise<string> {
    if (!uri.startsWith("mongodb+srv://")) {
        return uri;
    }

    if (cached!.resolvedUri) {
        return cached!.resolvedUri;
    }

    applyDnsFix();

    const match = uri.match(/^mongodb\+srv:\/\/([^@]+@)?([^/?]+)(\/[^?]*)?(\?.*)?$/);
    if (!match) {
        return uri;
    }

    const [, auth = "", hostname, pathPart = "", queryPart = ""] = match;
    const srvHost = `_mongodb._tcp.${hostname}`;
    const records = await lookupMongoSrv(srvHost);
    const hosts = records.map((record) => `${record.name}:${record.port}`).join(",");

    const path = pathPart || "/";
    const params = new URLSearchParams(queryPart.startsWith("?") ? queryPart.slice(1) : queryPart);
    if (!params.has("ssl") && !params.has("tls")) {
        params.set("ssl", "true");
    }

    const queryString = params.toString();
    cached!.resolvedUri = `mongodb://${auth}${hosts}${path}${queryString ? `?${queryString}` : ""}`;
    return cached!.resolvedUri;
}

/**
 * Ensure all discriminator models are registered
 * This is critical for Next.js API routes with hot reloading
 */
async function ensureModelsRegistered() {
    if (cached!.modelsRegistered) {
        return;
    }

    try {
        await import("@/models/MatchBase");
        await import("@/models/IndividualMatch");
        await import("@/models/TeamMatch");
        await import("@/models/Tournament");
        await import("@/models/TournamentStandings");
        await import("@/models/TournamentGroups");
        await import("@/models/User");
        await import("@/models/Team");
        await import("@/models/BracketState");
        await import("@/models/Subscription");
        await import("@/models/Payment");

        cached!.modelsRegistered = true;
    } catch (error) {
        console.error("[MongoDB] ✗ Error registering models:", error);
        throw error;
    }
}

export const connectDB = async () => {
    if (cached!.conn) {
        await ensureModelsRegistered();
        return cached!.conn;
    }

    if (!cached!.promise) {
        cached!.promise = (async () => {
            const connectionUri = await resolveMongoUri(env.MONGODB_URI);
            return mongoose.connect(connectionUri);
        })()
            .then(async (mongooseInstance) => {
                await ensureModelsRegistered();
                return mongooseInstance;
            })
            .catch((error) => {
                console.error("Error connecting to MongoDB:", error);
                cached!.promise = null;
                cached!.resolvedUri = null;
                throw error;
            });
    }

    cached!.conn = await cached!.promise;
    return cached!.conn;
};
