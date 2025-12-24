using System;

namespace FuelManagementSystem.API.DTO;

// Для получения данных (GET) - базовый DTO
public class RepairDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public DateOnly? DateOfRepair { get; set; }
    public string Manufacturer { get; set; }
    public DateOnly? ReleaseDate { get; set; }
    public string Repairman { get; set; }
    public decimal? Cost { get; set; }
    public string Note { get; set; }
}

// Для создания (POST)    
public class CreateRepairDto
{
    public string Name { get; set; }
    public DateOnly? DateOfRepair { get; set; }
    public string Manufacturer { get; set; }
    public DateOnly? ReleaseDate { get; set; }
    public string Repairman { get; set; }
    public decimal? Cost { get; set; }
    public string Note { get; set; }
}

// Для обновления (PUT)    
public class UpdateRepairDto
{
    public string Name { get; set; }
    public DateOnly? DateOfRepair { get; set; }
    public string Manufacturer { get; set; }
    public DateOnly? ReleaseDate { get; set; }
    public string Repairman { get; set; }
    public decimal? Cost { get; set; }
    public string Note { get; set; }
}

// Для административных целей (все поля включая технические)
public class RepairAdminDto : RepairDto
{
    public DateTime? DateOfRecording { get; set; }
    public DateTime? DateOfChange { get; set; }
    public string WhoRecorded { get; set; }
    public string WhoChanged { get; set; }
    public DateTime? WhenDeleted { get; set; }
}