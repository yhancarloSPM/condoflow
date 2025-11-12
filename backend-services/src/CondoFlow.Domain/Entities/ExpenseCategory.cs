using System.ComponentModel.DataAnnotations;

namespace CondoFlow.Domain.Entities;

public class ExpenseCategory
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    

    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}