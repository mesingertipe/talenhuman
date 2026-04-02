using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingFidoOptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirebaseApiKey",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "FirebaseAppId",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "FirebaseAuthDomain",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "FirebaseMeasurementId",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "FirebaseMessagingSenderId",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "FirebaseProjectId",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "FirebaseStorageBucket",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "FirebaseVapidKey",
                table: "Companies");

            migrationBuilder.AddColumn<string>(
                name: "PendingFidoOptions",
                table: "AspNetUsers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PendingFidoOptions",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<string>(
                name: "FirebaseApiKey",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirebaseAppId",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirebaseAuthDomain",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirebaseMeasurementId",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirebaseMessagingSenderId",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirebaseProjectId",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirebaseStorageBucket",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirebaseVapidKey",
                table: "Companies",
                type: "text",
                nullable: true);
        }
    }
}
