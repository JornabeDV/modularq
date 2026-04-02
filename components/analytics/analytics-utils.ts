export const getMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const processMonthlyProjectData = (
  projects: any[],
  dateField: 'createdAt' | 'updatedAt' | 'completedAt' = 'createdAt',
  filterFn?: (project: any) => boolean
): Array<{ semana: string; proyectos: number; fecha: string }> => {
  const filteredProjects = filterFn ? projects.filter(filterFn) : projects;

  const today = new Date();
  const fallback = [{
    semana: today.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
    proyectos: 0,
    fecha: getMonthKey(today),
  }];

  if (!projects || projects.length === 0 || filteredProjects.length === 0) return fallback;

  const minDate = new Date(Math.min(...filteredProjects.map(p => new Date(p[dateField]).getTime())));
  const months: { key: string; label: string; count: number }[] = [];
  const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 1);

  while (current <= end) {
    const key = getMonthKey(current);
    const label = current.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    const count = filteredProjects.filter(p => getMonthKey(new Date(p[dateField])) === key).length;
    months.push({ key, label, count });
    current.setMonth(current.getMonth() + 1);
  }

  return months.map(m => ({ semana: m.label, proyectos: m.count, fecha: m.key }));
};

export const processTaskCompletionData = (
  projects: any[],
  mode: 'week' | 'month'
): Array<{ semana: string; tareas: number; fecha: string }> => {
  const allTasks = projects.flatMap(p => p.projectTasks || []);
  const completedTasks = allTasks.filter(t => t.status === 'completed' && t.completedAt);
  const today = new Date();

  if (mode === 'week') {
    const ws = getWeekStart(today);
    const we = new Date(ws); we.setDate(we.getDate() + 6);
    const fallbackLabel = `${ws.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - ${we.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`;

    if (completedTasks.length === 0) return [{ semana: fallbackLabel, tareas: 0, fecha: ws.toISOString().split('T')[0] }];

    const minDate = new Date(Math.min(...completedTasks.map(t => new Date(t.completedAt).getTime())));
    const todayNorm = new Date(today); todayNorm.setHours(0, 0, 0, 0);
    const todayWeekStart = getWeekStart(todayNorm);

    const weeks: { weekStart: Date; count: number }[] = [];
    const currentWeek = getWeekStart(minDate);
    while (currentWeek <= todayWeekStart) {
      const weekEnd = new Date(currentWeek); weekEnd.setDate(weekEnd.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);
      const count = completedTasks.filter(t => {
        const d = new Date(t.completedAt); d.setHours(0, 0, 0, 0);
        return d >= currentWeek && d <= weekEnd;
      }).length;
      weeks.push({ weekStart: new Date(currentWeek), count });
      currentWeek.setDate(currentWeek.getDate() + 7);
    }

    return weeks.map(w => {
      const s = w.weekStart.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      const e = new Date(w.weekStart); e.setDate(e.getDate() + 6);
      const eStr = e.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      return { semana: `${s} - ${eStr}`, tareas: w.count, fecha: w.weekStart.toISOString().split('T')[0] };
    });
  } else {
    if (completedTasks.length === 0) return [{
      semana: today.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      tareas: 0,
      fecha: getMonthKey(today),
    }];

    const minDate = new Date(Math.min(...completedTasks.map(t => new Date(t.completedAt).getTime())));
    const months: { key: string; label: string; count: number }[] = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 1);
    while (current <= end) {
      const key = getMonthKey(current);
      const label = current.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      const count = completedTasks.filter(t => getMonthKey(new Date(t.completedAt)) === key).length;
      months.push({ key, label, count });
      current.setMonth(current.getMonth() + 1);
    }
    return months.map(m => ({ semana: m.label, tareas: m.count, fecha: m.key }));
  }
};

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

export interface PeriodActivityStats {
  tasksCompleted: number;
  projectsCreated: number;
  projectsDelivered: number;
  projectsCompletedInPeriod: number;
  estimatedHours: number;
  actualHours: number;
  operarios: Array<{
    name: string;
    completedInPeriod: number;
    completedTotal: number;
    actualHoursInPeriod: number;
    activeProjects: number;
  }>;
}

