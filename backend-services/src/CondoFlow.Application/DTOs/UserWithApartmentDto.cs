namespace CondoFlow.Application.DTOs;

public class UserWithApartmentDto
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public int? ApartmentId { get; set; }
    public string? Apartment { get; set; }
    public Guid? OwnerId { get; set; }
    public bool IsApproved { get; set; }
    public DateTime CreatedAt { get; set; }
}
