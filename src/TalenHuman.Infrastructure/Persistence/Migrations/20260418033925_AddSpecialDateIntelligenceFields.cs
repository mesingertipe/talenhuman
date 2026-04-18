using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSpecialDateIntelligenceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CountryCode",
                table: "PredictiveSpecialDates",
                newName: "Country");

            migrationBuilder.AddColumn<bool>(
                name: "IsSystem",
                table: "PredictiveSpecialDates",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSystem",
                table: "PredictiveSpecialDates");

            migrationBuilder.RenameColumn(
                name: "Country",
                table: "PredictiveSpecialDates",
                newName: "CountryCode");
        }
    }
}
