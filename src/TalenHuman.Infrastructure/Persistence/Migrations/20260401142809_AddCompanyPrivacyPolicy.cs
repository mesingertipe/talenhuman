using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyPrivacyPolicy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_NovedadLogs_CompanyId",
                table: "NovedadLogs");

            migrationBuilder.DropIndex(
                name: "IX_NovedadAdjuntos_CompanyId",
                table: "NovedadAdjuntos");

            migrationBuilder.AddColumn<string>(
                name: "PrivacyPolicyText",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_NovedadLogs_CompanyId_NovedadId_CreatedAt",
                table: "NovedadLogs",
                columns: new[] { "CompanyId", "NovedadId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_NovedadAdjuntos_CompanyId_NovedadId",
                table: "NovedadAdjuntos",
                columns: new[] { "CompanyId", "NovedadId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_NovedadLogs_CompanyId_NovedadId_CreatedAt",
                table: "NovedadLogs");

            migrationBuilder.DropIndex(
                name: "IX_NovedadAdjuntos_CompanyId_NovedadId",
                table: "NovedadAdjuntos");

            migrationBuilder.DropColumn(
                name: "PrivacyPolicyText",
                table: "Companies");

            migrationBuilder.CreateIndex(
                name: "IX_NovedadLogs_CompanyId",
                table: "NovedadLogs",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_NovedadAdjuntos_CompanyId",
                table: "NovedadAdjuntos",
                column: "CompanyId");
        }
    }
}
