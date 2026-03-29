using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNovedadAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NovedadAdjuntos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    NovedadId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NovedadAdjuntos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NovedadAdjuntos_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NovedadAdjuntos_Novedades_NovedadId",
                        column: x => x.NovedadId,
                        principalTable: "Novedades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NovedadAdjuntos_CompanyId",
                table: "NovedadAdjuntos",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_NovedadAdjuntos_NovedadId",
                table: "NovedadAdjuntos",
                column: "NovedadId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NovedadAdjuntos");
        }
    }
}
