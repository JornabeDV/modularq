"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { LOGO_BASE64 } from "@/lib/logo-base64";
import type { PeriodActivityStats } from "./analytics-utils";

export interface PdfProject {
  name: string;
  statusLabel: string;
  statusColor: string;
  completionPercentage: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  totalTasks: number;
  estimatedHours: number;
  actualHours: number;
}

export interface PdfTaskStats {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

export interface PdfStatusCounts {
  planning: number;
  active: number;
  paused: number;
  completed: number;
  delivered: number;
}

export interface AnalyticsPdfData {
  generatedAt: Date;
  periodMode: "week" | "month";
  periodLabel: string;
  projects: PdfProject[];
  statusCounts: PdfStatusCounts;
  taskStats: PdfTaskStats;
  periodActivity: PeriodActivityStats;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COMPANY_INFO = {
  name: "ModulArq",
  slogan: "Módulos Habitacionales",
  address: "Maurín 6688 Sur, Pocito, San Juan, Argentina",
  cuit: "30-71144558-3",
};

const STATUS_LABELS: Record<string, string> = {
  planning: "Planificación",
  active: "Activo",
  paused: "En Pausa",
  completed: "Completado",
  delivered: "Entregado",
};

const STATUS_COLORS: Record<string, string> = {
  planning: "#3b82f6",
  active: "#22c55e",
  paused: "#f59e0b",
  completed: "#64748b",
  delivered: "#a855f7",
};

const TASK_STATUS_ROWS = [
  { key: "completed", label: "Completadas", color: "#22c55e" },
  { key: "in_progress", label: "En Progreso", color: "#3b82f6" },
  { key: "pending", label: "Pendientes", color: "#f59e0b" },
  { key: "cancelled", label: "Canceladas", color: "#64748b" },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    padding: 30,
    paddingTop: 108,
    paddingBottom: 54,
    fontSize: 10,
    fontFamily: "Helvetica",
  },

