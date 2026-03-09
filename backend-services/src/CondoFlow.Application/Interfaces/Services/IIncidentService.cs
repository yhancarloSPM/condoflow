using CondoFlow.Application.Common.DTOs.Incident;
using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Services;

public interface IIncidentService
{
    Task<IncidentDto> CreateIncidentAsync(CreateIncidentDto dto, Guid ownerId, string? imageData = null);
    Task<IEnumerable<IncidentDto>> GetMyIncidentsAsync(Guid ownerId);
    Task<IEnumerable<IncidentDto>> GetAllIncidentsAsync();
    Task<IncidentDto?> GetIncidentByIdAsync(Guid id);
    Task UpdateIncidentStatusAsync(Guid incidentId, UpdateIncidentStatusDto dto);
    Task CancelIncidentAsync(Guid incidentId, Guid ownerId, CancelIncidentDto dto);
    Task<(byte[] fileBytes, string mimeType)?> GetIncidentImageAsync(GetIncidentImageDto dto);
}
