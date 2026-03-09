using System.ComponentModel.DataAnnotations;

namespace CondoFlow.Application.Common.DTOs.Incident;

public class UpdateIncidentStatusDto
{
    [Required(ErrorMessage = "El estado es requerido")]
    public string Status { get; set; } = string.Empty;
    
    public string? AdminComment { get; set; }
}
