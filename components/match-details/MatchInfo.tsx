import {
  CalendarDays,
  MapPin,
  Settings,
  ListOrdered,
  List,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { isIndividualMatch, Match } from "@/types/match.type";

interface Props {
  match: Match;
}

export default function MatchInfo({ match }: Props) {
  return (
    <section className="p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
        Match information
      </h3>

      <div>
        {isIndividualMatch(match) ? (
          <IndividualMatchInfo match={match} />
        ) : (
          <TeamMatchInfo match={match} />
        )}
      </div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 mt-1 text-zinc-400" />
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

function IndividualMatchInfo({ match }: { match: any }) {
  return (
    <div className="grid gap-4">
      <InfoRow
        icon={CalendarDays}
        label="Date"
        value={formatDate(match.createdAt)}
      />
      <InfoRow
        icon={MapPin}
        label="Location"
        value={match.city || "Not specified"}
      />
      <InfoRow
        icon={List}
        label="Format"
        value={`Best of ${match.numberOfSets}`}
      />
    </div>
  );
}

function TeamMatchInfo({ match }: { match: any }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <InfoRow
        icon={CalendarDays}
        label="Date"
        value={formatDate(match.createdAt)}
      />
      <InfoRow
        icon={MapPin}
        label="Location"
        value={match.city || "Not specified"}
      />
      <InfoRow
        icon={Settings}
        label="Match format"
        value={match.matchFormat.replace(/_/g, " ")}
      />
      <InfoRow
        icon={ListOrdered}
        label="Sets per submatch"
        value={`Best of ${match.numberOfSetsPerSubMatch}`}
      />
    </div>
  );
}