  // Header
  header: {
    position: "absolute",
    top: 22,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
  },
  logoSection: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 76, height: 38 },
  companyName: { fontSize: 19, fontWeight: "bold" },
  companySlogan: { fontSize: 9, color: "#6b7280" },
  reportTitle: { textAlign: "right" },
  reportTitleText: { fontSize: 22, fontWeight: "bold", textAlign: "right" },
  reportPeriod: {
    fontSize: 11,
    color: "#374151",
    marginTop: 2,
    fontWeight: "bold",
    textAlign: "right",
  },
  reportDate: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
    textAlign: "right",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 22,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 7,
  },

  // KPI row
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  kpiCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 9,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  kpiLabel: {
    fontSize: 7,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  kpiValue: { fontSize: 17, fontWeight: "bold", color: "#1e293b" },
  kpiSub: { fontSize: 7, color: "#94a3b8", marginTop: 2 },

  // Activity strip
  activityStrip: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginBottom: 14,
    paddingVertical: 10,
  },
  activityItem: { flex: 1, alignItems: "center" },
  activityValue: { fontSize: 18, fontWeight: "bold", color: "#1e40af" },
  activityLabel: {
    fontSize: 7,
    color: "#3b82f6",
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 2,
  },
  activityDivider: { width: 1, backgroundColor: "#bfdbfe" },

  // Two-column layout
  threeCol: { flexDirection: "row", gap: 12, marginBottom: 14 },
  col: { flex: 1 },
  colWide: { flex: 2 },

  // Section title
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 5,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginBottom: 1,
  },
  tableHeaderText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },

  // Progress bar
  barBg: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    flex: 1,
    marginRight: 5,
  },
  barFill: { height: 6, borderRadius: 3 },

  // Project table cols
  cName: { flex: 3, paddingRight: 5 },
  cStatus: { width: 60, paddingRight: 4 },
  cBar: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 4,
  },
  cNum: { width: 24, textAlign: "center" },

  // Operario table cols
  oName: { flex: 3, paddingRight: 5 },
  oBar: {
    flex: 2,
    paddingRight: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  oNum: { width: 42, textAlign: "center" },
  oHours: { width: 40, textAlign: "right" },
  oProj: { width: 36, textAlign: "center" },

  // Summary bar
  summaryBar: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#1e293b",
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function progressColor(pct: number): string {
  if (pct === 100) return "#22c55e";
  if (pct >= 60) return "#3b82f6";
  if (pct >= 30) return "#f59e0b";
  return "#ef4444";
}

function fmt(n: number): string {
  return n.toLocaleString("es-AR");
}
function fmtH(n: number): string {
  return `${fmt(n)} hs`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PdfHeader({
  generatedAt,
  periodLabel,
  periodMode,
}: {
  generatedAt: Date;
  periodLabel: string;
  periodMode: "week" | "month";
}) {
  return (
    <View style={s.header} fixed>
      <View style={s.logoSection}>
        <Image style={s.logo} src={LOGO_BASE64} />
        <View>
          <Text style={s.companyName}>{COMPANY_INFO.name}</Text>
          <Text style={s.companySlogan}>{COMPANY_INFO.slogan}</Text>
        </View>
      </View>
      <View style={s.reportTitle}>
        <Text style={s.reportTitleText}>
          {periodMode === "week" ? "REPORTE SEMANAL" : "REPORTE MENSUAL"}
        </Text>
        <Text style={s.reportPeriod}>{periodLabel}</Text>
        <Text style={s.reportDate}>
          Generado:{" "}
          {generatedAt.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </Text>
      </View>
    </View>
  );
}

function PdfFooter() {
  return (
    <View style={s.footer} fixed>
      <Text>
        {COMPANY_INFO.name} — {COMPANY_INFO.address} — CUIT {COMPANY_INFO.cuit}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

// ─── Main Document ────────────────────────────────────────────────────────────

export function AnalyticsPdfDocument({ data }: { data: AnalyticsPdfData }) {
  const {
    generatedAt,
    periodLabel,
    periodMode,
    projects,
    statusCounts,
    taskStats,
    periodActivity,
  } = data;
  const { operarios, tasksCompleted, projectsCreated, projectsDelivered } =
    periodActivity;

  const totalTasks =
    taskStats.pending +
    taskStats.in_progress +
    taskStats.completed +
    taskStats.cancelled;
  const totalProjects = projects.length;
  const ACTIVE_LABELS = new Set(["Planificación", "Activo", "En Pausa"]);
  const visibleProjects = projects.filter((p) =>
    ACTIVE_LABELS.has(p.statusLabel),
  );
  const maxOpTotal = Math.max(...operarios.map((o) => o.completedTotal), 1);
  const periodWord = periodMode === "week" ? "sem." : "mes";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader
          generatedAt={generatedAt}
          periodLabel={periodLabel}
          periodMode={periodMode}
        />
        <PdfFooter />

        {/* ── KPIs ── */}
        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Total Proyectos</Text>
            <Text style={s.kpiValue}>{fmt(totalProjects)}</Text>
            <Text style={s.kpiSub}>{statusCounts.active} activos</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Tareas completadas</Text>
            <Text style={s.kpiValue}>{fmt(tasksCompleted)}</Text>
            <Text style={s.kpiSub}>completadas en el período</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Tareas pendientes</Text>
            <Text style={s.kpiValue}>{fmt(taskStats.pending)}</Text>
            <Text style={s.kpiSub}>
              {fmt(taskStats.in_progress)} en progreso
            </Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Operarios activos</Text>
            <Text style={s.kpiValue}>{fmt(operarios.length)}</Text>
            <Text style={s.kpiSub}>
              {fmt(operarios.reduce((acc, o) => acc + o.completedInPeriod, 0))}{" "}
              tareas {periodMode === "week" ? "esta sem." : "este mes"}
            </Text>
          </View>
        </View>

        {/* ── Actividad del período ── */}
        <View style={s.activityStrip}>
          <View style={s.activityItem}>
            <Text style={s.activityValue}>{fmt(tasksCompleted)}</Text>
            <Text style={s.activityLabel}>Tareas completadas</Text>
          </View>
          <View style={s.activityDivider} />
          <View style={s.activityItem}>
            <Text style={s.activityValue}>{fmt(projectsCreated)}</Text>
            <Text style={s.activityLabel}>Proyectos creados</Text>
          </View>
          <View style={s.activityDivider} />
          <View style={s.activityItem}>
            <Text style={s.activityValue}>{fmt(projectsDelivered)}</Text>
            <Text style={s.activityLabel}>Proyectos entregados</Text>
          </View>
          <View style={s.activityDivider} />
          <View style={s.activityItem}>
            <Text style={s.activityValue}>
              {fmt(operarios.filter((o) => o.completedInPeriod > 0).length)}
            </Text>
            <Text style={s.activityLabel}>Operarios con actividad</Text>
          </View>
        </View>

        {/* ── Estado proyectos + estado tareas + progreso ── */}
        <View style={s.threeCol}>
          {/* Estado de proyectos */}
          <View style={s.col}>
            <Text style={s.sectionTitle}>Proyectos en Curso</Text>
            {(["planning", "active", "paused"] as const).map((key) => (
              <View key={key} style={s.tableRow}>
                <View
                  style={[
                    s.dot,
                    { backgroundColor: STATUS_COLORS[key] ?? "#94a3b8" },
                  ]}
                />
                <Text style={{ flex: 1, fontSize: 9 }}>
                  {STATUS_LABELS[key]}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "bold",
                    width: 20,
                    textAlign: "right",
                  }}
                >
                  {statusCounts[key] ?? 0}
                </Text>
              </View>
            ))}
          </View>

          {/* Estado de tareas */}
          <View style={s.col}>
            <Text style={s.sectionTitle}>Tareas — Proyectos Activos</Text>
            {TASK_STATUS_ROWS.map((row) => {
              const count = taskStats[row.key as keyof PdfTaskStats];
              const pct =
                totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
              return (
                <View key={row.key} style={s.tableRow}>
                  <Text style={{ fontSize: 8, width: 58 }}>{row.label}</Text>
                  <View style={s.barBg}>
                    <View
                      style={[
                        s.barFill,
                        { width: `${pct}%`, backgroundColor: row.color },
                      ]}
                    />
                  </View>
                  <Text style={{ fontSize: 9, width: 20, textAlign: "right" }}>
                    {count}
                  </Text>
                  <Text
                    style={{
                      fontSize: 8,
                      color: "#94a3b8",
                      width: 22,
                      textAlign: "right",
                    }}
                  >
                    {pct}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Progreso de Proyectos ── */}
        <View style={{ marginBottom: 14 }}>
          <Text style={s.sectionTitle}>
            Progreso de Proyectos — Activos ({fmt(visibleProjects.length)})
          </Text>
          <View style={s.tableHeader}>
            <View style={s.cName}>
              <Text style={s.tableHeaderText}>Proyecto</Text>
            </View>
            <View style={s.cStatus}>
              <Text style={s.tableHeaderText}>Estado</Text>
            </View>
            <View style={s.cBar}>
              <Text style={s.tableHeaderText}>Avance</Text>
            </View>
            <View style={s.cNum}>
              <Text style={[s.tableHeaderText, { textAlign: "center" }]}>
                ✓
              </Text>
            </View>
            <View style={s.cNum}>
              <Text style={[s.tableHeaderText, { textAlign: "center" }]}>
                ⏳
              </Text>
            </View>
            <View style={s.cNum}>
              <Text style={[s.tableHeaderText, { textAlign: "center" }]}>
                ▶
              </Text>
            </View>
          </View>
          {visibleProjects.map((p, i) => (
            <View
              key={i}
              style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
            >
              <View style={s.cName}>
                <Text style={{ fontSize: 8 }}>
                  {p.name.length > 48 ? p.name.slice(0, 45) + "..." : p.name}
                </Text>
              </View>
              <View style={s.cStatus}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                >
                  <View
                    style={[
                      s.dot,
                      { backgroundColor: p.statusColor, width: 5, height: 5 },
                    ]}
                  />
                  <Text style={{ fontSize: 8, color: "#374151" }}>
                    {p.statusLabel}
                  </Text>
                </View>
              </View>
              <View style={s.cBar}>
                <View style={s.barBg}>
                  <View
                    style={[
                      s.barFill,
                      {
                        width: `${p.completionPercentage}%`,
                        backgroundColor: progressColor(p.completionPercentage),
                      },
                    ]}
                  />
                </View>
                <Text style={{ fontSize: 8, width: 24, textAlign: "right" }}>
                  {p.completionPercentage}%
                </Text>
              </View>
              <View style={s.cNum}>
                <Text
                  style={{
                    fontSize: 8,
                    color: "#22c55e",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {p.completedTasks}
                </Text>
              </View>
              <View style={s.cNum}>
                <Text
                  style={{
                    fontSize: 8,
                    color: "#f59e0b",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {p.pendingTasks}
                </Text>
              </View>
              <View style={s.cNum}>
                <Text
                  style={{
                    fontSize: 8,
                    color: "#3b82f6",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {p.inProgressTasks}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Rendimiento de Operarios ── */}
        {operarios.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>
              Rendimiento de Operarios — {periodLabel}
            </Text>
            <View style={s.tableHeader}>
              <View style={s.oName}>
                <Text style={s.tableHeaderText}>Operario</Text>
              </View>
              <View style={s.oBar}>
                <Text style={s.tableHeaderText}>Actividad total</Text>
              </View>
              <View style={s.oNum}>
                <Text style={[s.tableHeaderText, { textAlign: "center" }]}>
                  Este {periodWord}
                </Text>
              </View>
              <View style={s.oNum}>
                <Text style={[s.tableHeaderText, { textAlign: "center" }]}>
                  Total
                </Text>
              </View>
              <View style={s.oHours}>
                <Text style={[s.tableHeaderText, { textAlign: "right" }]}>
                  Hs. {periodWord}
                </Text>
              </View>
              <View style={s.oProj}>
                <Text style={[s.tableHeaderText, { textAlign: "center" }]}>
                  Proyectos
                </Text>
              </View>
            </View>
            {operarios.map((op, i) => (
              <View
                key={i}
                style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
              >
                <View style={s.oName}>
                  <Text style={{ fontSize: 9 }}>{op.name}</Text>
                </View>
                <View style={s.oBar}>
                  <View style={s.barBg}>
                    <View
                      style={[
                        s.barFill,
                        {
                          width: `${Math.round((op.completedTotal / maxOpTotal) * 100)}%`,
                          backgroundColor: "#3b82f6",
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={s.oNum}>
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "bold",
                      textAlign: "center",
                      color: op.completedInPeriod > 0 ? "#1e293b" : "#94a3b8",
                    }}
                  >
                    {op.completedInPeriod}
                  </Text>
                </View>
                <View style={s.oNum}>
                  <Text style={{ fontSize: 9, textAlign: "center" }}>
                    {op.completedTotal}
                  </Text>
                </View>
                <View style={s.oHours}>
                  <Text
                    style={{
                      fontSize: 9,
                      textAlign: "right",
                      color: "#6b7280",
                    }}
                  >
                    {op.actualHoursInPeriod > 0
                      ? fmtH(op.actualHoursInPeriod)
                      : "—"}
                  </Text>
                </View>
                <View style={s.oProj}>
                  <Text style={{ fontSize: 9, textAlign: "center" }}>
                    {op.activeProjects}
                  </Text>
                </View>
              </View>
            ))}
            <View style={s.summaryBar}>
              <Text
                style={{ fontSize: 9, color: "#ffffff", fontWeight: "bold" }}
              >
                {operarios.length} operario{operarios.length !== 1 ? "s" : ""}{" "}
                activos
              </Text>
              <Text style={{ fontSize: 9, color: "#94a3b8" }}>
                {fmt(
                  operarios.reduce((acc, o) => acc + o.completedInPeriod, 0),
                )}{" "}
                tareas {periodMode === "week" ? "esta semana" : "este mes"} •{" "}
                {fmt(operarios.reduce((acc, o) => acc + o.completedTotal, 0))}{" "}
                tareas totales
              </Text>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
