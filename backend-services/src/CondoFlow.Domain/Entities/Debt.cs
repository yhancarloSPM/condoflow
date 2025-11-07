using System.ComponentModel.DataAnnotations;
using CondoFlow.Domain.ValueObjects;

namespace CondoFlow.Domain.Entities;

public class Debt
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid OwnerId { get; set; }
    
    public Debt() { }
    
    public Debt(Guid ownerId, Money amount, DateTime dueDate, string concept, int month, int year)
    {
        Id = Guid.NewGuid();
        OwnerId = ownerId;
        Amount = amount ?? throw new ArgumentNullException(nameof(amount));
        PaidAmount = new Money(0, amount.Currency);
        DueDate = dueDate;
        Concept = concept ?? throw new ArgumentNullException(nameof(concept));
        Status = "Pending";
        Month = month;
        Year = year;
        CreatedAt = DateTime.UtcNow;
    }
    
    [Required]
    public Money Amount { get; set; } = new Money(0, "DOP");
    
    [Required]
    public Money PaidAmount { get; set; } = new Money(0, "DOP");
    
    [Required]
    public DateTime DueDate { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Concept { get; set; } = string.Empty;
    
    [Required]
    public string Status { get; set; } = "Pending";
    
    [Required]
    public int Month { get; set; }
    
    [Required]
    public int Year { get; set; }
    
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    public Money RemainingAmount => new Money(Amount.Amount - PaidAmount.Amount, Amount.Currency);
    
    public bool IsOverdue => (Status == "Pending" || Status == "Overdue") && DateTime.Now > DueDate && Status != "PaymentSubmitted";
    
    public bool IsPaid => Status == "Paid" || RemainingAmount.Amount <= 0;
    
    public bool IsPartiallyPaid => PaidAmount.Amount > 0 && RemainingAmount.Amount > 0;

    public bool HasPendingPayment => Status == "PaymentSubmitted";
    
    public void AddPayment(Money paymentAmount)
    {
        PaidAmount = new Money(PaidAmount.Amount + paymentAmount.Amount, PaidAmount.Currency);
        
        if (RemainingAmount.Amount <= 0)
        {
            Status = "Paid";
        }
        
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkAsOverdue()
    {
        if (Status == "Pending" && DateTime.UtcNow > DueDate)
        {
            Status = "Overdue";
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void MarkAsPaymentSubmitted()
    {
        if (Status == "Pending" || Status == "Overdue")
        {
            Status = "PaymentSubmitted";
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void RejectPayment()
    {
        if (Status == "PaymentSubmitted")
        {
            Status = IsOverdue ? "Overdue" : "Pending";
            UpdatedAt = DateTime.UtcNow;
        }
    }
    
    public void MarkAsPaid()
    {
        Status = "Paid";
        UpdatedAt = DateTime.UtcNow;
    }
}