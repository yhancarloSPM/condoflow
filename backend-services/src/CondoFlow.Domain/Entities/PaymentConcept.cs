using CondoFlow.Domain.Common;

namespace CondoFlow.Domain.Entities;

public class PaymentConcept : BaseEntity
{
    public string Code { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public decimal? DefaultAmount { get; private set; }
    public decimal? RoofAmount { get; private set; }
    public bool IsAutoCalculated { get; private set; }
    public bool IsActive { get; private set; }

    private PaymentConcept() { }

    public PaymentConcept(string code, string name, decimal? defaultAmount = null, 
                         decimal? roofAmount = null, bool isAutoCalculated = false)
    {
        Code = code;
        Name = name;
        DefaultAmount = defaultAmount;
        RoofAmount = roofAmount;
        IsAutoCalculated = isAutoCalculated;
        IsActive = true;
    }
}