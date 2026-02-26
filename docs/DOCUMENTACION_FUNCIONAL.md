# Documentación Funcional - Sistema ModulArq

## Descripción General

**ModulArq** es un sistema web de gestión de operarios industriales diseñado para optimizar la productividad y el control de tareas en entornos de manufactura. El sistema centraliza la administración de proyectos, asignación de tareas, seguimiento de tiempo y análisis de rendimiento, proporcionando una plataforma integral para la gestión del personal operativo.

El sistema resuelve los problemas comunes en la gestión de operarios industriales como la falta de visibilidad del progreso de tareas, la dificultad para rastrear el tiempo trabajado, la asignación ineficiente de recursos y la ausencia de métricas de productividad en tiempo real.

---

## Funcionalidades Principales

### 1. Sistema de Autenticación y Roles

#### **Autenticación Dual**
El sistema implementa un mecanismo de autenticación híbrido que combina:
- **Login tradicional**: Autenticación por email y contraseña usando Supabase Auth
- **Login simplificado**: Autenticación por nombre de usuario (primer nombre) y contraseña personalizada

#### **Gestión de Roles**
- **Administrador (`admin`)**: Acceso completo al sistema, gestión de usuarios, proyectos y reportes
- **Operario (`operario`)**: Acceso limitado a proyectos asignados y sus tareas específicas

#### **Protección de Rutas**
- **Route Guards**: Componentes que protegen automáticamente las rutas según el rol del usuario
- **Redirección inteligente**: Los usuarios son redirigidos automáticamente a su área correspondiente según su rol
- **Sesiones persistentes**: El sistema mantiene la sesión del usuario incluso después de cerrar el navegador

#### **Ejemplo de Uso**
Un operario llamado "Juan Pérez" puede iniciar sesión simplemente escribiendo "Juan" como usuario y su contraseña personalizada. El sistema lo autentica y lo redirige automáticamente a la vista de proyectos activos donde puede ver únicamente los proyectos en los que está asignado.

---

### 2. Gestión de Proyectos

#### **Creación y Administración de Proyectos**
- **Estados de proyecto**: Planning, Active, On-hold, Completed, Cancelled
- **Metadatos completos**: Nombre, descripción, fechas de inicio/fin, supervisor, presupuesto
- **Progreso automático**: Cálculo automático del progreso basado en tareas completadas
- **Asignación de operarios**: Los administradores pueden asignar múltiples operarios a cada proyecto

#### **Vista de Proyectos para Operarios**
- **Filtrado automático**: Los operarios solo ven proyectos activos donde están asignados
- **Información contextual**: Progreso del proyecto, número de tareas, fechas importantes
- **Navegación directa**: Acceso rápido a los detalles de cada proyecto

#### **Gestión Avanzada para Administradores**
- **Dashboard ejecutivo**: Vista general con estadísticas de todos los proyectos
- **Filtros y búsqueda**: Capacidad de filtrar por estado, nombre o descripción
- **Edición en tiempo real**: Modificación de proyectos sin interrumpir el trabajo de los operarios
- **Eliminación segura**: Confirmación antes de eliminar proyectos con tareas asociadas

#### **Ejemplo de Uso**
Un administrador crea un proyecto "Instalación de Línea de Producción A" con fecha de inicio 1 de enero y fin 15 de febrero. Asigna a 3 operarios especializados. Los operarios asignados pueden ver inmediatamente el proyecto en su lista de proyectos activos, mientras que otros operarios no tienen acceso a esta información.

---

### 3. Sistema de Tareas

#### **Tipos de Tareas**
- **Tareas Estándar (`standard`)**: Se asignan automáticamente a todos los proyectos nuevos
- **Tareas Personalizadas (`custom`)**: Se asignan manualmente a proyectos específicos

#### **Categorización de Tareas**
El sistema incluye 18 categorías predefinidas:
- Instalación, Calidad, Mantenimiento, Producción, Logística, Seguridad
- Administrativo, Investigación, Preparación, Corte, Ensamblaje, Perforado
- Sellado, Pintura, Fijación, Eléctrico, Control de Calidad, Limpieza

#### **Estados de Tareas**
- **Pendiente (`pending`)**: Tarea creada pero no iniciada
- **En Progreso (`in_progress`)**: Tarea activa con tiempo siendo registrado
- **Completada (`completed`)**: Tarea finalizada exitosamente
- **Cancelada (`cancelled`)**: Tarea cancelada por alguna razón

#### **Gestión de Tareas en Proyectos**
- **Asignación individual**: Cada tarea puede ser asignada a un operario específico
- **Colaboradores**: Sistema de colaboradores adicionales para tareas complejas
- **Seguimiento de horas**: Registro automático de horas estimadas vs. horas reales trabajadas
- **Progreso granular**: Seguimiento del porcentaje de completado de cada tarea

