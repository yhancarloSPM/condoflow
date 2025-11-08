using CondoFlow.Domain.Common;

namespace CondoFlow.Domain.Entities;

public class EventType : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int Order { get; set; } = 0;

    public EventType() { }

    public EventType(string code, string name, string? description = null)
    {
        Code = code;
        Name = name;
        Description = description;
    }
}