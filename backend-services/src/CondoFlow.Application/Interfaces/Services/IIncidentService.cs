using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Services;

public interface IIncidentService
{
    Task<IncidentDto> CreateIncidentAsync(Guid ownerId, string title, string description, string category, string priority, string? imageData);
    Task<IEnumerable<IncidentDto>> GetMyIncidentsAsync(Guid ownerId);
    Task<IEnumerable<IncidentDto>> GetAllIncidentsAsync();
    Task<IncidentDto?> GetIncidentByIdAsync(Guid id);
    Task UpdateIncidentStatusAsync(Guid id, string status, string? adminComment);
    Task CancelIncidentAsync(Guid id, Guid ownerId, string comment);
    Task<(byte[] fileBytes, string mimeType)?> GetIncidentImageAsync(Guid id, Guid userId, bool isAdmin);
}
