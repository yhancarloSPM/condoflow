using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IApartmentRepository
{
    Task<IEnumerable<object>> GetAllApartmentsAsync();
    Task<Apartment?> GetApartmentByIdAsync(int id);
    Task<Apartment?> GetByIdAsync(int id);
    Task<object?> GetApartmentWithBlockAsync(int id);
    Task<IEnumerable<object>> GetApartmentsByBlockAsync(int blockId);
}
