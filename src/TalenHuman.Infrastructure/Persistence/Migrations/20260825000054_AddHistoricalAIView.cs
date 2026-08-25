using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHistoricalAIView : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DROP VIEW IF EXISTS ""vw_TalenHumanAI_HistoricoAsistencia"";
CREATE VIEW ""vw_TalenHumanAI_HistoricoAsistencia"" AS
SELECT 
    a.""Id"" AS ""AsistenciaId"",
    e.""Id"" as ""EmpleadoId"",
    e.""FirstName"" || ' ' || e.""LastName"" AS ""NombreEmpleado"",
    e.""IdentificationNumber"" AS ""Cedula"",
    s.""Name"" AS ""TiendaNombre"",
    s.""Id"" AS ""StoreId"",
    s.""DistrictId"" AS ""DistrictId"",
    b.""Name"" AS ""MarcaNombre"",
    c.""Id"" AS ""CompanyId"",
    c.""Name"" AS ""CompanyNombre"",
    COALESCE(a.""Status"", -1) AS ""EstadoAsistencia"",
    a.""ClockIn"",
    a.""ClockOut"",
    a.""StatusObservation"" AS ""ObservacionAsistencia""
FROM ""Attendances"" a
JOIN ""Employees"" e ON a.""EmployeeId"" = e.""Id""
JOIN ""Stores"" s ON e.""StoreId"" = s.""Id""
JOIN ""Brands"" b ON s.""BrandId"" = b.""Id""
JOIN ""Companies"" c ON e.""CompanyId"" = c.""Id"";
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP VIEW IF EXISTS ""vw_TalenHumanAI_HistoricoAsistencia"";");
        }
    }
}
