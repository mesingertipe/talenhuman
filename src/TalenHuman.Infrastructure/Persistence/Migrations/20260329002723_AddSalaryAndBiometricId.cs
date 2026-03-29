using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSalaryAndBiometricId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BiometricId",
                table: "Stores",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DailySalary",
                table: "Employees",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BiometricId",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "DailySalary",
                table: "Employees");
        }
    }
}
