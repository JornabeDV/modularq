# Pre-commit hook para ModulArq (PowerShell)
# Este script se ejecuta automáticamente antes de cada commit

Write-Host "🔍 Running pre-commit validations..." -ForegroundColor Cyan

# Función para mostrar errores
function Show-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    exit 1
}

# Función para mostrar éxito
function Show-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

# Función para mostrar advertencias
function Show-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Show-Error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
}

# 1. Verificar que no hay archivos sin agregar al staging
Write-Host "📁 Checking for unstaged files..." -ForegroundColor Cyan
$unstagedFiles = git diff --name-only
if ($unstagedFiles) {
    Show-Warning "Hay archivos modificados que no están en staging. Considera agregarlos con 'git add'"
}

# 2. Ejecutar type checking
Write-Host "📝 Running TypeScript type checking..." -ForegroundColor Cyan
$typeCheckResult = pnpm type-check
if ($LASTEXITCODE -ne 0) {
    Show-Error "TypeScript type checking failed. Fix the errors before committing."
}
Show-Success "TypeScript type checking passed"

# 3. Ejecutar linting
Write-Host "🔍 Running ESLint..." -ForegroundColor Cyan
$lintResult = pnpm lint
if ($LASTEXITCODE -ne 0) {
    Show-Error "ESLint found issues. Fix them before committing."
}
Show-Success "ESLint passed"

# 4. Ejecutar tests rápidos
Write-Host "🧪 Running quick tests..." -ForegroundColor Cyan
$testResult = pnpm test --passWithNoTests --watchAll=false
if ($LASTEXITCODE -ne 0) {
    Show-Error "Tests failed. Fix the issues before committing."
}
Show-Success "Tests passed"

# 5. Verificar que el build funciona
Write-Host "🔨 Testing build..." -ForegroundColor Cyan
$buildResult = pnpm build
if ($LASTEXITCODE -ne 0) {
    Show-Error "Build failed. Fix the issues before committing."
}
Show-Success "Build test passed"

# 6. Verificar tamaño del bundle
Write-Host "📊 Checking bundle size..." -ForegroundColor Cyan
if (Test-Path ".next") {
    $bundleSize = (Get-ChildItem ".next" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Bundle size: $([math]::Round($bundleSize, 2)) MB" -ForegroundColor Gray
}

# 7. Verificar que no hay secrets en el código
Write-Host "🔐 Checking for secrets..." -ForegroundColor Cyan
$secretsFound = Get-ChildItem -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" | 
    Where-Object { $_.FullName -notmatch "node_modules|\.git|test|example" } |
    Select-String -Pattern "password|secret|key|token" -SimpleMatch
if ($secretsFound) {
    Show-Warning "Posibles secrets encontrados en el código. Revisa antes de hacer commit."
}

Write-Host ""
Show-Success "🎉 Pre-commit validations passed! Ready to commit."
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "   - Si falla algo, usa 'git commit --no-verify' para saltar las validaciones (NO recomendado)"
Write-Host "   - Para hacer commit rápido: 'git commit -m \"mensaje\"'"
Write-Host "   - Para hacer commit con descripción: 'git commit' (abrirá el editor)"
Write-Host ""

