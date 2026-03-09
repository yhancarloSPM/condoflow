using System.ComponentModel.DataAnnotations;

namespace CondoFlow.Application.Common.DTOs.Incident;

public class CreateIncidentDto
{
    [Required(ErrorMessage = "El título es requerido")]
    [StringLength(200, ErrorMessage = "El título no puede exceder 200 caracteres")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "La descripción es requerida")]
    [StringLength(1000, ErrorMessage = "La descripción no puede exceder 1000 caracteres")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "La categoría es requerida")]
    public string Category { get; set; } = string.Empty;

    [Required(ErrorMessage = "La prioridad es requerida")]
    public string Priority { get; set; } = string.Empty;
}
