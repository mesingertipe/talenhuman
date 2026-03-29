using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeGender : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DefaultEndTime",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DefaultStartTime",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OperationalDayStart",
                table: "Stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "UseSequentialPairing",
                table: "Stores",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ShiftId",
                table: "Attendances",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Attendances",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "StatusObservation",
                table: "Attendances",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_ShiftId",
                table: "Attendances",
                column: "ShiftId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attendances_Shifts_ShiftId",
                table: "Attendances",
                column: "ShiftId",
                principalTable: "Shifts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attendances_Shifts_ShiftId",
                table: "Attendances");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_ShiftId",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "DefaultEndTime",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "DefaultStartTime",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "OperationalDayStart",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "UseSequentialPairing",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ShiftId",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "StatusObservation",
                table: "Attendances");
        }
    }
}
