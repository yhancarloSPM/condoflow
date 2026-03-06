using CondoFlow.Domain.Common;
using CondoFlow.Domain.Enums;

namespace CondoFlow.Domain.Entities;

public class Incident : BaseEntity
{
    public Guid OwnerId { get; private set; }
    public string Title { get; private set; } = null!;
    public string Description { get; private set; } = null!;
    public string Status { get; private set; } = null!;
    public string Priority { get; private set; } = null!;
    public string Category { get; private set; } = null!;
    public string? ImageData { get; private set; }
    public string? AdminComment { get; private set; }

    public Owner Owner { get; private set; } = null!;

    private Incident() { }

    public Incident(Guid ownerId, string title, string description, 
                   string category, string priority = "medium", string? imageData = null)
    {
        OwnerId = ownerId;
        Title = title ?? throw new ArgumentNullException(nameof(title));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Status = StatusCodes.Reported;
        Priority = priority;
        Category = category ?? throw new ArgumentNullException(nameof(category));
        ImageData = imageData;
    }

    public void ChangeStatus(string newStatus, string? adminComment = null)
    {
        Status = newStatus ?? throw new ArgumentNullException(nameof(newStatus));
        AdminComment = adminComment;
        SetUpdatedAt();
    }

    public void AddImage(string imageData)
    {
        ImageData = imageData;
        SetUpdatedAt();
    }
}