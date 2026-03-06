namespace CondoFlow.Application.DTOs;

public class DebtDto
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string Apartment { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "DOP";
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public DateTime DueDate { get; set; }
    public string Concept { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Month { get; set; }
    public int Year { get; set; }
    public bool IsPaid { get; set; }
    public bool IsOverdue { get; set; }
    public bool IsPartiallyPaid { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DebtSummaryDto
{
    public List<DebtDto> CurrentDebts { get; set; } = new();
    public List<DebtDto> OverdueDebts { get; set; } = new();
    public List<DebtDto> PaymentSubmittedDebts { get; set; } = new();
    public List<DebtDto> PaidDebts { get; set; } = new();
    public decimal TotalPending { get; set; }
    public DebtStatisticsDto Summary { get; set; } = new();
}

public class DebtStatisticsDto
{
    public int TotalCurrent { get; set; }
    public int TotalOverdue { get; set; }
    public int TotalPaymentSubmitted { get; set; }
    public int TotalPaid { get; set; }
}

public class DebtGenerationResultDto
{
    public int DebtsCreated { get; set; }
    public int TotalUsers { get; set; }
}
