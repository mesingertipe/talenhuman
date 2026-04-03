using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateComunicadosV637 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaFin",
                table: "Comunicados",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaInicio",
                table: "Comunicados",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImagenUrl",
                table: "Comunicados",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Comunicados",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FechaFin",
                table: "Comunicados");

            migrationBuilder.DropColumn(
                name: "FechaInicio",
                table: "Comunicados");

            migrationBuilder.DropColumn(
                name: "ImagenUrl",
                table: "Comunicados");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Comunicados");
        }
    }
}
