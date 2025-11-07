using CondoFlow.Domain.Common;

namespace CondoFlow.Domain.Entities;

public class ReservationSlot : BaseEntity
{
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsAvailable { get; set; } = true;
    public string Name { get; set; } = string.Empty;
}