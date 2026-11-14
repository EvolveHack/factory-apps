"use client";

import { useEffect, useState } from "react";
import type { Reading } from "../engine";
import type { TenantConfig, UnitSetpoint } from "../types";
import { STATUS_COLOR, STATUS_LABEL, unitStatus } from "./status";

const CELL_W = 150;
const CELL_H = 104;
const GAP = 12;
const PAD = 16;
const SITE_LABEL = 26;

interface Props {
  config: TenantConfig;
  setpoints: Record<string, UnitSetpoint>;
  latest: Record<string, Reading>;
  traces: Record<string, number[]>;
}

/** Floor map: one outlined building per site, one freezer unit per cell. */
export function FloorMap({ config, setpoints, latest, traces }: Props) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const maxCols = narrow ? 2 : 6;
  const layout = config.sites.map((site) => {
    const cols = Math.min(site.units.length <= 4 ? site.units.length : Math.ceil(site.units.length / 2), maxCols);
    const rows = Math.ceil(site.units.length / cols);
    return { site, cols, rows };
  });
  const widestCols = Math.max(...layout.map((l) => l.cols));
  const width = PAD * 2 + widestCols * CELL_W + (widestCols - 1) * GAP;
  let y = 0;
  const placed = layout.map((l) => {
    const h = SITE_LABEL + PAD + l.rows * CELL_H + (l.rows - 1) * GAP + PAD;
    const top = y;
    y += h + GAP;
    return { ...l, top, h };
  });
  const height = y - GAP;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label={`Floor map for ${config.name}`}
      data-testid="coldchain-map"
    >
      {placed.map(({ site, cols, top, h }) => (
        <g key={site.id} data-testid="coldchain-site" data-site-id={site.id}>
          <rect x={1} y={top + 1} width={width - 2} height={h - 2} rx={8} fill="#0a101b" stroke="#24324a" strokeDasharray="6 4" />
          <text x={PAD} y={top + 20} fill="#94a3b8" fontSize={13} fontWeight={600}>
            {site.name}
          </text>
          {site.units.map((unit, i) => {
            const x = PAD + (i % cols) * (CELL_W + GAP);
            const uy = top + SITE_LABEL + PAD + Math.floor(i / cols) * (CELL_H + GAP);
            const r = latest[unit.id];
            const sp = setpoints[unit.id];
            const status = unitStatus(r, sp);
            const color = STATUS_COLOR[status];
            return (
              <g
                key={unit.id}
                transform={`translate(${x} ${uy})`}
                data-testid="coldchain-unit"
                data-unit-id={unit.id}
                data-status={status}
                data-door={r?.doorOpen ? "open" : "closed"}
              >
                <rect width={CELL_W} height={CELL_H} rx={6} fill="#111a2a" stroke={color} strokeWidth={status === "ok" ? 1 : 2} />
                <circle cx={CELL_W - 12} cy={12} r={5} fill={color}>
                  {status === "alarm" && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
                </circle>
                <text x={10} y={18} fill="#cbd5e1" fontSize={11}>
                  {unit.name}
                </text>
                <text x={10} y={48} fill="#f8fafc" fontSize={24} fontFamily="var(--font-geist-mono)" data-testid="coldchain-unit-temp">
                  {r ? `${r.tempC.toFixed(1)}` : "--"}
                  <tspan fontSize={13} fill="#94a3b8"> C</tspan>
                </text>
                <text x={10} y={64} fill={color} fontSize={10}>
                  {STATUS_LABEL[status]} · set {sp.setpointC} C
                </text>
                <Trace values={traces[unit.id] ?? []} color={color} />
                <Door open={r?.doorOpen ?? false} />
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/** Small trend line of the last 30 minutes. */
function Trace({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const points = values
    .map((v, i) => `${10 + (i / (values.length - 1)) * 90},${96 - ((v - min) / (max - min)) * 22}`)
    .join(" ");
  return <polyline points={points} fill="none" stroke={color} strokeWidth={1.2} opacity={0.8} />;
}

/** Door on the right edge of the cell. It swings out when open. */
function Door({ open }: { open: boolean }) {
  const x = 116;
  const y = 74;
  return (
    <g data-testid="coldchain-unit-door">
      <line x1={x} y1={y + 22} x2={x + 26} y2={y + 22} stroke="#334155" strokeWidth={2} />
      <line
        x1={x}
        y1={y + 22}
        x2={open ? x + 16 : x + 26}
        y2={open ? y + 2 : y + 22}
        stroke={open ? "#f59e0b" : "#64748b"}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {open && (
        <text x={x + 13} y={y} fill="#f59e0b" fontSize={9} textAnchor="middle">
          OPEN
        </text>
      )}
    </g>
  );
}
