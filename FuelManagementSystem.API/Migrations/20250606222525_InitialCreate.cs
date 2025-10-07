using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelManagementSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FuelColumns",
                columns: table => new
                {
                    ID_Column = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ManufactureYear = table.Column<int>(type: "int", nullable: false),
                    Manufacturer = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NozzleCount = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FuelColumns", x => x.ID_Column);
                });

            migrationBuilder.CreateTable(
                name: "Fuels",
                columns: table => new
                {
                    ID_Fuel = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Brand = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Manufacturer = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Cost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fuels", x => x.ID_Fuel);
                });

            migrationBuilder.CreateTable(
                name: "Repairs",
                columns: table => new
                {
                    ID_Repair = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RepairDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Manufacturer = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ManufactureDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Repairer = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Cost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Repairs", x => x.ID_Repair);
                });

            migrationBuilder.CreateTable(
                name: "Equipment",
                columns: table => new
                {
                    ID_Equipment = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Brand = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ID_Column = table.Column<int>(type: "int", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipment", x => x.ID_Equipment);
                    table.ForeignKey(
                        name: "FK_Equipment_FuelColumns_ID_Column",
                        column: x => x.ID_Column,
                        principalTable: "FuelColumns",
                        principalColumn: "ID_Column");
                });

            migrationBuilder.CreateTable(
                name: "Nozzles",
                columns: table => new
                {
                    ID_Nozzle = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Number = table.Column<int>(type: "int", nullable: false),
                    ID_Column = table.Column<int>(type: "int", nullable: false),
                    ID_Fuel = table.Column<int>(type: "int", nullable: false),
                    FlowRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Nozzles", x => x.ID_Nozzle);
                    table.ForeignKey(
                        name: "FK_Nozzles_FuelColumns_ID_Column",
                        column: x => x.ID_Column,
                        principalTable: "FuelColumns",
                        principalColumn: "ID_Column",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Nozzles_Fuels_ID_Fuel",
                        column: x => x.ID_Fuel,
                        principalTable: "Fuels",
                        principalColumn: "ID_Fuel",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ColumnRepairs",
                columns: table => new
                {
                    ID_ColumnRepair = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ID_Repair = table.Column<int>(type: "int", nullable: false),
                    ID_Column = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ColumnRepairs", x => x.ID_ColumnRepair);
                    table.ForeignKey(
                        name: "FK_ColumnRepairs_FuelColumns_ID_Column",
                        column: x => x.ID_Column,
                        principalTable: "FuelColumns",
                        principalColumn: "ID_Column",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ColumnRepairs_Repairs_ID_Repair",
                        column: x => x.ID_Repair,
                        principalTable: "Repairs",
                        principalColumn: "ID_Repair",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ColumnEquipments",
                columns: table => new
                {
                    ID_ColumnEquipment = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ID_Column = table.Column<int>(type: "int", nullable: false),
                    ID_Equipment = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ColumnEquipments", x => x.ID_ColumnEquipment);
                    table.ForeignKey(
                        name: "FK_ColumnEquipments_Equipment_ID_Equipment",
                        column: x => x.ID_Equipment,
                        principalTable: "Equipment",
                        principalColumn: "ID_Equipment",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ColumnEquipments_FuelColumns_ID_Column",
                        column: x => x.ID_Column,
                        principalTable: "FuelColumns",
                        principalColumn: "ID_Column",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EquipmentRepairs",
                columns: table => new
                {
                    ID_EquipmentRepair = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ID_Repair = table.Column<int>(type: "int", nullable: false),
                    ID_Equipment = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EquipmentRepairs", x => x.ID_EquipmentRepair);
                    table.ForeignKey(
                        name: "FK_EquipmentRepairs_Equipment_ID_Equipment",
                        column: x => x.ID_Equipment,
                        principalTable: "Equipment",
                        principalColumn: "ID_Equipment",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EquipmentRepairs_Repairs_ID_Repair",
                        column: x => x.ID_Repair,
                        principalTable: "Repairs",
                        principalColumn: "ID_Repair",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NozzleRepairs",
                columns: table => new
                {
                    ID_NozzleRepair = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ID_Repair = table.Column<int>(type: "int", nullable: false),
                    ID_Nozzle = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NozzleRepairs", x => x.ID_NozzleRepair);
                    table.ForeignKey(
                        name: "FK_NozzleRepairs_Nozzles_ID_Nozzle",
                        column: x => x.ID_Nozzle,
                        principalTable: "Nozzles",
                        principalColumn: "ID_Nozzle",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NozzleRepairs_Repairs_ID_Repair",
                        column: x => x.ID_Repair,
                        principalTable: "Repairs",
                        principalColumn: "ID_Repair",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ColumnEquipments_ID_Column",
                table: "ColumnEquipments",
                column: "ID_Column");

            migrationBuilder.CreateIndex(
                name: "IX_ColumnEquipments_ID_Equipment",
                table: "ColumnEquipments",
                column: "ID_Equipment");

            migrationBuilder.CreateIndex(
                name: "IX_ColumnRepairs_ID_Column",
                table: "ColumnRepairs",
                column: "ID_Column");

            migrationBuilder.CreateIndex(
                name: "IX_ColumnRepairs_ID_Repair",
                table: "ColumnRepairs",
                column: "ID_Repair");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_ID_Column",
                table: "Equipment",
                column: "ID_Column");

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentRepairs_ID_Equipment",
                table: "EquipmentRepairs",
                column: "ID_Equipment");

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentRepairs_ID_Repair",
                table: "EquipmentRepairs",
                column: "ID_Repair");

            migrationBuilder.CreateIndex(
                name: "IX_NozzleRepairs_ID_Nozzle",
                table: "NozzleRepairs",
                column: "ID_Nozzle");

            migrationBuilder.CreateIndex(
                name: "IX_NozzleRepairs_ID_Repair",
                table: "NozzleRepairs",
                column: "ID_Repair");

            migrationBuilder.CreateIndex(
                name: "IX_Nozzles_ID_Column",
                table: "Nozzles",
                column: "ID_Column");

            migrationBuilder.CreateIndex(
                name: "IX_Nozzles_ID_Fuel",
                table: "Nozzles",
                column: "ID_Fuel");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ColumnEquipments");

            migrationBuilder.DropTable(
                name: "ColumnRepairs");

            migrationBuilder.DropTable(
                name: "EquipmentRepairs");

            migrationBuilder.DropTable(
                name: "NozzleRepairs");

            migrationBuilder.DropTable(
                name: "Equipment");

            migrationBuilder.DropTable(
                name: "Nozzles");

            migrationBuilder.DropTable(
                name: "Repairs");

            migrationBuilder.DropTable(
                name: "FuelColumns");

            migrationBuilder.DropTable(
                name: "Fuels");
        }
    }
}
