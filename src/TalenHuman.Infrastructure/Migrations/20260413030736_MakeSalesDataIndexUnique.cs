using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeSalesDataIndexUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SalesData_CompanyId_StoreId_Timestamp",
                table: "SalesData");

            migrationBuilder.RenameColumn(
                name: "TicketCount",
                table: "SalesData",
                newName: "Cuentas");

            migrationBuilder.RenameColumn(
                name: "OrderCount",
                table: "SalesData",
                newName: "Comensales");

            migrationBuilder.RenameColumn(
                name: "Amount",
                table: "SalesData",
                newName: "VentaNeta");

            migrationBuilder.AddColumn<string>(
                name: "Canal",
                table: "SalesData",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "CantidadTickets",
                table: "SalesData",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "RecordDate",
                table: "SalesData",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "TicketPromedio",
                table: "SalesData",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_SalesData_CompanyId_StoreId_RecordDate_Canal",
                table: "SalesData",
                columns: new[] { "CompanyId", "StoreId", "RecordDate", "Canal" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SalesData_CompanyId_StoreId_RecordDate_Canal",
                table: "SalesData");

            migrationBuilder.DropColumn(
                name: "Canal",
                table: "SalesData");

            migrationBuilder.DropColumn(
                name: "CantidadTickets",
                table: "SalesData");

            migrationBuilder.DropColumn(
                name: "RecordDate",
                table: "SalesData");

            migrationBuilder.DropColumn(
                name: "TicketPromedio",
                table: "SalesData");

            migrationBuilder.RenameColumn(
                name: "VentaNeta",
                table: "SalesData",
                newName: "Amount");

            migrationBuilder.RenameColumn(
                name: "Cuentas",
                table: "SalesData",
                newName: "TicketCount");

            migrationBuilder.RenameColumn(
                name: "Comensales",
                table: "SalesData",
                newName: "OrderCount");

            migrationBuilder.CreateIndex(
                name: "IX_SalesData_CompanyId_StoreId_Timestamp",
                table: "SalesData",
                columns: new[] { "CompanyId", "StoreId", "Timestamp" });
        }
    }
}
