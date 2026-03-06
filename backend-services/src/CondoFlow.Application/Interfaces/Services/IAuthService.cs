using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Services;

public interface IAuthService
{
    Task<ApartmentDto?> GetApartmentInfoAsync(int apartmentId);
    Task<bool> IsApartmentAvailableAsync(int apartmentId);
    Task<List<UserDto>> GetPendingUsersAsync();
    Task<List<UserDto>> GetAllUsersAsync();
}
