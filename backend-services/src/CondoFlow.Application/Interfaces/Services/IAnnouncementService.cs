using CondoFlow.Application.Common.DTOs.Announcement;
using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Services;

public interface IAnnouncementService
{
    Task<IEnumerable<AnnouncementDto>> GetAllAnnouncementsAsync();
    Task<AnnouncementDto> CreateAnnouncementAsync(CreateAnnouncementDto dto, string createdBy);
    Task<AnnouncementDto?> UpdateAnnouncementAsync(Guid id, UpdateAnnouncementDto dto);
    Task<IEnumerable<object>> GetAnnouncementTypesAsync();
    Task<bool> UpdateAnnouncementTypeAsync(Guid announcementId, int announcementTypeId);
    Task<AnnouncementDto?> GetAnnouncementByIdAsync(Guid id);
    Task DeleteAnnouncementAsync(Guid id);
}
