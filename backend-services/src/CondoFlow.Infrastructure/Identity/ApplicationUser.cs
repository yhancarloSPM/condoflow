using Microsoft.AspNetCore.Identity;

namespace CondoFlow.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int? ApartmentId { get; set; }
    public int? BlockId { get; set; }  // ID del bloque
    
    // Navigation
    public CondoFlow.Domain.Entities.Apartment? ApartmentEntity { get; set; }
    public Guid? OwnerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsApproved { get; set; } = false;
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
    public bool IsRejected { get; set; } = false;
    public DateTime? RejectedAt { get; set; }
    public string? RejectedBy { get; set; }
    
    // Helper method para obtener el nombre del bloque
    public string GetBlockName(CondoFlow.Infrastructure.Data.ApplicationDbContext context)
    {
        if (!BlockId.HasValue) return string.Empty;
        var block = context.Blocks.Find(BlockId.Value);
        return block?.Name ?? BlockId.ToString();
    }
}