#### **Ejemplo de Uso**
Un administrador crea una tarea estándar "Instalación de Equipos Eléctricos" con 8 horas estimadas. Esta tarea se asigna automáticamente a todos los proyectos nuevos. Cuando se crea el proyecto "Línea A", la tarea aparece automáticamente en la lista de tareas del proyecto y puede ser asignada a un operario eléctrico específico.

---

### 4. Sistema de Seguimiento de Tiempo

#### **Cronómetro Inteligente**
- **Persistencia local**: El cronómetro mantiene su estado incluso si se cierra el navegador
- **Límites automáticos**: Detiene automáticamente cuando se alcanza el tiempo estimado de la tarea
- **Advertencias**: Notifica cuando se acerca al 90% del tiempo estimado
- **Formato legible**: Muestra tiempo en formato HH:MM:SS

#### **Registro de Sesiones**
- **Inicio/Fin de sesión**: Registro preciso de cuándo se inicia y detiene el trabajo
- **Motivos de detención**: Sistema de categorización de por qué se detiene una tarea:
  - Completé la tarea
  - Necesito un descanso
  - Necesito hacer otra tarea
  - Tengo una reunión
  - Terminé mi jornada
  - Otro (con especificación personalizada)

#### **Cálculo Automático de Progreso**
- **Progreso basado en horas**: El porcentaje de completado se calcula automáticamente basado en horas trabajadas vs. horas estimadas
- **Actualización en tiempo real**: El progreso se actualiza automáticamente en la base de datos
- **Sincronización**: Los cambios se reflejan inmediatamente en todas las vistas del sistema

#### **Historial de Tiempo**
- **Registro detallado**: Cada sesión de trabajo queda registrada con fecha, hora de inicio/fin, duración y motivo
- **Vista cronológica**: Los operarios pueden ver su historial de trabajo ordenado por fecha
- **Filtros**: Posibilidad de filtrar por proyecto, tarea o rango de fechas

#### **Ejemplo de Uso**
Un operario inicia el cronómetro para la tarea "Instalación Eléctrica" a las 8:00 AM. Trabaja hasta las 10:30 AM y detiene el cronómetro seleccionando "Necesito un descanso". El sistema registra 2.5 horas trabajadas, actualiza el progreso de la tarea al 31.25% (2.5h de 8h estimadas) y guarda la entrada en el historial con el motivo especificado.

---

### 5. Gestión de Usuarios y Operarios

#### **Administración de Personal**
- **Creación de usuarios**: Los administradores pueden crear nuevos operarios con nombre, rol y habilidades
- **Gestión de contraseñas**: Sistema de contraseñas personalizadas para cada usuario
- **Roles y permisos**: Asignación automática de permisos según el rol (admin/operario)
- **Edición de perfiles**: Modificación de información personal y habilidades

#### **Perfiles de Operarios**
- **Información básica**: Nombre, email, rol, habilidades especializadas
- **Métricas de rendimiento**: Horas totales trabajadas, eficiencia calculada
- **Estadísticas de tareas**: Número de tareas completadas, en progreso y pendientes
- **Tasa de finalización**: Porcentaje de tareas completadas exitosamente

#### **Sistema de Habilidades**
- **Categorización**: Los operarios pueden tener habilidades específicas (eléctrico, mecánico, soldadura, etc.)
- **Asignación inteligente**: Las tareas pueden ser asignadas considerando las habilidades del operario
- **Desarrollo profesional**: Seguimiento de nuevas habilidades adquiridas

#### **Ejemplo de Uso**
Un administrador crea un nuevo operario "María González" con habilidades en "Soldadura" y "Corte". Le asigna una contraseña personalizada. María puede iniciar sesión inmediatamente y será asignada preferentemente a tareas que requieran sus habilidades especializadas.

---

### 6. Sistema de Colaboración en Tareas

#### **Colaboradores Adicionales**
- **Asignación múltiple**: Una tarea puede tener un operario principal y colaboradores adicionales
- **Roles diferenciados**: El operario principal puede agregar colaboradores según las necesidades
- **Seguimiento individual**: Cada colaborador puede registrar su tiempo independientemente
- **Coordinación**: Los colaboradores pueden ver el progreso de la tarea y las contribuciones de otros

#### **Gestión de Equipos**
- **Formación de equipos**: Los operarios pueden trabajar en equipo en tareas complejas
- **Comunicación**: Sistema de notas y comentarios para coordinación
- **Responsabilidades**: Cada miembro del equipo tiene responsabilidades claras

