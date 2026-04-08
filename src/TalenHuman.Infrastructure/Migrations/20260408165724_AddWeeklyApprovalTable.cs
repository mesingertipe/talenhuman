using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWeeklyApprovalTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WeeklyApprovals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StoreId = table.Column<Guid>(type: "uuid", nullable: false),
                    WeekStartDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    LatestComment = table.Column<string>(type: "text", nullable: true),
                    LatestActionAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklyApprovals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WeeklyApprovals_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeeklyApprovals_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WeeklyApprovalLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WeeklyApprovalId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    ActionAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklyApprovalLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WeeklyApprovalLogs_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeeklyApprovalLogs_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeeklyApprovalLogs_WeeklyApprovals_WeeklyApprovalId",
                        column: x => x.WeeklyApprovalId,
                        principalTable: "WeeklyApprovals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyApprovalLogs_CompanyId_WeeklyApprovalId_ActionAt",
                table: "WeeklyApprovalLogs",
                columns: new[] { "CompanyId", "WeeklyApprovalId", "ActionAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyApprovalLogs_UserId",
                table: "WeeklyApprovalLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyApprovalLogs_WeeklyApprovalId",
                table: "WeeklyApprovalLogs",
                column: "WeeklyApprovalId");

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyApprovals_CompanyId_StoreId_WeekStartDate",
                table: "WeeklyApprovals",
                columns: new[] { "CompanyId", "StoreId", "WeekStartDate" });

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyApprovals_StoreId",
                table: "WeeklyApprovals",
                column: "StoreId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeeklyApprovalLogs");

            migrationBuilder.DropTable(
                name: "WeeklyApprovals");
        }
    }
}
