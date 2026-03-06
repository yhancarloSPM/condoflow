using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<object?> GetUserByIdAsync(string userId);
    Task<UserWithApartmentDto?> GetUserWithApartmentAsync(string userId);
    Task<IEnumerable<object>> GetUsersWithApartmentsAsync();
    Task<bool> UpdateUserAsync(string userId, string firstName, string lastName, string phoneNumber);
}
