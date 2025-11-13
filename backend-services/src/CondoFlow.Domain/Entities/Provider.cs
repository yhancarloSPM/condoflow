using System.ComponentModel.DataAnnotations;

namespace CondoFlow.Domain.Entities;

public class Provider
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string? Phone { get; set; }
    
    [MaxLength(100)]
    public string? Email { get; set; }
    
    [MaxLength(20)]
    public string? RNC { get; set; }
    
    [MaxLength(300)]
    public string? Address { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Required]
    [MaxLength(450)]
    public string CreatedBy { get; set; } = string.Empty;
    
    // Navigation property
    public virtual ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}