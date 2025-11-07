using CondoFlow.Domain.Common;

namespace CondoFlow.Domain.Entities;

public class Catalog : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string CatalogType { get; set; } = string.Empty; // "IncidentCategory", "IncidentPriority", "IncidentStatus"
    public bool IsActive { get; set; } = true;
    public int Order { get; set; } = 0;
}