using System.ComponentModel.DataAnnotations;

namespace CondoFlow.Domain.Entities;

public class PaymentConcept
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    public decimal? DefaultAmount { get; set; }
    
    public decimal? RoofAmount { get; set; }
    
    public bool IsAutoCalculated { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}