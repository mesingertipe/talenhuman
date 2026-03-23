---
description: Build, commit, and push TalenHuman to trigger production deployment
---

Este workflow automatiza la preparación y subida del código para que GitHub Actions lo despliegue en DigitalOcean.

// turbo
1. Verificar compilación:
   ```powershell
   dotnet build src/TalenHuman.sln
   ```

2. Preparar archivos para Git:
   ```powershell
   git add .
   ```

// turbo
3. Crear el commit:
   ```powershell
   git commit -m "Build and Deploy: Actualización automática"
   ```

// turbo
4. Subir a GitHub:
   ```powershell
   git push origin main
   ```

5. Informar al usuario que el despliegue está en proceso en GitHub Actions.
