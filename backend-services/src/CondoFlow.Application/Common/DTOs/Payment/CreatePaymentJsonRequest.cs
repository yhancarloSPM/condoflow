using System.ComponentModel.DataAnnotations;

namespace CondoFlow.Application.Common.DTOs.Payment;

public class CreatePaymentJsonRequest
{
    [Required]
    public string Concept { get; set; } = string.Empty;
    
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a 0")]
    public decimal Amount { get; set; }

    [Required]
    public string Currency { get; set; } = "DOP";

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required]
    [StringLength(50, ErrorMessage = "El método de pago no puede exceder 50 caracteres")]
    public string PaymentMethod { get; set; } = string.Empty;

    [Required]
    public ReceiptDto Receipt { get; set; } = new();
    
    public Guid? DebtId { get; set; }
}

public class ReceiptDto
{
    [Required]
    [StringLength(255, ErrorMessage = "El nombre del archivo no puede exceder 255 caracteres")]
    public string FileName { get; set; } = string.Empty;

    [Required]
    public string FileType { get; set; } = string.Empty;

    [Required]
    public string FileContent { get; set; } = string.Empty;
}