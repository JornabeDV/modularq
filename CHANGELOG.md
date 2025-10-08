# Changelog

Todos los notables cambios a este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Nueva funcionalidad de exportación de reportes en PDF
- Sistema de notificaciones push para móviles
- Filtros avanzados en la vista de tareas

### Changed
- Mejorado el rendimiento del dashboard principal
- Actualizada la interfaz de login

### Fixed
- Corregido bug en el cálculo de horas trabajadas
- Solucionado problema de sincronización de datos

### Removed
- 

### Fixed
- 

### Security
- Actualizada validación de entrada de datos
- Mejorada autenticación de API


### Technical
- 

## [1.1.0] - 2024-02-15

### Added
- Estructura de configuración por ambientes
- Scripts de automatización para build y deployment
- CI/CD con GitHub Actions
- Health checks y monitoreo
- Documentación completa de desarrollo y deployment
- Configuración de testing con Jest y Playwright
- Scripts de backup automatizado

### Changed
- Reorganización completa del proyecto para producción
- Mejora en la configuración de TypeScript
- Optimización de scripts de package.json

### Security
- Configuración de alertas de seguridad
- Health checks para verificar estado de la aplicación

## [1.0.0] - 2024-01-XX

### Added
- Sistema de autenticación dual (email/password y username/password)
- Gestión de roles (Administrador y Operario)
- Sistema de gestión de proyectos con estados
- Sistema de tareas estándar y personalizadas
- Seguimiento de tiempo con cronómetro inteligente
- Sistema de colaboración en tareas
- Reportes de productividad y análisis
- Dashboard ejecutivo
- Sistema de notificaciones y alertas
- Integración con Supabase
- PWA (Progressive Web App)
- Interfaz responsiva con Tailwind CSS

### Technical
- Next.js 14 con App Router
- TypeScript para type safety
- Supabase para backend y autenticación
- React Hook Form para formularios
- Radix UI para componentes
- Recharts para gráficos
- PWA con next-pwa