using System;

namespace FuelManagementSystem.API.DTO;

// Для получения данных (GET) - базовый DTO
public class FuelDto
{
    public int Id { get; set; }
    public string Brand { get; set; }
    public int? ShelfLife { get; set; }
    public string Manufacturer { get; set; }
    public decimal? Cost { get; set; }
    public string Note { get; set; }
}

// Для создания (POST)    
public class CreateFuelDto
{
    public string Brand { get; set; }
    public int? ShelfLife { get; set; }
    public string Manufacturer { get; set; }
    public decimal? Cost { get; set; }
    public string Note { get; set; }
}

// Для обновления (PUT)    
public class UpdateFuelDto
{
    public string Brand { get; set; }
    public int? ShelfLife { get; set; }
    public string Manufacturer { get; set; }
    public decimal? Cost { get; set; }
    public string Note { get; set; }
}

// Для административных целей (все поля включая технические)
public class FuelAdminDto : FuelDto
{
    public DateTime? DateOfRecording { get; set; }
    public DateTime? DateOfChange { get; set; }
    public string WhoRecorded { get; set; }
    public string WhoChanged { get; set; }
    public DateTime? WhenDeleted { get; set; }
}