export const getPeriodActivityStats = (
  projects: any[],
  mode: 'week' | 'month',
  periodKey: string // ISO date for week start, or 'YYYY-MM' for month
): PeriodActivityStats => {
  // Resolve period bounds
  let periodStart: Date;
  let periodEnd: Date;

  if (mode === 'week') {
    periodStart = new Date(periodKey);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);
  } else {
    const [year, month] = periodKey.split('-').map(Number);
    periodStart = new Date(year, month - 1, 1);
    periodEnd = new Date(year, month, 0);
    periodEnd.setHours(23, 59, 59, 999);
  }

  const inPeriod = (dateStr: string | null | undefined): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= periodStart && d <= periodEnd;
  };

  // Projects created in period
  const projectsCreated = projects.filter(p => inPeriod(p.createdAt)).length;
  // Projects delivered in period (status=delivered, deliveredAt in period)
  const projectsDelivered = projects.filter(p =>
    p.status === 'delivered' && inPeriod(p.deliveredAt ?? p.updatedAt)
  ).length;
  // Projects completed in period (status=completed, completedAt in period)
  const projectsCompletedInPeriod = projects.filter(p =>
    p.status === 'completed' && inPeriod(p.completedAt ?? p.updatedAt)
  ).length;

  // All tasks
  const allTasks = projects.flatMap(p => p.projectTasks || []);

  // Tasks completed in period
  const tasksCompletedInPeriod = allTasks.filter(
    t => t.status === 'completed' && inPeriod(t.completedAt)
  );
  const tasksCompleted = tasksCompletedInPeriod.length;

  // Aggregate hours across all projects (current state)
  const estimatedHours = Math.round(
    projects.reduce((sum, p) =>
      sum + (p.projectTasks || []).reduce((s: number, t: any) => s + (t.estimatedHours || 0), 0), 0)
  );
  const actualHours = Math.round(
    projects.reduce((sum, p) =>
      sum + (p.projectTasks || []).reduce((s: number, t: any) => s + (t.actualHours || 0), 0), 0)
  );

  // Operario stats for the period
  const allCompletedTasks = allTasks.filter(t => t.status === 'completed' && isActiveOperario(t.assignedUser));
  const periodCompletedTasks = allCompletedTasks.filter(t => inPeriod(t.completedAt));

  const operarioNames = Array.from(new Set(allCompletedTasks.map(t => t.assignedUser.name))).sort();

  const operarios = operarioNames.map(name => {
    const completedInPeriod = periodCompletedTasks.filter(t => t.assignedUser.name === name).length;
    const completedTotal = allCompletedTasks.filter(t => t.assignedUser.name === name).length;
    const periodTasks = periodCompletedTasks.filter(t => t.assignedUser.name === name);
    const actualHoursInPeriod = Math.round(
      periodTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
    );
    const activeProjects = new Set(
      allTasks
        .filter(t => isActiveOperario(t.assignedUser) && t.assignedUser.name === name && t.status !== 'cancelled')
        .map(t => t.projectId)
    ).size;
    return { name, completedInPeriod, completedTotal, actualHoursInPeriod, activeProjects };
  });

  return { tasksCompleted, projectsCreated, projectsDelivered, projectsCompletedInPeriod, estimatedHours, actualHours, operarios };
};

export const processOperarioTaskData = (
  projects: any[],
  mode: 'week' | 'month' | 'total'
): Array<{ operario: string; tareas: number }> => {
  const allTasks = projects.flatMap(p => p.projectTasks || []);
  const completedTasks = allTasks.filter(t => t.status === 'completed' && isActiveOperario(t.assignedUser));

  const today = new Date();
  let filtered = completedTasks;

  if (mode === 'week') {
    const weekStart = getWeekStart(today);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);
    filtered = completedTasks.filter(t => {
      if (!t.completedAt) return false;
      const d = new Date(t.completedAt);
      return d >= weekStart && d <= weekEnd;
    });
  } else if (mode === 'month') {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0); monthEnd.setHours(23, 59, 59, 999);
    filtered = completedTasks.filter(t => {
      if (!t.completedAt) return false;
      const d = new Date(t.completedAt);
      return d >= monthStart && d <= monthEnd;
    });
  }

  const grouped: Record<string, number> = {};
  filtered.forEach(t => {
    const name = t.assignedUser.name;
    grouped[name] = (grouped[name] || 0) + 1;
  });

  return Object.entries(grouped)
    .map(([operario, tareas]) => ({ operario, tareas }))
    .sort((a, b) => b.tareas - a.tareas);
};

