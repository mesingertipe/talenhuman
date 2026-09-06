using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAiCompanyFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Companies' AND column_name='AiAllowedRoles') THEN
                        ALTER TABLE ""Companies"" ADD COLUMN ""AiAllowedRoles"" text;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Companies' AND column_name='IsAiEnabled') THEN
                        ALTER TABLE ""Companies"" ADD COLUMN ""IsAiEnabled"" boolean NOT NULL DEFAULT false;
                    END IF;
                END
                $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiAllowedRoles",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "IsAiEnabled",
                table: "Companies");
        }
    }
}