#### **Ejemplo de Uso**
La tarea "Instalación de Sistema de Ventilación" requiere conocimientos eléctricos y mecánicos. Se asigna como operario principal a "Carlos" (eléctrico) quien agrega como colaborador a "Ana" (mecánica). Ambos pueden registrar su tiempo independientemente y el progreso total de la tarea se calcula combinando ambas contribuciones.

---

### 7. Sistema de Reportes y Análisis

#### **Reporte de Productividad**
- **Métricas individuales**: Eficiencia, tasa de finalización, horas trabajadas por operario
- **Comparativas**: Comparación de rendimiento entre operarios
- **Tendencias**: Análisis de mejora o deterioro en el rendimiento
- **Identificación de problemas**: Detección automática de operarios con bajo rendimiento

#### **Análisis de Proyectos**
- **Progreso general**: Estado actual de todos los proyectos activos
- **Desviaciones de tiempo**: Comparación entre horas estimadas y reales
- **Eficiencia por proyecto**: Rendimiento específico de cada proyecto
- **Predicciones**: Estimaciones de finalización basadas en el progreso actual

#### **Reporte de Auditoría**
- **Registro completo**: Historial de todas las acciones realizadas en el sistema
- **Trazabilidad**: Quién hizo qué y cuándo
- **Cambios documentados**: Registro de modificaciones con valores anteriores y nuevos
- **Filtros avanzados**: Búsqueda por usuario, acción, entidad o fecha

#### **Métricas Clave**
- **Tasa de finalización general**: Porcentaje de tareas completadas en el sistema
- **Eficiencia promedio**: Relación entre tiempo estimado y tiempo real
- **Horas registradas**: Total de horas trabajadas en el sistema
- **Tareas completadas**: Número absoluto de tareas finalizadas

#### **Ejemplo de Uso**
Un administrador genera un reporte de productividad del último mes. El sistema muestra que la eficiencia general es del 87%, que "Juan" tiene una tasa de finalización del 95% mientras que "Pedro" está al 78%, y que el proyecto "Línea A" está 15% por encima del tiempo estimado. Esta información permite tomar decisiones informadas sobre asignaciones futuras.

---

### 8. Dashboard Ejecutivo

#### **Vista General para Administradores**
- **Estadísticas clave**: Proyectos activos, operarios registrados, tareas en progreso, eficiencia promedio
- **Proyectos destacados**: Vista de tarjetas con información resumida de cada proyecto activo
- **Accesos rápidos**: Enlaces directos a gestión de personal, reportes y configuración
- **Alertas**: Notificaciones sobre proyectos atrasados o operarios con bajo rendimiento

#### **Métricas en Tiempo Real**
- **Actualización automática**: Las estadísticas se actualizan automáticamente sin necesidad de recargar
- **Indicadores visuales**: Barras de progreso, badges de estado y gráficos intuitivos
- **Comparativas**: Comparación con períodos anteriores
- **Tendencias**: Identificación de patrones y tendencias en el rendimiento

#### **Navegación Intuitiva**
- **Menú contextual**: Acceso rápido a funciones según el rol del usuario
- **Breadcrumbs**: Navegación clara dentro del sistema
- **Búsqueda global**: Capacidad de buscar proyectos, tareas o usuarios desde cualquier vista

#### **Ejemplo de Uso**
Un administrador accede al dashboard y ve inmediatamente que hay 5 proyectos activos, 12 operarios registrados, 23 tareas en progreso y una eficiencia promedio del 87%. Puede hacer clic en cualquier proyecto para ver detalles específicos o acceder directamente a la gestión de personal con un solo clic.

---

### 9. Sistema de Notificaciones y Alertas

#### **Alertas de Progreso**
- **Límites de tiempo**: Notificación cuando una tarea se acerca al tiempo estimado
- **Proyectos atrasados**: Alertas automáticas cuando un proyecto no cumple con las fechas planificadas
- **Tareas bloqueadas**: Notificaciones cuando una tarea no progresa por varios días

#### **Notificaciones de Sistema**
- **Cambios de asignación**: Notificación cuando se asigna una nueva tarea
- **Actualizaciones de proyecto**: Información sobre cambios en proyectos asignados
- **Recordatorios**: Notificaciones para completar tareas pendientes

#### **Ejemplo de Uso**
Un operario recibe una notificación cuando se le asigna una nueva tarea en un proyecto. Si lleva más de 6 horas trabajando en una tarea estimada en 8 horas, recibe una alerta de que se está acercando al límite. Si un proyecto está atrasado, el administrador recibe una alerta para tomar medidas correctivas.

---

### 10. Integración y Sincronización

#### **Base de Datos en Tiempo Real**
- **Supabase**: Base de datos PostgreSQL con sincronización en tiempo real
- **Actualizaciones automáticas**: Los cambios se reflejan inmediatamente en todas las vistas
- **Consistencia de datos**: Garantía de integridad de datos en todas las operaciones

