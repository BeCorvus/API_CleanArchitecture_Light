using System;

namespace FuelManagementSystem.API.DTO;

// Для получения данных (GET) - базовый DTO
public class GeyserDto
{
    public int Id { get; set; }
    public int? Name { get; set; }
    public int? YearOfRelease { get; set; }
    public int? IdRepair { get; set; }
    public int? IdFuel { get; set; }
    public string Manufacturer { get; set; }
    public string Note { get; set; }
}

// Для создания (POST)    
public class CreateGeyserDto
{
    public int? Name { get; set; }
    public int? YearOfRelease { get; set; }
    public int? IdRepair { get; set; }
    public int? IdFuel { get; set; }
    public string Manufacturer { get; set; }
    public string Note { get; set; }
}

// Для обновления (PUT)    
public class UpdateGeyserDto
{
    public int? Name { get; set; }
    public int? YearOfRelease { get; set; }
    public int? IdRepair { get; set; }
    public int? IdFuel { get; set; }
    public string Manufacturer { get; set; }
    public string Note { get; set; }
}

// Для административных целей (все поля включая технические)
public class GeyserAdminDto : GeyserDto
{
    public DateTime? DateOfRecording { get; set; }
    public DateTime? DateOfChange { get; set; }
    public string WhoRecorded { get; set; }
    public string WhoChanged { get; set; }
    public DateTime? WhenDeleted { get; set; }
}