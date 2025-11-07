using System.ComponentModel.DataAnnotations;

namespace CondoFlow.Application.Common.DTOs.Debt;

public class CreateDebtRequest
{
    [Required]
    [StringLength(200, ErrorMessage = "El concepto no puede exceder 200 caracteres")]
    public string Concept { get; set; } = string.Empty;

    [Required]
    public int Month { get; set; }

    [Required]
    public int Year { get; set; }
}

public class DebtResponse
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Concept { get; set; } = string.Empty;
    public int Month { get; set; }
    public int Year { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}