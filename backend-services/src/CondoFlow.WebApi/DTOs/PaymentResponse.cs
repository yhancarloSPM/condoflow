namespace CondoFlow.WebApi.DTOs;

public class PaymentResponse
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Concept { get; set; } = string.Empty;
    public Guid? DebtId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? ReceiptUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}