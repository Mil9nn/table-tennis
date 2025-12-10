const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling request:", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // Socket.IO - DISABLED (uncomment to enable real-time features)
  // const io = new Server(httpServer, {
  //   cors: {
  //     origin: dev
  //       ? ["http://localhost:3000", "http://127.0.0.1:3000"]
  //       : process.env.NEXT_PUBLIC_SOCKET_URL
  //         ? [process.env.NEXT_PUBLIC_SOCKET_URL]
  //         : false,
  //     credentials: true,
  //     methods: ["GET", "POST"],
  //   },
  //   path: "/socket.io/",
  //   transports: ["websocket", "polling"],
  //   pingTimeout: 60000,
  //   pingInterval: 25000,
  // });

  // global.io = io;

  // Promise.resolve()
  //   .then(() => {
  //     return import("./lib/socketHandler.js");
  //   })
  //   .then((module) => {
  //     const { initializeSocketHandlers } = module;
  //     initializeSocketHandlers(io);
  //     console.log("[Socket.IO] Handlers initialized successfully");
  //   })
  //   .catch((error) => {
  //     console.error("[Socket.IO] Failed to initialize handlers:", error);
  //     console.error("[Socket.IO] Socket.IO will run without handlers");
  //   });

  console.log("[Socket.IO] Disabled - Live updates not available");

  // Start server
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO: Disabled`);
    console.log(`> Environment: ${dev ? "development" : "production"}`);
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log("\n[Server] Received shutdown signal, closing connections...");

    // Socket.IO close (disabled)
    // if (global.io) {
    //   global.io.close(() => {
    //     console.log("[Socket.IO] All socket connections closed");
    //   });
    // }

    httpServer.close(() => {
      console.log("[Server] HTTP server closed");
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error("[Server] Forcefully shutting down");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
});
