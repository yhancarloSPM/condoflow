using System.ComponentModel.DataAnnotations;

namespace CondoFlow.WebApi.DTOs;

public class CreatePaymentRequest
{
    [Required]
    public string Concept { get; set; } = string.Empty;
    
    [Required]
    public decimal Amount { get; set; }
    
    [Required]
    public string Currency { get; set; } = "DOP";
    
    [Required]
    public DateTime PaymentDate { get; set; }
    
    [Required]
    public string PaymentMethod { get; set; } = string.Empty;
    
    public IFormFile? Receipt { get; set; }
    
    public Guid? DebtId { get; set; }
}