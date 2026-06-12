using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAttendanceTolerances : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CheckInEarlyInfinite",
                table: "OperationalSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "CheckInEarlyTolerance",
                table: "OperationalSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CheckInLateTolerance",
                table: "OperationalSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CheckOutTolerance",
                table: "OperationalSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CheckInEarlyInfinite",
                table: "OperationalSettings");

            migrationBuilder.DropColumn(
                name: "CheckInEarlyTolerance",
                table: "OperationalSettings");

            migrationBuilder.DropColumn(
                name: "CheckInLateTolerance",
                table: "OperationalSettings");

            migrationBuilder.DropColumn(
                name: "CheckOutTolerance",
                table: "OperationalSettings");
        }
    }
}
