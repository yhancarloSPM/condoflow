using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Services;

public interface IProviderService
{
    Task<IEnumerable<ProviderDto>> GetAllProvidersAsync();
    Task<IEnumerable<ProviderDto>> GetActiveProvidersAsync();
    Task<ProviderDto?> GetProviderByIdAsync(int id);
    Task<ProviderDto> CreateProviderAsync(CreateProviderDto createDto, string userId);
    Task<ProviderDto?> UpdateProviderAsync(int id, UpdateProviderDto updateDto);
    Task<bool> DeleteProviderAsync(int id);
}
