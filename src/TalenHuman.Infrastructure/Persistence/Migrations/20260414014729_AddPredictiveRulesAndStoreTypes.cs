using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPredictiveRulesAndStoreTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "StoreTypeId",
                table: "Stores",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "StoreTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoreTypes_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PredictiveShiftRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    StoreTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    MetricType = table.Column<int>(type: "integer", nullable: false),
                    Ratio = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MinStaffOpening = table.Column<int>(type: "integer", nullable: false),
                    MinStaffClosing = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PredictiveShiftRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PredictiveShiftRules_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PredictiveShiftRules_StoreTypes_StoreTypeId",
                        column: x => x.StoreTypeId,
                        principalTable: "StoreTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PredictiveShiftRuleProfiles",
                columns: table => new
                {
                    RuleId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PredictiveShiftRuleProfiles", x => new { x.RuleId, x.ProfileId });
                    table.ForeignKey(
                        name: "FK_PredictiveShiftRuleProfiles_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PredictiveShiftRuleProfiles_PredictiveShiftRules_RuleId",
                        column: x => x.RuleId,
                        principalTable: "PredictiveShiftRules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PredictiveShiftRuleProfiles_Profiles_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Stores_StoreTypeId",
                table: "Stores",
                column: "StoreTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PredictiveShiftRuleProfiles_CompanyId",
                table: "PredictiveShiftRuleProfiles",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_PredictiveShiftRuleProfiles_ProfileId",
                table: "PredictiveShiftRuleProfiles",
                column: "ProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_PredictiveShiftRules_CompanyId",
                table: "PredictiveShiftRules",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_PredictiveShiftRules_StoreTypeId",
                table: "PredictiveShiftRules",
                column: "StoreTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_StoreTypes_CompanyId",
                table: "StoreTypes",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Stores_StoreTypes_StoreTypeId",
                table: "Stores",
                column: "StoreTypeId",
                principalTable: "StoreTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Stores_StoreTypes_StoreTypeId",
                table: "Stores");

            migrationBuilder.DropTable(
                name: "PredictiveShiftRuleProfiles");

            migrationBuilder.DropTable(
                name: "PredictiveShiftRules");

            migrationBuilder.DropTable(
                name: "StoreTypes");

            migrationBuilder.DropIndex(
                name: "IX_Stores_StoreTypeId",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "StoreTypeId",
                table: "Stores");
        }
    }
}
