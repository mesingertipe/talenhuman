using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantToPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CompanyId",
                table: "ModulePermissions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_ModulePermissions_CompanyId",
                table: "ModulePermissions",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_ModulePermissions_Companies_CompanyId",
                table: "ModulePermissions",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ModulePermissions_Companies_CompanyId",
                table: "ModulePermissions");

            migrationBuilder.DropIndex(
                name: "IX_ModulePermissions_CompanyId",
                table: "ModulePermissions");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "ModulePermissions");
        }
    }
}
