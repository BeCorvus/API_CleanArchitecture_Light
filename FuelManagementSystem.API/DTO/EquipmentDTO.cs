using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.DTO;

// Для получения данных (GET)    
public class EquipmentDto
{        
    public int Id { get; set; }    
    public string Name { get; set; }    
    public string Brand { get; set; }    
    public string Note { get; set; }    
}    

// Для создания (POST)    
public class CreateEquipmentDto
{    
    public string Name { get; set; }   
    public string Brand { get; set; }   
    public string Note { get; set; }   
}        

// Для обновления (PUT)    
public class UpdateEquipmentDto
{
    public string Name { get; set; }
    public string Brand { get; set; }
    public string Note { get; set; }
}

// Для административных целей (если нужно видеть технические поля)
public class EquipmentAdminDto : EquipmentDto
{
    public DateTime? DateOfRecording { get; set; }
    public DateTime? DateOfChange { get; set; }
    public string WhoRecorded { get; set; }
    public string WhoChanged { get; set; }
    public bool IsDeleted { get; set; }
}