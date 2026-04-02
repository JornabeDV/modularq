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
  pendingTaskNames: string[];
  startDate: string | null;
  endDate: string | null;
  daysUntilDeadline: number | null;
  clientName: string | null;
  completedAt: string | null;
  deliveredAt: string | null;
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
  deliveredProjects: PdfProject[];
  completedProjects: PdfProject[];
  planningProjects: PdfProject[];
  pausedProjects: PdfProject[];
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
    fontSize: 9,
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
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  kpiValue: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },

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
    fontSize: 9,
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
    fontSize: 11,
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
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginBottom: 1,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
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
        {COMPANY_INFO.name} — {COMPANY_INFO.address}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

// ─── Project Status Section ───────────────────────────────────────────────────

function ProjectStatusSection({
  title,
  projects,
  dateLabel,
  dateField,
}: {
  title: string;
  projects: PdfProject[];
  dateLabel: string;
  dateField: "deliveredAt" | "completedAt" | "planning";
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.sectionTitle}>
        {title} ({projects.length})
      </Text>
      {projects.map((p, i) => (
        <View
          key={i}
          style={[
            s.tableRow,
            i % 2 === 1 ? s.tableRowAlt : {},
            { paddingVertical: 5 },
          ]}
        >
          <View style={{ flex: 3, paddingRight: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#1e293b" }}>
              {p.name}
            </Text>
            {p.clientName && (
              <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 1 }}>
                {p.clientName}
              </Text>
            )}
          </View>
          <View style={{ flex: 2 }}>
            {dateField === "planning" ? (
              <Text style={{ fontSize: 9, color: "#374151" }}>
                Inicio: {p.startDate ?? "—"} | Fin: {p.endDate ?? "sin fecha"}
              </Text>
            ) : (
              <Text style={{ fontSize: 9, color: "#374151" }}>
                {dateLabel}:{" "}
                {(dateField === "deliveredAt"
                  ? p.deliveredAt
                  : p.completedAt) ?? "—"}
              </Text>
            )}
          </View>
        </View>
      ))}
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
    deliveredProjects,
    completedProjects,
    planningProjects,
    pausedProjects,
    statusCounts,
    taskStats,
    periodActivity,
  } = data;
  const { operarios, projectsDelivered, projectsCompletedInPeriod } =
    periodActivity;

  const totalTasks =
    taskStats.pending +
    taskStats.in_progress +
    taskStats.completed +
    taskStats.cancelled;
  const visibleProjects = projects.filter((p) => p.statusLabel === "Activo");
  const totalProjects =
    (statusCounts.active ?? 0) +
    (statusCounts.planning ?? 0) +
    (statusCounts.paused ?? 0) +
    projectsCompletedInPeriod +
    projectsDelivered;
  const periodOperarios = operarios.filter((o) => o.completedInPeriod > 0);
  const maxOpPeriod = Math.max(
    ...periodOperarios.map((o) => o.completedInPeriod),
    1,
  );

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
            <Text style={s.kpiLabel}>Activos</Text>
            <Text style={s.kpiValue}>{fmt(statusCounts.active ?? 0)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Planificación</Text>
            <Text style={s.kpiValue}>{fmt(statusCounts.planning ?? 0)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Completados</Text>
            <Text style={s.kpiValue}>{fmt(projectsCompletedInPeriod)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Pausados</Text>
            <Text style={s.kpiValue}>{fmt(statusCounts.paused ?? 0)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Entregados</Text>
            <Text style={s.kpiValue}>{fmt(projectsDelivered)}</Text>
          </View>
          <View
            style={[
              s.kpiCard,
              { borderColor: "#1e293b", backgroundColor: "#f1f5f9" },
            ]}
          >
            <Text style={s.kpiLabel}>Total</Text>
            <Text style={s.kpiValue}>{fmt(totalProjects)}</Text>
          </View>
        </View>

        {/* ── Estado proyectos + estado tareas + progreso ── */}
        {((statusCounts.active ?? 0) + (statusCounts.planning ?? 0) + (statusCounts.paused ?? 0) > 0) && <View style={s.threeCol}>
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
            <Text style={s.sectionTitle}>Tareas — Proyectos</Text>
            {TASK_STATUS_ROWS.map((row) => {
              const count = taskStats[row.key as keyof PdfTaskStats];
              const pct =
                totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
              return (
                <View key={row.key} style={s.tableRow}>
                  <Text style={{ fontSize: 9, width: 58 }}>{row.label}</Text>
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
        </View>}

        {/* ── Proyectos Entregados ── */}
        {deliveredProjects.length > 0 && (
          <ProjectStatusSection
            title="Proyectos Entregados en el Período"
            projects={deliveredProjects}
            dateLabel="Fecha de entrega"
            dateField="deliveredAt"
          />
        )}

        {/* ── Proyectos Completados ── */}
        {completedProjects.length > 0 && (
          <ProjectStatusSection
            title="Proyectos Completados en el Período"
            projects={completedProjects}
            dateLabel="Fecha de completado"
            dateField="completedAt"
          />
        )}

        {/* ── Proyectos en Planificación ── */}
        {planningProjects.length > 0 && (
          <ProjectStatusSection
            title="Proyectos en Planificación"
            projects={planningProjects}
            dateLabel="Fecha inicio → fin"
            dateField="planning"
          />
        )}

        {/* ── Proyectos Pausados ── */}
        {pausedProjects.length > 0 && (
          <ProjectStatusSection
            title="Proyectos Pausados"
            projects={pausedProjects}
            dateLabel="Fecha inicio → fin"
            dateField="planning"
          />
        )}

        {/* ── Progreso de Proyectos ── */}
        {visibleProjects.length > 0 && <View style={{ marginBottom: 14 }}>
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
                C
              </Text>
            </View>
            <View style={s.cNum}>
              <Text style={[s.tableHeaderText, { textAlign: "center" }]}>
                P
              </Text>
            </View>
            <View style={s.cNum}>
              <Text style={[s.tableHeaderText, { textAlign: "center" }]}>
                Pr
              </Text>
            </View>
          </View>
          {visibleProjects.map((p, i) => (
            <View
              key={i}
              style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
            >
              <View style={s.cName}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    flexWrap: "wrap",
                  }}
                >
                  <Text style={{ fontSize: 10 }}>
                    {p.name.length > 40 ? p.name.slice(0, 37) + "..." : p.name}
                  </Text>
                  {p.daysUntilDeadline !== null &&
                    (() => {
                      const d = p.daysUntilDeadline!;
                      const bg =
                        d < 0
                          ? "#ef4444"
                          : d <= 7
                            ? "#f97316"
                            : d <= 30
                              ? "#eab308"
                              : "#22c55e";
                      const label =
                        d < 0
                          ? `Vencido hace ${Math.abs(d)}d`
                          : d === 0
                            ? "Vence hoy"
                            : `${d}d restantes`;
                      return (
                        <View
                          style={{
                            backgroundColor: bg,
                            borderRadius: 3,
                            paddingHorizontal: 4,
                            paddingVertical: 1,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              color: "#ffffff",
                              fontWeight: "bold",
                            }}
                          >
                            {label}
                          </Text>
                        </View>
                      );
                    })()}
                </View>
                <Text style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>
                  Inicio: {p.startDate ?? "—"} | Fin: {p.endDate ?? "sin fecha"}
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
                  <Text style={{ fontSize: 10, color: "#374151" }}>
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
                <Text style={{ fontSize: 10, width: 24, textAlign: "right" }}>
                  {p.completionPercentage}%
                </Text>
              </View>
              <View style={s.cNum}>
                <Text
                  style={{
                    fontSize: 10,
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
                    fontSize: 10,
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
                    fontSize: 10,
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
        </View>}

        {/* ── Tareas Pendientes por Proyecto ── */}
        {periodMode === "week" &&
          visibleProjects.some((p) => p.pendingTaskNames.length > 0) && (
            <View style={{ marginBottom: 14 }}>
              <Text style={s.sectionTitle}>
                Tareas Pendientes — Proyectos Activos
              </Text>
              {visibleProjects
                .filter((p) => p.pendingTaskNames.length > 0)
                .map((p, pi) => (
                  <View key={pi} style={{ marginBottom: 8 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        marginBottom: 3,
                      }}
                    >
                      <View
                        style={[
                          s.dot,
                          {
                            backgroundColor: p.statusColor,
                            width: 6,
                            height: 6,
                          },
                        ]}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "bold",
                          color: "#1e293b",
                        }}
                      >
                        {p.name} ({p.pendingTaskNames.length})
                      </Text>
                    </View>
                    {p.pendingTaskNames.map((taskName, ti) => (
                      <View
                        key={ti}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingLeft: 14,
                          paddingVertical: 2,
                          borderBottomWidth: 1,
                          borderBottomColor: "#f1f5f9",
                        }}
                      >
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: "#f59e0b",
                            marginRight: 6,
                          }}
                        />
                        <Text style={{ fontSize: 10, color: "#374151" }}>
                          {taskName}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
            </View>
          )}

        {/* ── Rendimiento de Operarios ── */}
        {periodOperarios.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>
              Rendimiento de Operarios — {periodLabel}
            </Text>
            <View style={s.tableHeader}>
              <View style={s.oName}>
                <Text style={s.tableHeaderText}>Operario</Text>
              </View>
              <View style={s.oBar}>
                <Text style={s.tableHeaderText}>Actividad en el período</Text>
              </View>
              <View style={s.oNum}>
                <Text style={[s.tableHeaderText, { textAlign: "center" }]}>
                  Tareas
                </Text>
              </View>
            </View>
            {periodOperarios.map((op, i) => (
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
                          width: `${Math.round((op.completedInPeriod / maxOpPeriod) * 100)}%`,
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
                      color: "#1e293b",
                    }}
                  >
                    {op.completedInPeriod}
                  </Text>
                </View>
              </View>
            ))}
            <View style={s.summaryBar}>
              <Text
                style={{ fontSize: 9, color: "#ffffff", fontWeight: "bold" }}
              >
                {periodOperarios.length} operario
                {periodOperarios.length !== 1 ? "s" : ""} con actividad
              </Text>
              <Text style={{ fontSize: 9, color: "#94a3b8" }}>
                {fmt(
                  periodOperarios.reduce(
                    (acc, o) => acc + o.completedInPeriod,
                    0,
                  ),
                )}{" "}
                tareas {periodMode === "week" ? "esta semana" : "este mes"}
              </Text>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
