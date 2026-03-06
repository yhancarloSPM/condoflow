using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IIncidentRepository
{
    Task<Incident> AddAsync(Incident incident);
    Task<IEnumerable<Incident>> GetByOwnerIdAsync(Guid ownerId);
    Task<IEnumerable<Incident>> GetAllAsync();
    Task<Incident?> GetByIdAsync(Guid id);
    Task UpdateAsync(Incident incident);
}
