# Guía para Levantar HumanCore

Sigue estos pasos para poner en marcha el sistema:

## 1. Base de Datos (PostgreSQL)
Asegúrate de tener una instancia de PostgreSQL corriendo. 
He incluido un archivo `docker-compose.yml` en la raíz de la carpeta `HumanCore`.

```bash
cd HumanCore
/Applications/Docker.app/Contents/Resources/bin/docker compose up -d
```
*Nota: La base de datos está configurada en el puerto **5433** para evitar conflictos con otros proyectos.*

## 2. Backend (.NET 8)
Navega a la carpeta del código fuente y aplica las migraciones iniciales:

```bash
cd src
dotnet ef migrations add InitialCreate --project RestoHR.Infrastructure --startup-project RestoHR.API
dotnet ef database update --project RestoHR.Infrastructure --startup-project RestoHR.API
```

Luego, inicia el API:
```bash
dotnet run --project RestoHR.API
```
El API estará disponible en `http://localhost:5001` (o el puerto configurado).

## 3. Frontend (React + Vite)
En una nueva terminal, levanta la aplicación web:

```bash
cd src/RestoHR.Web
npm run dev
```
La aplicación estará disponible en `http://localhost:5173` (o un puerto alternativo si está ocupado).

---

## Estructura de Proyectos
- `RestoHR.API`: Punto de entrada, Controladores y Swagger.
- `RestoHR.Application`: Lógica de negocio (Commands, Queries, MediatR).
- `RestoHR.Domain`: Entidades (Empresas, Marcas, Tiendas, Empleados, Turnos).
- `RestoHR.Infrastructure`: Persistencia (EF Core) y Multitenancy.
- `RestoHR.Web`: Interfaz de usuario premium.
