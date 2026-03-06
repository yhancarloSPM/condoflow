using CondoFlow.Domain.Common;
using CondoFlow.Domain.ValueObjects;

namespace CondoFlow.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid OwnerId { get; private set; }
    public string Concept { get; private set; } = null!;
    public Guid? DebtId { get; private set; }
    public Money Amount { get; private set; } = null!;
    public DateTime PaymentDate { get; private set; }
    public string PaymentMethod { get; private set; } = null!;
    public string? ReceiptData { get; private set; }
    public string Status { get; private set; } = null!;
    public string? RejectionReason { get; private set; }

    public Owner Owner { get; private set; } = null!;
    public Debt? Debt { get; private set; }

    private Payment() { }

    public Payment(Guid ownerId, string concept, Money amount, DateTime paymentDate, 
                   string paymentMethod, Guid? debtId = null)
    {
        OwnerId = ownerId;
        Concept = concept ?? throw new ArgumentNullException(nameof(concept));
        Amount = amount ?? throw new ArgumentNullException(nameof(amount));
        PaymentDate = paymentDate;
        PaymentMethod = paymentMethod ?? throw new ArgumentNullException(nameof(paymentMethod));
        DebtId = debtId;
        Status = "Pending";
    }
    
    public Payment(Guid ownerId, Money amount, DateTime paymentDate, string paymentMethod)
        : this(ownerId, "General", amount, paymentDate, paymentMethod, null)
    {
    }

    public void AddReceipt(string receiptData)
    {
        ReceiptData = receiptData ?? throw new ArgumentNullException(nameof(receiptData));
        SetUpdatedAt();
    }

    public void Approve()
    {
        Status = "Approved";
        SetUpdatedAt();
    }

    public void Reject(string? reason = null)
    {
        Status = "Rejected";
        RejectionReason = reason;
        SetUpdatedAt();
    }
}