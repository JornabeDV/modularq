#!/bin/bash

# Script de build para ModularQ
# Uso: ./scripts/build.sh [environment]

set -e

ENVIRONMENT=${1:-production}
BUILD_DIR=".next"
DIST_DIR="dist"

echo "🏗️  Building ModularQ for $ENVIRONMENT environment..."

# Limpiar builds anteriores
if [ -d "$BUILD_DIR" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf "$BUILD_DIR"
fi

if [ -d "$DIST_DIR" ]; then
    echo "🧹 Cleaning previous dist..."
    rm -rf "$DIST_DIR"
fi

# Instalar dependencias
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Ejecutar tests
echo "🧪 Running tests..."
pnpm test

# Ejecutar linting
echo "🔍 Running linting..."
pnpm lint

# Ejecutar type checking
echo "📝 Running type checking..."
pnpm type-check

# Build de la aplicación
echo "🔨 Building application..."
NODE_ENV=$ENVIRONMENT pnpm build

# Crear directorio de distribución
echo "📁 Creating distribution directory..."
mkdir -p "$DIST_DIR"
cp -r "$BUILD_DIR"/* "$DIST_DIR/"

# Copiar archivos estáticos
echo "📄 Copying static files..."
cp -r public/* "$DIST_DIR/" 2>/dev/null || true

echo "✅ Build completed successfully!"
echo "📁 Build files are in: $DIST_DIR"