const isActiveOperario = (assignedUser: any): boolean =>
  !!assignedUser &&
  assignedUser.role === 'operario' &&
  !assignedUser.deletedAt;

export const getOperarioList = (projects: any[]): string[] => {
  const allTasks = projects.flatMap(p => p.projectTasks || []);
  const names = new Set<string>();
  allTasks.forEach(t => {
    if (isActiveOperario(t.assignedUser)) names.add(t.assignedUser.name);
  });
  return Array.from(names).sort();
};

export const processOperarioEvolution = (
  projects: any[],
  operarioName: string,
  mode: 'week' | 'month'
): Array<{ semana: string; tareas: number; fecha: string }> => {
  const allTasks = projects.flatMap(p => p.projectTasks || []);
  const completedTasks = allTasks.filter(
    t => t.status === 'completed' && t.completedAt && isActiveOperario(t.assignedUser) && t.assignedUser.name === operarioName
  );
  const today = new Date();

  if (mode === 'week') {
    if (completedTasks.length === 0) {
      const ws = getWeekStart(today);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      return [{ semana: `${ws.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - ${we.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`, tareas: 0, fecha: ws.toISOString().split('T')[0] }];
    }
    const minDate = new Date(Math.min(...completedTasks.map(t => new Date(t.completedAt).getTime())));
    const todayNorm = new Date(today); todayNorm.setHours(0, 0, 0, 0);
    const todayWeekStart = getWeekStart(todayNorm);
    const weeks: { weekStart: Date; count: number }[] = [];
    const currentWeek = getWeekStart(minDate);
    while (currentWeek <= todayWeekStart) {
      const weekEnd = new Date(currentWeek); weekEnd.setDate(weekEnd.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);
      const count = completedTasks.filter(t => {
        const d = new Date(t.completedAt); d.setHours(0, 0, 0, 0);
        return d >= currentWeek && d <= weekEnd;
      }).length;
      weeks.push({ weekStart: new Date(currentWeek), count });
      currentWeek.setDate(currentWeek.getDate() + 7);
    }
    return weeks.map(w => {
      const s = w.weekStart.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      const e = new Date(w.weekStart); e.setDate(e.getDate() + 6);
      return { semana: `${s} - ${e.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`, tareas: w.count, fecha: w.weekStart.toISOString().split('T')[0] };
    });
  } else {
    if (completedTasks.length === 0) return [{ semana: today.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }), tareas: 0, fecha: getMonthKey(today) }];
    const minDate = new Date(Math.min(...completedTasks.map(t => new Date(t.completedAt).getTime())));
    const months: { key: string; label: string; count: number }[] = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 1);
    while (current <= end) {
      const key = getMonthKey(current);
      const count = completedTasks.filter(t => getMonthKey(new Date(t.completedAt)) === key).length;
      months.push({ key, label: current.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }), count });
      current.setMonth(current.getMonth() + 1);
    }
    return months.map(m => ({ semana: m.label, tareas: m.count, fecha: m.key }));
  }
};

export const getAvailablePeriods = (
  mode: 'week' | 'month'
): Array<{ key: string; label: string }> => {
  const today = new Date();
  if (mode === 'week') {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (11 - i) * 7);
      const ws = getWeekStart(d);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      return {
        key: ws.toISOString().split('T')[0],
        label: `${ws.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - ${we.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`,
      };
    });
  } else {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
      return { key: getMonthKey(d), label: d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) };
    });
  }
};

