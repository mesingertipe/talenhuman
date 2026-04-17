using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddChannelFilteringToPredictiveRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PredictiveShiftRuleChannels",
                columns: table => new
                {
                    RuleId = table.Column<Guid>(type: "uuid", nullable: false),
                    SalesChannelId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PredictiveShiftRuleChannels", x => new { x.RuleId, x.SalesChannelId });
                    table.ForeignKey(
                        name: "FK_PredictiveShiftRuleChannels_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PredictiveShiftRuleChannels_PredictiveShiftRules_RuleId",
                        column: x => x.RuleId,
                        principalTable: "PredictiveShiftRules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PredictiveShiftRuleChannels_SalesChannels_SalesChannelId",
                        column: x => x.SalesChannelId,
                        principalTable: "SalesChannels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PredictiveShiftRuleChannels_CompanyId",
                table: "PredictiveShiftRuleChannels",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_PredictiveShiftRuleChannels_SalesChannelId",
                table: "PredictiveShiftRuleChannels",
                column: "SalesChannelId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PredictiveShiftRuleChannels");
        }
    }
}
