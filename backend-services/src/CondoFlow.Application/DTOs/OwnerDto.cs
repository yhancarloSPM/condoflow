namespace CondoFlow.Application.DTOs;

public class OwnerDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public int? ApartmentId { get; set; }
    public string? ApartmentNumber { get; set; }
}
