using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Services;

public interface IOwnerService
{
    Task<OwnerDto?> GetOwnerByIdAsync(string ownerId);
    Task<List<OwnerSummaryDto>> GetOwnersSummaryAsync();
    Task<List<OwnerDebtDetailDto>> GetOwnerDebtsDetailAsync(Guid ownerId);
}