#### **Persistencia Local**
- **LocalStorage**: Almacenamiento local para mantener el estado del cronómetro
- **Recuperación de sesión**: Capacidad de recuperar el trabajo en caso de interrupciones
- **Sincronización**: Los datos locales se sincronizan automáticamente con la base de datos

#### **API RESTful**
- **Endpoints estructurados**: API bien definida para todas las operaciones
- **Autenticación segura**: Tokens JWT para autenticación de API
- **Validación de datos**: Validación robusta de todos los datos de entrada

#### **Ejemplo de Uso**
Un operario está trabajando en una tarea cuando se va la luz. Al regresar y abrir el sistema, el cronómetro mantiene el tiempo transcurrido gracias al almacenamiento local. Cuando se restablece la conexión, los datos se sincronizan automáticamente con la base de datos y el progreso se actualiza en tiempo real para todos los usuarios.

---

## Detalles Adicionales

### **Configuraciones Avanzadas**

#### **Categorías de Tareas Personalizables**
El sistema incluye 18 categorías predefinidas que cubren la mayoría de actividades industriales, pero el sistema está diseñado para permitir la adición de nuevas categorías según las necesidades específicas de cada empresa.

#### **Sistema de Prioridades**
Las tareas pueden tener diferentes niveles de prioridad:
- **Crítica**: Tareas que bloquean otros trabajos
- **Alta**: Tareas importantes con fecha límite próxima
- **Media**: Tareas estándar sin urgencia especial
- **Baja**: Tareas que pueden posponerse sin impacto

#### **Configuración de Proyectos**
- **Presupuestos**: Asignación de presupuestos a proyectos para control financiero
- **Supervisores**: Asignación de supervisores responsables de cada proyecto
- **Fechas flexibles**: Sistema de fechas de inicio y fin con capacidad de modificación

### **Relaciones Entre Componentes**

#### **Proyectos ↔ Operarios**
- **Asignación múltiple**: Un proyecto puede tener múltiples operarios asignados
- **Roles específicos**: Cada operario puede tener un rol específico en el proyecto
- **Permisos granulares**: Los operarios solo ven proyectos donde están asignados

#### **Tareas ↔ Proyectos**
- **Tareas estándar**: Se asignan automáticamente a todos los proyectos nuevos
- **Tareas personalizadas**: Se asignan manualmente según las necesidades específicas
- **Progreso del proyecto**: Se calcula automáticamente basado en el progreso de las tareas

#### **Tiempo ↔ Tareas**
- **Registro automático**: El tiempo trabajado se registra automáticamente en las tareas
- **Cálculo de progreso**: El progreso de las tareas se calcula basado en horas trabajadas vs. estimadas
- **Historial completo**: Cada sesión de trabajo queda registrada con detalles completos

#### **Reportes ↔ Datos Operativos**
- **Análisis en tiempo real**: Los reportes se generan con datos actualizados en tiempo real
- **Métricas automáticas**: Las métricas se calculan automáticamente sin intervención manual
- **Tendencias históricas**: Capacidad de analizar tendencias a lo largo del tiempo

### **Escalabilidad y Rendimiento**

#### **Arquitectura Modular**
El sistema está diseñado con una arquitectura modular que permite:
- **Expansión fácil**: Adición de nuevas funcionalidades sin afectar las existentes
- **Mantenimiento simplificado**: Cada módulo puede ser mantenido independientemente
- **Personalización**: Adaptación a necesidades específicas de cada empresa

#### **Optimización de Consultas**
- **Índices de base de datos**: Optimización de consultas frecuentes
- **Caché inteligente**: Almacenamiento en caché de datos frecuentemente accedidos
- **Paginación**: Manejo eficiente de grandes volúmenes de datos

#### **Experiencia de Usuario**
- **Interfaz responsiva**: Funciona correctamente en dispositivos móviles y de escritorio
- **Carga progresiva**: Los datos se cargan progresivamente para mejorar la experiencia
- **Feedback visual**: Indicadores claros de estado y progreso en todas las operaciones

---

## Conclusión

El Sistema ModulArq proporciona una solución integral para la gestión de operarios industriales, combinando funcionalidades avanzadas de gestión de proyectos, seguimiento de tiempo preciso, análisis de productividad y colaboración en equipo. Su diseño modular y escalable permite adaptarse a las necesidades específicas de cada empresa mientras mantiene la simplicidad de uso para los operarios y la potencia analítica para los administradores.

El sistema está diseñado para crecer con la empresa, proporcionando las herramientas necesarias para optimizar la productividad, mejorar la visibilidad del trabajo y tomar decisiones informadas basadas en datos reales de rendimiento.
