---
description: Build, commit, and push TalenHuman to trigger production deployment
---

Este workflow automatiza la preparación y subida del código para que GitHub Actions lo despliegue en DigitalOcean.

// turbo
0. Limpieza opcional de Docker (si hay poco espacio):
   ```powershell
   docker system prune -af
   ```

// turbo
1. Verificar compilación Back-end:
   ```powershell
   dotnet build src/TalenHuman.sln
   ```

// turbo
2. Verificar compilación Front-end:
   ```powershell
   npm run build --prefix src/TalenHuman.Web
   ```

3. Preparar archivos para Git:
   ```powershell
   git add .
   ```

// turbo
4. Crear el commit:
   ```powershell
   git commit -m "Build and Deploy: Actualización automática"
   ```

// turbo
5. Subir a GitHub:
   ```powershell
   git push origin main
   ```

6. Informar al usuario que el despliegue está en proceso en GitHub Actions.
