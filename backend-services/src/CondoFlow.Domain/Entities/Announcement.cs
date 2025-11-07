using CondoFlow.Domain.Common;

namespace CondoFlow.Domain.Entities;

public class Announcement : BaseEntity
{
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public bool IsUrgent { get; private set; }
    public DateTime? EventDate { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; } = string.Empty;

    private Announcement() { } // EF Constructor

    public Announcement(string title, string content, bool isUrgent, string createdBy, DateTime? eventDate = null)
    {
        Title = title;
        Content = content;
        IsUrgent = isUrgent;
        EventDate = eventDate;
        CreatedBy = createdBy;
        CreatedAt = DateTime.Now;
    }

    public void Update(string title, string content, bool isUrgent, DateTime? eventDate = null)
    {
        Title = title;
        Content = content;
        IsUrgent = isUrgent;
        EventDate = eventDate;
    }
}