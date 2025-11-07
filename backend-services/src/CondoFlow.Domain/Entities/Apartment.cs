namespace CondoFlow.Domain.Entities;

public class Apartment
{
    public int Id { get; set; }
    public string Number { get; set; } = string.Empty; // 101, 102, etc.
    public int Floor { get; set; }
    public int BlockId { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? OwnerId { get; set; }
    public decimal MonthlyMaintenanceAmount { get; set; } = 2000m; // Precio por defecto
    
    // Navigation
    public Block Block { get; set; } = null!;
    public Owner? Owner { get; set; }
    
    public Apartment() { }
    
    public Apartment(string number, int floor, Guid? ownerId, int blockId)
    {
        Number = number;
        Floor = floor;
        OwnerId = ownerId;
        BlockId = blockId;
        IsActive = true;
    }
    
    public void AssignOwner(Owner owner)
    {
        OwnerId = owner.Id;
        Owner = owner;
    }
}