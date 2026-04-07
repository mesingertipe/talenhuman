using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class V130_ApprovalWorkflow_MinMax : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApprovalComment",
                table: "Shifts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "Shifts",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByUserId",
                table: "Shifts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OperationalSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AttendanceMode = table.Column<int>(type: "integer", nullable: false),
                    ShiftApprovalMode = table.Column<int>(type: "integer", nullable: false),
                    EnablePushNotifications = table.Column<bool>(type: "boolean", nullable: false),
                    EnableEmailNotifications = table.Column<bool>(type: "boolean", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OperationalSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OperationalSettings_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_ApprovedByUserId",
                table: "Shifts",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OperationalSettings_CompanyId",
                table: "OperationalSettings",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Shifts_AspNetUsers_ApprovedByUserId",
                table: "Shifts",
                column: "ApprovedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Shifts_AspNetUsers_ApprovedByUserId",
                table: "Shifts");

            migrationBuilder.DropTable(
                name: "OperationalSettings");

            migrationBuilder.DropIndex(
                name: "IX_Shifts_ApprovedByUserId",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "ApprovalComment",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                table: "Shifts");
        }
    }
}
