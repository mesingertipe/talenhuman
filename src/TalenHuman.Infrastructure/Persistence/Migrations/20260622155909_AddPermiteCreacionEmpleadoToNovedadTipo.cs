using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPermiteCreacionEmpleadoToNovedadTipo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PermiteCreacionEmpleado",
                table: "NovedadTipos",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PermiteCreacionEmpleado",
                table: "NovedadTipos");
        }
    }
}
