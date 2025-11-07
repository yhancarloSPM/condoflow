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

public class AnnouncementResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsUrgent { get; set; }
    public DateTime? EventDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}