export const processOperariosForPeriod = (
  projects: any[],
  mode: 'week' | 'month' | 'total',
  periodKey: string
): Array<{ operario: string; tareas: number }> => {
  const allTasks = projects.flatMap(p => p.projectTasks || []);
  const completedTasks = allTasks.filter(t => t.status === 'completed' && t.completedAt && isActiveOperario(t.assignedUser));

  let filtered = completedTasks;
  if (mode === 'week') {
    const weekStart = new Date(periodKey);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);
    filtered = completedTasks.filter(t => {
      const d = new Date(t.completedAt); d.setHours(0, 0, 0, 0);
      return d >= weekStart && d <= weekEnd;
    });
  } else if (mode === 'month') {
    filtered = completedTasks.filter(t => getMonthKey(new Date(t.completedAt)) === periodKey);
  }

  const grouped: Record<string, number> = {};
  filtered.forEach(t => { grouped[t.assignedUser.name] = (grouped[t.assignedUser.name] || 0) + 1; });
  return Object.entries(grouped).map(([operario, tareas]) => ({ operario, tareas })).sort((a, b) => b.tareas - a.tareas);
};

export const getProgressLevel = (completionPercentage: number): string => {
  if (completionPercentage === 0) return "No iniciado";
  if (completionPercentage >= 1 && completionPercentage <= 25)
    return "Iniciado";
  if (completionPercentage >= 26 && completionPercentage <= 50)
    return "En progreso";
  if (completionPercentage >= 51 && completionPercentage <= 75)
    return "Avanzado";
  if (completionPercentage >= 76 && completionPercentage <= 99)
    return "Casi completado";
  if (completionPercentage === 100) return "Completado";
  return "No iniciado";
};

// Función para procesar datos semanales de proyectos
export const processWeeklyProjectData = (
  projects: any[],
  dateField: 'createdAt' | 'updatedAt' | 'completedAt' = 'createdAt',
  filterFn?: (project: any) => boolean,
  maxWeeks?: number
) => {
  const filteredProjects = filterFn ? projects.filter(filterFn) : projects;

  if (!projects || projects.length === 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWeekStart = getWeekStart(today);
    const weekEnd = new Date(todayWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekStartStr = todayWeekStart.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });
    const weekEndStr = weekEnd.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });

    return [
      {
        semana: `${weekStartStr} - ${weekEndStr}`,
        proyectos: 0,
        fecha: todayWeekStart.toISOString().split("T")[0],
      },
    ];
  }

  if (filteredProjects.length === 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWeekStart = getWeekStart(today);
    const weekEnd = new Date(todayWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekStartStr = todayWeekStart.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });
    const weekEndStr = weekEnd.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });

    return [
      {
        semana: `${weekStartStr} - ${weekEndStr}`,
        proyectos: 0,
        fecha: todayWeekStart.toISOString().split("T")[0],
      },
    ];
  }

  const projectDates = filteredProjects.map((p) => new Date(p[dateField]));

  const minDate = new Date(Math.min(...projectDates.map((d) => d.getTime())));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayWeekStart = getWeekStart(today);

  const weeks: { weekStart: Date; count: number }[] = [];
  const currentWeek = getWeekStart(minDate);

  while (currentWeek <= todayWeekStart) {
    const weekEnd = new Date(currentWeek);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const count = filteredProjects.filter((p) => {
      const projectDate = new Date(p[dateField]);
      projectDate.setHours(0, 0, 0, 0);
      return projectDate >= currentWeek && projectDate <= weekEnd;
    }).length;

    weeks.push({
      weekStart: new Date(currentWeek),
      count,
    });

    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    currentWeek.setTime(nextWeek.getTime());
  }

  let weeksToShow = weeks;
  if (maxWeeks && weeks.length > maxWeeks) {
    weeksToShow = weeks.slice(-maxWeeks);
  }

  return weeksToShow.map((week) => {
    const weekStartStr = week.weekStart.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });
    const weekEnd = new Date(week.weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });

    return {
      semana: `${weekStartStr} - ${weekEndStr}`,
      proyectos: week.count,
      fecha: week.weekStart.toISOString().split("T")[0],
    };
  });
};
