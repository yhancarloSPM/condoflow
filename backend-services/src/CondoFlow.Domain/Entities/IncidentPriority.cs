using CondoFlow.Domain.Common;

namespace CondoFlow.Domain.Entities;

public class IncidentPriority : BaseEntity
{
    public string Code { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;

    private IncidentPriority() { }

    public IncidentPriority(string code, string name, string? description = null)
    {
        Code = code ?? throw new ArgumentNullException(nameof(code));
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Description = description;
    }
}