using System.ComponentModel.DataAnnotations;

namespace CondoFlow.Application.Common.DTOs.Incident;

public class CancelIncidentDto
{
    [Required(ErrorMessage = "El comentario es requerido")]
    [StringLength(500, ErrorMessage = "El comentario no puede exceder 500 caracteres")]
    public string Comment { get; set; } = string.Empty;
}
