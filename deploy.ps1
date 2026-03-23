# TalenHuman Deployment Automator 🚀

Write-Host "--- Iniciando Proceso de Despliegue ---" -ForegroundColor Cyan

# 1. Compilar el proyecto
Write-Host "1. Compilando el proyecto..." -ForegroundColor Yellow
dotnet build src/TalenHuman.sln
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en la compilación. Abortando despliegue." -ForegroundColor Red
    exit
}

# 2. Preparar Cambios en Git
Write-Host "2. Preparando cambios para Git..." -ForegroundColor Yellow
git add .

# 3. Commit
$msg = Read-Host "Ingresa el mensaje del commit (deja en blanco para 'Actualización automática')"
if ([string]::IsNullOrWhiteSpace($msg)) { $msg = "Actualización automática TalenHuman" }
git commit -m "$msg"

# 4. Push
Write-Host "3. Subiendo cambios a GitHub (Rama main)..." -ForegroundColor Yellow
git push origin main

Write-Host "--- 🎉 ¡Todo listo! Revisa las Actions en GitHub para el despliegue a DigitalOcean ---" -ForegroundColor Green
