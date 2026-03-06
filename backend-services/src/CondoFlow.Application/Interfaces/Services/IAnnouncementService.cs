using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Services;

public interface IAnnouncementService
{
    Task<IEnumerable<AnnouncementDto>> GetAllAnnouncementsAsync();
    Task<AnnouncementDto> CreateAnnouncementAsync(string title, string content, bool isUrgent, string createdBy, DateTime? eventDate);
    Task<IEnumerable<object>> GetAnnouncementTypesAsync();
    Task<bool> UpdateAnnouncementTypeAsync(Guid announcementId, int announcementTypeId);
    Task<AnnouncementDto?> GetAnnouncementByIdAsync(Guid id);
    Task DeleteAnnouncementAsync(Guid id);
}
