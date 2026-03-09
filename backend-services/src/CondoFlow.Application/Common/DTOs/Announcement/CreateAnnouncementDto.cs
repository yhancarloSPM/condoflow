using System.ComponentModel.DataAnnotations;

namespace CondoFlow.Application.Common.DTOs.Announcement;

public class CreateAnnouncementDto
{
    [Required(ErrorMessage = "El título es requerido")]
    [MaxLength(200, ErrorMessage = "El título no puede exceder 200 caracteres")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "El contenido es requerido")]
    public string Content { get; set; } = string.Empty;

    public bool IsUrgent { get; set; }

    public DateTime? EventDate { get; set; }

    public int? TypeId { get; set; }
}
