export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "planning":
      return "bg-blue-500";
    case "paused":
      return "bg-yellow-500";
    case "completed":
      return "bg-gray-500";
    case "delivered":
      return "bg-indigo-500";
    default:
      return "bg-gray-500";
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "Activo";
    case "planning":
      return "Planificación";
    case "paused":
      return "Pausado";
    case "completed":
      return "Completado";
    case "delivered":
      return "Entregado";
    default:
      return status;
  }
};

export const buildProjectMetrics = (project: any) => {
  const activeTasks = project.projectTasks.filter(
    (pt: any) => pt.status !== "cancelled"
  );

  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter(
    (pt: any) => pt.status === "completed"
  ).length;
  const inProgressTasks = activeTasks.filter(
    (pt: any) => pt.status === "in_progress"
  ).length;
  const pendingTasks = activeTasks.filter(
    (pt: any) => pt.status === "pending"
  ).length;

  const totalSubcontractors = project.projectOperarios.filter(
    (pt: any) => pt.user.role === "subcontratista"
  ).length;

  const totalOperarios = project.projectOperarios.filter(
    (pt: any) => pt.user.role === "operario"
  ).length;

  const estimatedHours = activeTasks.reduce((sum: number, pt: any) => {
    let taskEstimated = pt.estimatedHours || 0;
    if (taskEstimated === 0 && pt.task?.estimatedHours && project.moduleCount) {
      taskEstimated = pt.task.estimatedHours * project.moduleCount;
    } else if (taskEstimated === 0) {
      taskEstimated = pt.task?.estimatedHours || 0;
    }
    return sum + taskEstimated;
  }, 0);

  const completedEstimatedHours = activeTasks
    .filter((pt: any) => pt.status === "completed")
    .reduce((sum: number, pt: any) => {
      let taskEstimated = pt.estimatedHours || 0;
      if (
        taskEstimated === 0 &&
        pt.task?.estimatedHours &&
        project.moduleCount
      ) {
        taskEstimated = pt.task.estimatedHours * project.moduleCount;
      } else if (taskEstimated === 0) {
        taskEstimated = pt.task?.estimatedHours || 0;
      }
      return sum + taskEstimated;
    }, 0);

  return {
    activeTasks,
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    totalOperarios,
    totalSubcontractors,
    estimatedHours,
    completedEstimatedHours,
  };
};

export const buildOperarioStats = (project: any) => {
  const operarioStats = project.projectTasks
    .filter(
      (pt: any) =>
        pt.assignedUser && pt.assignedUser.role === "operario"
    )
    .reduce((acc: any, pt: any) => {
      const operarioName = pt.assignedUser.name;
      if (!acc[operarioName]) {
        acc[operarioName] = {
          name: operarioName,
          total: 0,
          completed: 0,
          inProgress: 0,
          assigned: 0,
          pending: 0,
          totalHours: 0,
        };
      }
      acc[operarioName].total++;

      const status = pt.status;
      if (status === "completed") acc[operarioName].completed++;
      else if (status === "in_progress") acc[operarioName].inProgress++;
      else if (status === "assigned") acc[operarioName].assigned++;
      else if (status === "pending") acc[operarioName].pending++;

      let taskEstimated = pt.estimatedHours || 0;
      if (taskEstimated === 0 && pt.task?.estimatedHours && project.moduleCount) {
        taskEstimated = pt.task.estimatedHours * project.moduleCount;
      } else if (taskEstimated === 0) {
        taskEstimated = pt.task?.estimatedHours || 0;
      }
      acc[operarioName].totalHours += taskEstimated;

      return acc;
    }, {});

  const completedWithoutOperario = project.projectTasks.filter(
    (pt: any) => pt.status === "completed" && !pt.assignedUser
  ).length;

  return {
    operarioStatsArray: Object.values(operarioStats),
    completedWithoutOperario,
  };
};


export const buildSubcontractorStats = (project: any) => {
  const subcontractorTasks = project.projectTasks.filter(
    (pt: any) => pt.assignedUser?.role === "subcontratista"
  );

  const subcontractorStats = subcontractorTasks.reduce((acc: any, pt: any) => {
    const name = pt.assignedUser?.name || "Subcontratista";

      if (!acc[name]) {
        acc[name] = {
          name,
          total: 0,
          completed: 0,
          inProgress: 0,
          assigned: 0,
          pending: 0,
          totalHours: 0,
        };
      }

      acc[name].total++;

      switch (pt.status) {
        case "completed":
          acc[name].completed++;
          break;
        case "in_progress":
          acc[name].inProgress++;
          break;
        case "assigned":
          acc[name].assigned++;
          break;
        case "pending":
          acc[name].pending++;
          break;
      }

      let taskEstimated = pt.estimatedHours || 0;
      if (taskEstimated === 0 && pt.task?.estimatedHours && project.moduleCount) {
        taskEstimated = pt.task.estimatedHours * project.moduleCount;
      } else if (taskEstimated === 0) {
        taskEstimated = pt.task?.estimatedHours || 0;
      }
      acc[name].totalHours += taskEstimated;

    return acc;
  }, {});

  const completedWithoutSubcontractor = project.projectTasks.filter(
    (pt: any) =>
      pt.status === "completed" &&
      !pt.assignedUser &&
      (!pt.assignedUser || pt.assignedUser?.role !== "operario")
  ).length;

  return {
    subcontractorStatsArray: Object.values(subcontractorStats),
    completedWithoutSubcontractor,
  };
};
