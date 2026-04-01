using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLegalAndPerformanceIndices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Shifts_CompanyId",
                table: "Shifts");

            migrationBuilder.DropIndex(
                name: "IX_SalesData_CompanyId",
                table: "SalesData");

            migrationBuilder.DropIndex(
                name: "IX_Novedades_CompanyId",
                table: "Novedades");

            migrationBuilder.DropIndex(
                name: "IX_Employees_CompanyId",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_BiometricRecords_CompanyId",
                table: "BiometricRecords");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_CompanyId",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_CompanyId",
                table: "Attendances");

            migrationBuilder.AddColumn<string>(
                name: "AcceptanceIP",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AcceptedPrivacyPolicy",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PrivacyPolicyAcceptedAt",
                table: "AspNetUsers",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SyncLogs_CompanyId_CreatedAt",
                table: "SyncLogs",
                columns: new[] { "CompanyId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_CompanyId_EmployeeId_StartTime",
                table: "Shifts",
                columns: new[] { "CompanyId", "EmployeeId", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_CompanyId_StoreId_StartTime",
                table: "Shifts",
                columns: new[] { "CompanyId", "StoreId", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_SalesData_CompanyId_StoreId_Timestamp",
                table: "SalesData",
                columns: new[] { "CompanyId", "StoreId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_Novedades_CompanyId_EmpleadoId_Status",
                table: "Novedades",
                columns: new[] { "CompanyId", "EmpleadoId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Novedades_CompanyId_FechaInicio",
                table: "Novedades",
                columns: new[] { "CompanyId", "FechaInicio" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_CompanyId_IdentificationNumber",
                table: "Employees",
                columns: new[] { "CompanyId", "IdentificationNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_CompanyId_IsActive",
                table: "Employees",
                columns: new[] { "CompanyId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_BiometricRecords_CompanyId_DeviceUser",
                table: "BiometricRecords",
                columns: new[] { "CompanyId", "DeviceUser" });

            migrationBuilder.CreateIndex(
                name: "IX_BiometricRecords_CompanyId_RecordDate",
                table: "BiometricRecords",
                columns: new[] { "CompanyId", "RecordDate" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_CompanyId_CreatedAt",
                table: "AuditLogs",
                columns: new[] { "CompanyId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId_CreatedAt",
                table: "AuditLogs",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_CompanyId_EmployeeId_ClockIn",
                table: "Attendances",
                columns: new[] { "CompanyId", "EmployeeId", "ClockIn" });

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_CompanyId_StoreId_ClockIn",
                table: "Attendances",
                columns: new[] { "CompanyId", "StoreId", "ClockIn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SyncLogs_CompanyId_CreatedAt",
                table: "SyncLogs");

            migrationBuilder.DropIndex(
                name: "IX_Shifts_CompanyId_EmployeeId_StartTime",
                table: "Shifts");

            migrationBuilder.DropIndex(
                name: "IX_Shifts_CompanyId_StoreId_StartTime",
                table: "Shifts");

            migrationBuilder.DropIndex(
                name: "IX_SalesData_CompanyId_StoreId_Timestamp",
                table: "SalesData");

            migrationBuilder.DropIndex(
                name: "IX_Novedades_CompanyId_EmpleadoId_Status",
                table: "Novedades");

            migrationBuilder.DropIndex(
                name: "IX_Novedades_CompanyId_FechaInicio",
                table: "Novedades");

            migrationBuilder.DropIndex(
                name: "IX_Employees_CompanyId_IdentificationNumber",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Employees_CompanyId_IsActive",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_BiometricRecords_CompanyId_DeviceUser",
                table: "BiometricRecords");

            migrationBuilder.DropIndex(
                name: "IX_BiometricRecords_CompanyId_RecordDate",
                table: "BiometricRecords");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_CompanyId_CreatedAt",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_UserId_CreatedAt",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_CompanyId_EmployeeId_ClockIn",
                table: "Attendances");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_CompanyId_StoreId_ClockIn",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "AcceptanceIP",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "AcceptedPrivacyPolicy",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "PrivacyPolicyAcceptedAt",
                table: "AspNetUsers");

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_CompanyId",
                table: "Shifts",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_SalesData_CompanyId",
                table: "SalesData",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Novedades_CompanyId",
                table: "Novedades",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_CompanyId",
                table: "Employees",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_BiometricRecords_CompanyId",
                table: "BiometricRecords",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_CompanyId",
                table: "AuditLogs",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_CompanyId",
                table: "Attendances",
                column: "CompanyId");
        }
    }
}
