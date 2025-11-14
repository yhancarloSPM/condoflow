using System.ComponentModel.DataAnnotations;

namespace CondoFlow.WebApi.DTOs;

public class CreateAnnouncementRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    [StringLength(2000)]
    public string Content { get; set; } = string.Empty;
    
    public DateTime? EventDate { get; set; }
    
    public bool IsUrgent { get; set; } = false;
}