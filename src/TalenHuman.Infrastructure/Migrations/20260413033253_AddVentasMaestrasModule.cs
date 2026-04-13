using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVentasMaestrasModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cuentas",
                table: "SalesData");

            migrationBuilder.AlterColumn<decimal>(
                name: "VentaNeta",
                table: "SalesData",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "TicketPromedio",
                table: "SalesData",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AddColumn<Guid>(
                name: "SalesChannelId",
                table: "SalesData",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SalesChannels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalesChannels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SalesChannels_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SalesData_SalesChannelId",
                table: "SalesData",
                column: "SalesChannelId");

            migrationBuilder.CreateIndex(
                name: "IX_SalesChannels_CompanyId",
                table: "SalesChannels",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_SalesData_SalesChannels_SalesChannelId",
                table: "SalesData",
                column: "SalesChannelId",
                principalTable: "SalesChannels",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SalesData_SalesChannels_SalesChannelId",
                table: "SalesData");

            migrationBuilder.DropTable(
                name: "SalesChannels");

            migrationBuilder.DropIndex(
                name: "IX_SalesData_SalesChannelId",
                table: "SalesData");

            migrationBuilder.DropColumn(
                name: "SalesChannelId",
                table: "SalesData");

            migrationBuilder.AlterColumn<decimal>(
                name: "VentaNeta",
                table: "SalesData",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "TicketPromedio",
                table: "SalesData",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AddColumn<int>(
                name: "Cuentas",
                table: "SalesData",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
