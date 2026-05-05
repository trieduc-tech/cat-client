"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { thetaToSaeb } from "@/lib/saeb";
import type { HistoryStep } from "@/lib/types";

const chartConfig = {
  saeb: {
    label: "Proficiência SAEB",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

interface ThetaChartProps {
  history: HistoryStep[];
  currentTheta?: number;
  showSE?: boolean;
}

export function ThetaChart({
  history,
  currentTheta,
  showSE = true,
}: ThetaChartProps) {
  if (history.length === 0 && currentTheta === undefined) return null;

  const data = history.map((h) => ({
    step: h.step,
    saeb: Math.round(thetaToSaeb(h.theta)),
    upper: h.se != null ? Math.round(thetaToSaeb(h.theta + h.se)) : null,
    lower: h.se != null ? Math.round(thetaToSaeb(h.theta - h.se)) : null,
    correct: h.correct,
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -4 }}
      >
        <defs>
          <linearGradient id="thetaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="step"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          tickMargin={8}
          className="fill-muted-foreground"
        />
        <YAxis
          domain={[100, 400]}
          tickLine={false}
          axisLine={false}
          fontSize={11}
          tickMargin={4}
          className="fill-muted-foreground"
          ticks={[100, 150, 200, 250, 300, 350, 400]}
        />
        <ReferenceLine y={250} strokeDasharray="4 4" className="stroke-border" />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                if (name === "saeb") return [`${value} pts`, "Proficiência SAEB"];
                return null;
              }}
              hideIndicator
            />
          }
        />
        {showSE && (
          <Area
            dataKey="upper"
            stroke="none"
            fill="var(--color-chart-3)"
            fillOpacity={0.08}
            type="monotone"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            tooltipType="none"
          />
        )}
        {showSE && (
          <Area
            dataKey="lower"
            stroke="none"
            fill="var(--color-background)"
            fillOpacity={1}
            type="monotone"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            tooltipType="none"
          />
        )}
        <Area
          dataKey="saeb"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          fill="url(#thetaGrad)"
          type="monotone"
          dot={(props: any) => {
            const { cx, cy, index, payload } = props;
            if (cx == null || cy == null) return <></>;
            const color = payload?.correct ? "#10b981" : "#ef4444";
            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={4}
                fill={color}
                stroke="var(--color-background)"
                strokeWidth={2}
              />
            );
          }}
          activeDot={(props: any) => {
            const { cx, cy, index, payload } = props;
            if (cx == null || cy == null) return <></>;
            const color = payload?.correct ? "#10b981" : "#ef4444";
            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={5}
                fill={color}
                stroke="var(--color-background)"
                strokeWidth={2}
              />
            );
          }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
