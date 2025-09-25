# 🏭 ModularQ - Sistema de Gestión de Operarios Industriales

[![Next.js](https://img.shields.io/badge/Next.js-14.2.16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.13-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)

> **ModularQ** es una aplicación web moderna para la gestión integral de operarios industriales, proyectos y tareas. Diseñada para optimizar la productividad y el seguimiento en entornos de producción.

## 📋 Tabla de Contenidos

- [✨ Características](#-características)
- [🚀 Demo en Vivo](#-demo-en-vivo)
- [🛠️ Tecnologías](#️-tecnologías)
- [📦 Instalación](#-instalación)
- [🔧 Configuración](#-configuración)
- [👥 Usuarios de Prueba](#-usuarios-de-prueba)
- [📱 Capturas de Pantalla](#-capturas-de-pantalla)
- [🏗️ Estructura del Proyecto](#️-estructura-del-proyecto)
- [🔐 Sistema de Autenticación](#-sistema-de-autenticación)
- [📊 Funcionalidades Principales](#-funcionalidades-principales)
- [🤝 Contribuir](#-contribuir)
- [📄 Licencia](#-licencia)

## ✨ Características

### 🎯 **Gestión Integral**
- **Dashboard** con métricas en tiempo real
- **Gestión de Proyectos** con seguimiento de progreso
- **Control de Operarios** y asignación de tareas
- **Seguimiento de Tiempo** y productividad
- **Sistema de Reportes** avanzado
- **Auditoría** completa de actividades

### 🎨 **Interfaz Moderna**
- Diseño responsive y accesible
- Componentes UI reutilizables
- Tema claro/oscuro
- Animaciones suaves
- Iconografía intuitiva

### 🔒 **Seguridad y Roles**
- Sistema de autenticación robusto
- Control de acceso basado en roles
- Logs de auditoría detallados
- Validación de datos en tiempo real

## 🚀 Demo en Vivo

```bash
# Clona el repositorio
git clone https://github.com/tu-usuario/modularq.git

# Instala las dependencias
pnpm install

# Ejecuta en modo desarrollo
pnpm dev

# Abre http://localhost:3000 en tu navegador
```

## 🛠️ Tecnologías

### **Frontend**
- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos
- **Radix UI** - Componentes accesibles
- **Lucide React** - Iconografía
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

### **UI/UX**
- **shadcn/ui** - Sistema de componentes
- **Framer Motion** - Animaciones
- **Recharts** - Gráficos y visualizaciones
- **Date-fns** - Manipulación de fechas

### **Herramientas de Desarrollo**
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **PostCSS** - Procesamiento de CSS
- **pnpm** - Gestor de paquetes

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- pnpm (recomendado) o npm

### Pasos de Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/modularq.git
   cd modularq
   ```

2. **Instala las dependencias**
   ```bash
   pnpm install
   # o
   npm install
   ```

3. **Ejecuta el servidor de desarrollo**
   ```bash
   pnpm dev
   # o
   npm run dev
   ```

4. **Abre tu navegador**
   ```
   http://localhost:3000
   ```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Base de datos (para futuras integraciones)
DATABASE_URL="postgresql://..."

# Autenticación
NEXTAUTH_SECRET="tu-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Configuración de la aplicación
NEXT_PUBLIC_APP_NAME="ModularQ"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Configuración de Base de Datos

Actualmente el proyecto utiliza datos mock. Para conectar una base de datos real:

1. Configura tu base de datos PostgreSQL
2. Actualiza `DATABASE_URL` en `.env.local`
3. Ejecuta las migraciones necesarias

## 👥 Usuarios de Prueba

| Rol | Email | Contraseña | Descripción |
|-----|-------|------------|-------------|
| **Admin** | `admin@empresa.com` | `123456` | Acceso completo al sistema |
| **Supervisor** | `supervisor@empresa.com` | `123456` | Gestión de proyectos y operarios |
| **Operario** | `operario@empresa.com` | `123456` | Vista de tareas asignadas |

## 📱 Capturas de Pantalla

### Dashboard Principal
![Dashboard](https://via.placeholder.com/800x400/1f2937/ffffff?text=Dashboard+Principal)

### Gestión de Proyectos
![Proyectos](https://via.placeholder.com/800x400/1f2937/ffffff?text=Gestión+de+Proyectos)

### Control de Operarios
![Operarios](https://via.placeholder.com/800x400/1f2937/ffffff?text=Control+de+Operarios)

## 🏗️ Estructura del Proyecto

```
modularq/
├── app/                    # App Router de Next.js
│   ├── dashboard/         # Dashboard principal
│   ├── login/            # Página de autenticación
│   ├── operarios/        # Gestión de operarios
│   ├── projects/         # Gestión de proyectos
│   ├── tasks/           # Gestión de tareas
│   ├── time-tracking/   # Seguimiento de tiempo
│   └── reports/         # Sistema de reportes
├── components/           # Componentes reutilizables
│   ├── layout/          # Componentes de layout
│   ├── ui/              # Componentes base (shadcn/ui)
│   ├── tasks/           # Componentes específicos de tareas
│   ├── reports/         # Componentes de reportes
│   └── time-tracking/   # Componentes de seguimiento
├── lib/                 # Utilidades y configuración
│   ├── auth-context.tsx # Contexto de autenticación
│   ├── types.ts         # Definiciones de tipos
│   ├── mock-data.ts     # Datos de prueba
│   └── utils.ts         # Utilidades generales
├── hooks/               # Custom hooks
├── styles/              # Estilos globales
└── public/              # Archivos estáticos
```

## 🔐 Sistema de Autenticación

### Roles y Permisos

| Rol | Proyectos | Operarios | Tareas | Reportes | Configuración |
|-----|-----------|-----------|--------|----------|---------------|
| **Admin** | ✅ Completo | ✅ Completo | ✅ Completo | ✅ Completo | ✅ Completo |
| **Supervisor** | ✅ Lectura/Escritura | ✅ Lectura/Escritura | ✅ Lectura/Escritura | ✅ Lectura | ❌ |
| **Operario** | ✅ Solo asignados | ❌ | ✅ Solo asignadas | ❌ | ❌ |

### Flujo de Autenticación

1. **Login** → Validación de credenciales
2. **Verificación** → Check de roles y permisos
3. **Redirección** → Dashboard según rol
4. **Persistencia** → Almacenamiento en localStorage

## 📊 Funcionalidades Principales

### 🏠 **Dashboard**
- Métricas en tiempo real
- Gráficos de productividad
- Estado de proyectos activos
- Actividad reciente

### 📋 **Gestión de Proyectos**
- Creación y edición de proyectos
- Asignación de operarios
- Seguimiento de progreso
- Control de presupuesto

### 👷 **Control de Operarios**
- Perfiles detallados
- Habilidades y especialidades
- Historial de tareas
- Métricas de eficiencia

### ⏱️ **Seguimiento de Tiempo**
- Registro de horas trabajadas
- Cálculo automático de tiempo
- Reportes de productividad
- Integración con tareas

### 📈 **Sistema de Reportes**
- Reportes de productividad
- Análisis de eficiencia
- Logs de auditoría
- Exportación de datos

## 🚀 Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm start        # Servidor de producción
pnpm lint         # Linting del código

# Base de datos (futuro)
pnpm db:migrate   # Ejecutar migraciones
pnpm db:seed      # Poblar base de datos
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Sigue las convenciones de código existentes
- Añade tests para nuevas funcionalidades
- Actualiza la documentación necesaria
- Usa commits descriptivos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- LinkedIn: [Tu Perfil](https://linkedin.com/in/tu-perfil)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) por el framework
- [Tailwind CSS](https://tailwindcss.com/) por el sistema de estilos
- [Radix UI](https://www.radix-ui.com/) por los componentes accesibles
- [shadcn/ui](https://ui.shadcn.com/) por el sistema de componentes

---

<div align="center">

**⭐ Si te gusta este proyecto, ¡dale una estrella! ⭐**

[Reportar Bug](https://github.com/tu-usuario/modularq/issues) • [Solicitar Feature](https://github.com/tu-usuario/modularq/issues) • [Documentación](https://github.com/tu-usuario/modularq/wiki)

</div>
