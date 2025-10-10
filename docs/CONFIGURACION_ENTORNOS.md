# Configuración de Entornos - ModularQ

## 🎯 **Arquitectura de Bases de Datos**

El proyecto ModularQ utiliza **dos proyectos Supabase separados** para mantener un entorno de desarrollo limpio y separado de producción:

### **Desarrollo**
- **Proyecto**: Modularq-dev
- **Project Ref**: `ikkbutvsazkvveodxzhf`
- **URL**: `https://ikkbutvsazkvveodxzhf.supabase.co`

### **Producción**
- **Proyecto**: Modularq-prod  
- **Project Ref**: `zgiaqhlorktvggtxtaok`
- **URL**: `https://zgiaqhlorktvggtxtaok.supabase.co`

## 🔧 **Variables de Entorno**

### **Para Desarrollo (`.env.local`)**
```env
# Desarrollo
NEXT_PUBLIC_SUPABASE_URL_DEV=https://ikkbutvsazkvveodxzhf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra2J1dHZzYXprdnZlb2R4emhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzYzODYsImV4cCI6MjA3NDQxMjM4Nn0.BRVyWneTrmp2Z1_FstM29-bTEayvPtDHT6LAZDmSCZ4
SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_service_role_key_here

# Fallback (para compatibilidad)
NEXT_PUBLIC_SUPABASE_URL=https://ikkbutvsazkvveodxzhf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra2J1dHZzYXprdnZlb2R4emhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzYzODYsImV4cCI6MjA3NDQxMjM4Nn0.BRVyWneTrmp2Z1_FstM29-bTEayvPtDHT6LAZDmSCZ4
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key_here

NODE_ENV=development
```

### **Para Producción (Vercel)**
```env
# Producción
NEXT_PUBLIC_SUPABASE_URL_PROD=https://zgiaqhlorktvggtxtaok.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaWFxaGxvcmt0dmdndHh0YW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzYzODYsImV4cCI6MjA3NDQxMjM4Nn0.BRVyWneTrmp2Z1_FstM29-bTEayvPtDHT6LAZDmSCZ4
SUPABASE_SERVICE_ROLE_KEY_PROD=your_prod_service_role_key_here

# Fallback (para compatibilidad)
NEXT_PUBLIC_SUPABASE_URL=https://zgiaqhlorktvggtxtaok.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaWFxaGxvcmt0dmdndHh0YW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzYzODYsImV4cCI6MjA3NDQxMjM4Nn0.BRVyWneTrmp2Z1_FstM29-bTEayvPtDHT6LAZDmSCZ4
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key_here

NODE_ENV=production
```

## 🚀 **Cómo Funciona**

### **Configuración Automática**
El sistema automáticamente selecciona la base de datos correcta según el entorno:

- **Desarrollo**: Usa variables `*_DEV` o fallback a variables estándar
- **Producción**: Usa variables `*_PROD` o fallback a variables estándar

### **Ventajas de esta Arquitectura**

1. **✅ Separación completa** entre desarrollo y producción
2. **✅ Datos de prueba** sin afectar producción
3. **✅ Migraciones independientes** en cada entorno
4. **✅ Rollbacks seguros** sin afectar producción
5. **✅ Testing aislado** con datos controlados

## 🔄 **MCP Configuration**

El archivo `mcp.json` está configurado para ambos proyectos:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref=zgiaqhlorktvggtxtaok"],
      "env": { "SUPABASE_ACCESS_TOKEN": "..." }
    },
    "supabase-dev": {
      "command": "npx", 
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref=ikkbutvsazkvveodxzhf"],
      "env": { "SUPABASE_ACCESS_TOKEN": "..." }
    }
  }
}
```

## 📋 **Próximos Pasos**

1. **Configura las variables** en tu `.env.local`
2. **Obtén las Service Role Keys** de ambos proyectos Supabase
3. **Prueba el sistema** en desarrollo
4. **Actualiza Vercel** con las variables de producción

¡Ahora tienes un sistema completamente separado y profesional! 🎉
