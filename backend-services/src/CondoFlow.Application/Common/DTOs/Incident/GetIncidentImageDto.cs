namespace CondoFlow.Application.Common.DTOs.Incident;

public class GetIncidentImageDto
{
    public Guid IncidentId { get; set; }
    public Guid UserId { get; set; }
    public bool IsAdmin { get; set; }
}
