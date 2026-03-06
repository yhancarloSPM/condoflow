namespace CondoFlow.Application.DTOs;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public int? ApartmentId { get; set; }
    public string? Apartment { get; set; }
    public Guid? OwnerId { get; set; }
    public bool IsApproved { get; set; }
    public bool IsRejected { get; set; }
}

public class OwnerSummaryDto
{
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Apartment { get; set; } = string.Empty;
    public decimal PendingAmount { get; set; }
    public decimal OverdueAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public int PendingCount { get; set; }
    public int OverdueCount { get; set; }
    public DateTime LastUpdate { get; set; }
}

public class OwnerDebtDetailDto
{
    public Guid Id { get; set; }
    public string Concept { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public int Month { get; set; }
    public int Year { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
