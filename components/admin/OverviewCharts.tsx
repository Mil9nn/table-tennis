"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminPanel } from "@/components/admin/AdminPanel";
import {
  ADMIN_CHART_AXIS,
  ADMIN_CHART_COLORS,
  ADMIN_CHART_GRID,
  ADMIN_CHART_TOOLTIP_BG,
  ADMIN_CHART_TOOLTIP_BORDER,
  ADMIN_PIE_CHART_COLORS,
} from "@/components/admin/chartTheme";
import type { AdminOverviewResponse, CountByKey, DailyCount } from "@/types/admin";

const tooltipStyle = {
  backgroundColor: ADMIN_CHART_TOOLTIP_BG,
  border: `1px solid ${ADMIN_CHART_TOOLTIP_BORDER}`,
  borderRadius: "12px",
  color: "#f0f4fa",
  fontSize: "12px",
};

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function renderPieLabel(props: {
  x?: number;
  y?: number;
  key?: string;
  percent?: number;
  textAnchor?: "end" | "start" | "middle" | "inherit";
}) {
  const { x, y, key, percent, textAnchor } = props;
  if (x == null || y == null || key == null) return null;
  return (
    <text
      x={x}
      y={y}
      fill={ADMIN_CHART_AXIS}
      textAnchor={textAnchor}
      dominantBaseline="central"
      fontSize={10}
    >
      {`${key} ${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  );
}

function TrendChart({
  title,
  data,
  color = ADMIN_CHART_COLORS[0],
}: {
  title: string;
  data: DailyCount[];
  color?: string;
}) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatShortDate(d.date),
  }));

  return (
    <AdminPanel title={title} contentClassName="px-2 pb-4 sm:px-4">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_CHART_GRID} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: ADMIN_CHART_AXIS }}
            interval="preserveStartEnd"
            axisLine={{ stroke: ADMIN_CHART_GRID }}
            tickLine={{ stroke: ADMIN_CHART_GRID }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: ADMIN_CHART_AXIS }}
            width={32}
            axisLine={{ stroke: ADMIN_CHART_GRID }}
            tickLine={{ stroke: ADMIN_CHART_GRID }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="count"
            name="Count"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </AdminPanel>
  );
}

export function OverviewTrends({ trends }: { trends: AdminOverviewResponse["trends"] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <TrendChart title="Signups (30d)" data={trends.signups} />
      <TrendChart
        title="Tournaments created (30d)"
        data={trends.tournamentsCreated}
        color={ADMIN_CHART_COLORS[1]}
      />
      <TrendChart
        title="Matches completed (30d)"
        data={trends.matchesCompleted}
        color={ADMIN_CHART_COLORS[2]}
      />
    </div>
  );
}

export function BreakdownBarChart({
  title,
  data,
}: {
  title: string;
  data: CountByKey[];
}) {
  if (data.length === 0) {
    return (
      <AdminPanel title={title}>
        <p className="text-sm text-[var(--lp-text-muted)]">No data yet</p>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel title={title} contentClassName="px-2 pb-4 sm:px-4">
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={ADMIN_CHART_GRID} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: ADMIN_CHART_AXIS }}
            axisLine={{ stroke: ADMIN_CHART_GRID }}
            tickLine={{ stroke: ADMIN_CHART_GRID }}
          />
          <YAxis
            type="category"
            dataKey="key"
            width={100}
            tick={{ fontSize: 11, fill: ADMIN_CHART_AXIS }}
            axisLine={{ stroke: ADMIN_CHART_GRID }}
            tickLine={{ stroke: ADMIN_CHART_GRID }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" name="Count" fill={ADMIN_CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </AdminPanel>
  );
}

export function BreakdownPieChart({
  title,
  data,
}: {
  title: string;
  data: CountByKey[];
}) {
  if (data.length === 0) {
    return (
      <AdminPanel title={title}>
        <p className="text-sm text-[var(--lp-text-muted)]">No data yet</p>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel title={title} contentClassName="px-2 pb-4 sm:px-4">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data as { key: string; count: number }[]}
            dataKey="count"
            nameKey="key"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={renderPieLabel as never}
            labelLine={{ stroke: ADMIN_CHART_GRID, strokeWidth: 1 }}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={ADMIN_PIE_CHART_COLORS[i % ADMIN_PIE_CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </AdminPanel>
  );
}
