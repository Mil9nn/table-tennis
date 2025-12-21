import { CalendarDays, MapPin, Settings, ListOrdered, List } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { isIndividualMatch, Match } from "@/types/match.type";

interface Props {
  match: Match;
}

export default function MatchInfo({ match }: Props) {
  return (
    <div className="p-5 border-b border-zinc-100">
      <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Match Information
      </h3>

      {isIndividualMatch(match) ? (
        <IndividualMatchInfo match={match} />
      ) : (
        <TeamMatchInfo match={match} />
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, iconColor = "text-zinc-400" }: {
  icon: any;
  label: string;
  value: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`p-2 rounded-lg bg-white dark:bg-zinc-800 ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{value}</p>
      </div>
    </div>
  );
}

function IndividualMatchInfo({ match }: { match: any }) {
  return (
    <div className="grid gap-2">
      <InfoItem
        icon={CalendarDays}
        label="Date"
        value={formatDate(match.createdAt)}
        iconColor="text-blue-500"
      />
      <InfoItem
        icon={MapPin}
        label="Location"
        value={match.city || "Not specified"}
        iconColor="text-rose-500"
      />
      <InfoItem
        icon={List}
        label="Format"
        value={`Best of ${match.numberOfSets}`}
        iconColor="text-violet-500"
      />
    </div>
  );
}

function TeamMatchInfo({ match }: { match: any }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      <InfoItem
        icon={CalendarDays}
        label="Date"
        value={formatDate(match.createdAt)}
        iconColor="text-blue-500"
      />
      <InfoItem
        icon={MapPin}
        label="Location"
        value={match.city || "Not specified"}
        iconColor="text-rose-500"
      />
      <InfoItem
        icon={Settings}
        label="Match Format"
        value={match.matchFormat.replace(/_/g, " ")}
        iconColor="text-amber-500"
      />
      <InfoItem
        icon={ListOrdered}
        label="Sets per Submatch"
        value={`Best of ${match.numberOfSetsPerSubMatch}`}
        iconColor="text-violet-500"
      />
    </div>
  );
}