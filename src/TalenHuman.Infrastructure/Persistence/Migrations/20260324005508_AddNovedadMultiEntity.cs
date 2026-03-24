using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNovedadMultiEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Novedades_Employees_EmpleadoId",
                table: "Novedades");

            migrationBuilder.AddColumn<int>(
                name: "Categoria",
                table: "NovedadTipos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RolAprobador",
                table: "NovedadTipos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<Guid>(
                name: "EmpleadoId",
                table: "Novedades",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "BrandId",
                table: "Novedades",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Observaciones",
                table: "Novedades",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "StoreId",
                table: "Novedades",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Novedades_BrandId",
                table: "Novedades",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_Novedades_StoreId",
                table: "Novedades",
                column: "StoreId");

            migrationBuilder.AddForeignKey(
                name: "FK_Novedades_Brands_BrandId",
                table: "Novedades",
                column: "BrandId",
                principalTable: "Brands",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Novedades_Employees_EmpleadoId",
                table: "Novedades",
                column: "EmpleadoId",
                principalTable: "Employees",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Novedades_Stores_StoreId",
                table: "Novedades",
                column: "StoreId",
                principalTable: "Stores",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Novedades_Brands_BrandId",
                table: "Novedades");

            migrationBuilder.DropForeignKey(
                name: "FK_Novedades_Employees_EmpleadoId",
                table: "Novedades");

            migrationBuilder.DropForeignKey(
                name: "FK_Novedades_Stores_StoreId",
                table: "Novedades");

            migrationBuilder.DropIndex(
                name: "IX_Novedades_BrandId",
                table: "Novedades");

            migrationBuilder.DropIndex(
                name: "IX_Novedades_StoreId",
                table: "Novedades");

            migrationBuilder.DropColumn(
                name: "Categoria",
                table: "NovedadTipos");

            migrationBuilder.DropColumn(
                name: "RolAprobador",
                table: "NovedadTipos");

            migrationBuilder.DropColumn(
                name: "BrandId",
                table: "Novedades");

            migrationBuilder.DropColumn(
                name: "Observaciones",
                table: "Novedades");

            migrationBuilder.DropColumn(
                name: "StoreId",
                table: "Novedades");

            migrationBuilder.AlterColumn<Guid>(
                name: "EmpleadoId",
                table: "Novedades",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Novedades_Employees_EmpleadoId",
                table: "Novedades",
                column: "EmpleadoId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
