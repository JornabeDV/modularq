#!/bin/bash

# Script de deployment para ModularQ
# Uso: ./scripts/deploy.sh [environment] [options]

set -e

ENVIRONMENT=${1:-staging}
OPTIONS=${2:-""}

echo "🚀 Deploying ModularQ to $ENVIRONMENT environment..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Verificar que existe el build
if [ ! -d ".next" ]; then
    echo "❌ Error: No se encontró el directorio .next. Ejecuta el build primero."
    exit 1
fi

# Verificar variables de entorno
if [ "$ENVIRONMENT" = "production" ]; then
    if [ -z "$PROD_SUPABASE_URL" ] || [ -z "$PROD_SUPABASE_ANON_KEY" ]; then
        echo "❌ Error: Variables de entorno de producción no configuradas."
        exit 1
    fi
fi

# Ejecutar tests antes del deployment
echo "🧪 Running pre-deployment tests..."
pnpm test

# Ejecutar build
echo "🔨 Building application..."
./scripts/build.sh "$ENVIRONMENT"

# Aquí irían los comandos específicos de deployment
# Por ejemplo, para Vercel:
if command -v vercel &> /dev/null; then
    echo "🌐 Deploying to Vercel..."
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel --prod $OPTIONS
    else
        vercel $OPTIONS
    fi
else
    echo "⚠️  Vercel CLI no encontrado. Instálalo con: npm i -g vercel"
    echo "📁 Build files están listos en .next/"
fi

echo "✅ Deployment completed successfully!"

