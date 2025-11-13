using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CondoFlow.Domain.Entities;

public class Expense
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }
    
    [Required]
    public DateTime Date { get; set; }
    
    [Required]
    public int CategoryId { get; set; }
    
    [Required]
    public int StatusId { get; set; }
    
    public int? ProviderId { get; set; }
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    [MaxLength(500)]
    public string? InvoiceUrl { get; set; }
    
    [Required]
    [MaxLength(450)]
    public string CreatedBy { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    [ForeignKey(nameof(CategoryId))]
    public virtual ExpenseCategory Category { get; set; } = null!;
    
    [ForeignKey(nameof(StatusId))]
    public virtual Status Status { get; set; } = null!;
    
    [ForeignKey(nameof(ProviderId))]
    public virtual Provider? Provider { get; set; }
}