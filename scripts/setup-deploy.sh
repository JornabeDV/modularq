#!/bin/bash

# Script de setup para ModularQ - Configuración de Deploy
# Este script configura todo lo necesario para un flujo de deploy robusto

set -e

echo "🚀 Setting up ModularQ deployment pipeline..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar errores
show_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Función para mostrar éxito
show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar información
show_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Función para mostrar advertencias
show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    show_error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
fi

echo ""
echo "📋 Configuración de Deploy para ModularQ"
echo "========================================"
echo ""

# 1. Configurar Git hooks
show_info "Configurando Git hooks..."
if [ ! -d ".git/hooks" ]; then
    show_error "No se encontró el directorio .git/hooks. Asegúrate de estar en un repositorio Git."
fi

# Copiar el pre-commit hook
if [ -f ".hooks/pre-commit" ]; then
    cp .hooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    show_success "Pre-commit hook configurado"
else
    show_warning "No se encontró .hooks/pre-commit"
fi

# 2. Verificar dependencias necesarias
show_info "Verificando dependencias..."

# Verificar pnpm
if ! command -v pnpm &> /dev/null; then
    show_error "pnpm no está instalado. Instálalo con: npm install -g pnpm"
fi
show_success "pnpm está instalado"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    show_error "Node.js no está instalado"
fi
show_success "Node.js está instalado"

# 3. Instalar dependencias de desarrollo adicionales
show_info "Instalando dependencias adicionales para CI/CD..."
pnpm add -D husky lint-staged prettier

# 4. Configurar husky
show_info "Configurando Husky..."
npx husky install
npx husky add .husky/pre-commit "pnpm lint-staged"

# 5. Crear archivo de configuración de prettier
show_info "Configurando Prettier..."
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOF

# 6. Crear archivo .env.example
show_info "Creando archivo .env.example..."
cat > .env.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Environment
NODE_ENV=development

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Vercel (opcional)
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_vercel_org_id_here
VERCEL_PROJECT_ID=your_vercel_project_id_here
EOF

# 7. Crear script de validación pre-deploy
show_info "Creando script de validación pre-deploy..."
cat > scripts/validate-pre-deploy.sh << 'EOF'
#!/bin/bash

# Script de validación pre-deploy
# Ejecuta todas las validaciones necesarias antes del deploy

set -e

echo "🔍 Running pre-deploy validation..."

# Ejecutar todas las validaciones
pnpm type-check
pnpm lint
pnpm test
pnpm test:e2e
pnpm build

echo "✅ All validations passed! Ready for deployment."
EOF

chmod +x scripts/validate-pre-deploy.sh

# 8. Crear script de rollback
show_info "Creando script de rollback..."
cat > scripts/rollback.sh << 'EOF'
#!/bin/bash

# Script de rollback para ModularQ
# Uso: ./scripts/rollback.sh [environment] [commit_hash]

set -e

ENVIRONMENT=${1:-production}
COMMIT_HASH=${2:-HEAD~1}

echo "🔄 Rolling back $ENVIRONMENT to commit $COMMIT_HASH..."

# Aquí irían los comandos específicos de rollback según tu plataforma
# Por ejemplo, para Vercel:
if command -v vercel &> /dev/null; then
    echo "🌐 Rolling back Vercel deployment..."
    vercel rollback $COMMIT_HASH --prod
else
    echo "⚠️  Vercel CLI no encontrado. Rollback manual requerido."
fi

echo "✅ Rollback completed!"
EOF

chmod +x scripts/rollback.sh

# 9. Mostrar resumen de configuración
echo ""
echo "🎉 Configuración completada!"
echo "============================="
echo ""
echo "📁 Archivos creados:"
echo "   - .github/workflows/ci.yml (CI/CD pipeline)"
echo "   - .github/workflows/deploy-staging.yml (Deploy a staging)"
echo "   - .github/workflows/deploy-production.yml (Deploy a producción)"
echo "   - .hooks/pre-commit (Pre-commit hook)"
echo "   - .prettierrc (Configuración de Prettier)"
echo "   - .env.example (Variables de entorno de ejemplo)"
echo "   - scripts/validate-pre-deploy.sh (Validación pre-deploy)"
echo "   - scripts/rollback.sh (Script de rollback)"
echo ""
echo "🔧 Próximos pasos:"
echo "   1. Configura los secrets en GitHub:"
echo "      - Ve a Settings > Secrets and variables > Actions"
echo "      - Agrega los secrets necesarios (VERCEL_TOKEN, SUPABASE_*, etc.)"
echo ""
echo "   2. Configura los environments en GitHub:"
echo "      - Ve a Settings > Environments"
echo "      - Crea los environments 'staging' y 'production'"
echo "      - Configura las protection rules si es necesario"
echo ""
echo "   3. Configura Vercel:"
echo "      - Conecta tu repositorio con Vercel"
echo "      - Configura las variables de entorno"
echo "      - Configura los dominios para staging y producción"
echo ""
echo "   4. Prueba el flujo:"
echo "      - Haz un commit en la rama 'dev'"
echo "      - Verifica que se ejecute el deploy a staging"
echo "      - Haz merge a 'main'"
echo "      - Verifica que se ejecute el deploy a producción"
echo ""
echo "💡 Comandos útiles:"
echo "   - Validar antes de commit: git add . && git commit"
echo "   - Validar antes de deploy: ./scripts/validate-pre-deploy.sh"
echo "   - Rollback: ./scripts/rollback.sh production <commit_hash>"
echo ""
show_success "¡Setup completado! Tu flujo de deploy está listo."

