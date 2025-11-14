using System.ComponentModel.DataAnnotations;

namespace CondoFlow.WebApi.DTOs;

public class UpdateAnnouncementTypeRequest
{
    [Required(ErrorMessage = "El tipo de anuncio es obligatorio")]
    public int AnnouncementTypeId { get; set; }
}