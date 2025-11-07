using System.ComponentModel.DataAnnotations;

namespace CondoFlow.WebApi.DTOs;

public class CreateIncidentRequest
{
    [Required(ErrorMessage = "El título es requerido")]
    [StringLength(200, ErrorMessage = "El título no puede exceder 200 caracteres")]
    public string Title { get; set; } = null!;

    [Required(ErrorMessage = "La descripción es requerida")]
    [StringLength(1000, ErrorMessage = "La descripción no puede exceder 1000 caracteres")]
    public string Description { get; set; } = null!;

    [Required(ErrorMessage = "La categoría es requerida")]
    public string Category { get; set; } = null!;

    [Required(ErrorMessage = "La prioridad es requerida")]
    public string Priority { get; set; } = null!;
}

public class UpdateIncidentStatusRequest
{
    [Required(ErrorMessage = "El estado es requerido")]
    public string Status { get; set; } = null!;
    
    public string? AdminComment { get; set; }
}

public class CancelIncidentRequest
{
    [Required(ErrorMessage = "El comentario es requerido")]
    [StringLength(500, ErrorMessage = "El comentario no puede exceder 500 caracteres")]
    public string Comment { get; set; } = null!;
}