using CondoFlow.Domain.Common;
using CondoFlow.Domain.ValueObjects;

namespace CondoFlow.Domain.Entities;

public class DebtPayment : BaseEntity
{
    public Guid DebtId { get; private set; }
    public Guid PaymentId { get; private set; }
    public Money Amount { get; private set; } = null!;
    public DateTime AppliedAt { get; private set; }

    public Debt Debt { get; private set; } = null!;
    public Payment Payment { get; private set; } = null!;

    private DebtPayment() { }

    public DebtPayment(Guid debtId, Guid paymentId, Money amount)
    {
        DebtId = debtId;
        PaymentId = paymentId;
        Amount = amount ?? throw new ArgumentNullException(nameof(amount));
        AppliedAt = DateTime.UtcNow;
    }
}