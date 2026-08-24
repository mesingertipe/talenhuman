using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddClockInToAIOperativeView : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE OR REPLACE VIEW ""vw_TalenHumanAI_Operativo"" AS
SELECT 
    e.""Id"" as ""EmpleadoId"",
    e.""FirstName"" || ' ' || e.""LastName"" AS ""NombreEmpleado"",
    e.""IdentificationNumber"" AS ""Cedula"",
    e.""DateOfEntry"",
    e.""IsActive"" AS ""EmpleadoActivo"",
    s.""Name"" AS ""TiendaNombre"",
    s.""Id"" AS ""StoreId"",
    s.""DistrictId"" AS ""DistrictId"",
    b.""Name"" AS ""MarcaNombre"",
    c.""Id"" AS ""CompanyId"",
    c.""Name"" AS ""CompanyNombre"",
    COALESCE(a.""Status"", -1) AS ""EstadoAsistencia"",
    a.""ClockIn"",
    a.""ClockOut"",
    a.""StatusObservation"" AS ""ObservacionAsistencia"",
    COALESCE(n.""Status"", -1) AS ""EstadoNovedad"",
    n.""FechaInicio"" AS ""NovedadInicio"",
    n.""FechaFin"" AS ""NovedadFin""
FROM ""Employees"" e
JOIN ""Stores"" s ON e.""StoreId"" = s.""Id""
JOIN ""Brands"" b ON s.""BrandId"" = b.""Id""
JOIN ""Companies"" c ON e.""CompanyId"" = c.""Id""
LEFT JOIN ""Attendances"" a ON e.""Id"" = a.""EmployeeId"" AND a.""ClockIn"" >= CURRENT_DATE
LEFT JOIN ""Novedades"" n ON e.""Id"" = n.""EmpleadoId"" AND n.""Status"" = 0;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // We cannot drop it if we just want to rollback, we should revert to the previous definition.
            migrationBuilder.Sql(@"
CREATE OR REPLACE VIEW ""vw_TalenHumanAI_Operativo"" AS
SELECT 
    e.""Id"" as ""EmpleadoId"",
    e.""FirstName"" || ' ' || e.""LastName"" AS ""NombreEmpleado"",
    e.""IdentificationNumber"" AS ""Cedula"",
    e.""DateOfEntry"",
    e.""IsActive"" AS ""EmpleadoActivo"",
    s.""Name"" AS ""TiendaNombre"",
    s.""Id"" AS ""StoreId"",
    s.""DistrictId"" AS ""DistrictId"",
    b.""Name"" AS ""MarcaNombre"",
    c.""Id"" AS ""CompanyId"",
    c.""Name"" AS ""CompanyNombre"",
    COALESCE(a.""Status"", -1) AS ""EstadoAsistencia"",
    COALESCE(n.""Status"", -1) AS ""EstadoNovedad"",
    n.""FechaInicio"" AS ""NovedadInicio"",
    n.""FechaFin"" AS ""NovedadFin""
FROM ""Employees"" e
JOIN ""Stores"" s ON e.""StoreId"" = s.""Id""
JOIN ""Brands"" b ON s.""BrandId"" = b.""Id""
JOIN ""Companies"" c ON e.""CompanyId"" = c.""Id""
LEFT JOIN ""Attendances"" a ON e.""Id"" = a.""EmployeeId"" AND a.""ClockIn"" >= CURRENT_DATE
LEFT JOIN ""Novedades"" n ON e.""Id"" = n.""EmpleadoId"" AND n.""Status"" = 0;
            ");
        }
    }
}
