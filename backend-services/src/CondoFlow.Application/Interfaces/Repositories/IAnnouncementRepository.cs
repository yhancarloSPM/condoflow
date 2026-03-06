using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IAnnouncementRepository
{
    Task<List<Announcement>> GetAllAsync();
    Task<Announcement?> GetByIdAsync(Guid id);
    Task AddAsync(Announcement announcement);
    Task UpdateAsync(Announcement announcement);
    Task DeleteAsync(Guid id);
}
