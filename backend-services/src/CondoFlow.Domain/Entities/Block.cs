namespace CondoFlow.Domain.Entities;

public class Block
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // Q, P, N, M, O
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    
    // Navigation
    public ICollection<Apartment> Apartments { get; set; } = new List<Apartment>();
    
    public void AddApartment(Apartment apartment)
    {
        Apartments.Add(apartment);
        apartment.BlockId = Id;
    }
}