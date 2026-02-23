export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
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
  dateField: 'createdAt' | 'updatedAt' = 'createdAt',
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
