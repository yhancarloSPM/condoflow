namespace CondoFlow.WebApi.DTOs;

public class AnnouncementResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsUrgent { get; set; }
    public DateTime? EventDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int AnnouncementTypeId { get; set; }
    public string AnnouncementTypeName { get; set; } = string.Empty;
}