using AutoMapper;
using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Services;

public class ProviderService : IProviderService
{
    private readonly IProviderRepository _providerRepository;
    private readonly IMapper _mapper;

    public ProviderService(IProviderRepository providerRepository, IMapper mapper)
    {
        _providerRepository = providerRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ProviderDto>> GetAllProvidersAsync()
    {
        var providers = await _providerRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<ProviderDto>>(providers);
    }

    public async Task<IEnumerable<ProviderDto>> GetActiveProvidersAsync()
    {
        var providers = await _providerRepository.GetActiveAsync();
        return _mapper.Map<IEnumerable<ProviderDto>>(providers);
    }

    public async Task<ProviderDto?> GetProviderByIdAsync(int id)
    {
        var provider = await _providerRepository.GetByIdAsync(id);
        return provider != null ? _mapper.Map<ProviderDto>(provider) : null;
    }

    public async Task<ProviderDto> CreateProviderAsync(CreateProviderDto createDto, string userId)
    {
        var provider = _mapper.Map<Provider>(createDto);
        provider.IsActive = true;
        provider.CreatedBy = userId;
        provider.CreatedAt = DateTime.UtcNow;

        await _providerRepository.AddAsync(provider);
        return _mapper.Map<ProviderDto>(provider);
    }

    public async Task<ProviderDto?> UpdateProviderAsync(int id, UpdateProviderDto updateDto)
    {
        var provider = await _providerRepository.GetByIdAsync(id);
        if (provider == null) return null;

        _mapper.Map(updateDto, provider);
        await _providerRepository.UpdateAsync(provider);
        return _mapper.Map<ProviderDto>(provider);
    }

    public async Task<bool> DeleteProviderAsync(int id)
    {
        var provider = await _providerRepository.GetByIdAsync(id);
        if (provider == null) return false;

        // Check if provider has expenses
        var hasExpenses = await _providerRepository.HasExpensesAsync(id);
        if (hasExpenses)
        {
            // Soft delete - just deactivate
            provider.IsActive = false;
            await _providerRepository.UpdateAsync(provider);
        }
        else
        {
            // Hard delete if no expenses
            await _providerRepository.DeleteAsync(id);
        }

        return true;
    }
}
