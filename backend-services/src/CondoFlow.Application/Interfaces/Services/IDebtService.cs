using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Services;

public interface IDebtService
{
    Task<DebtSummaryDto> GetOwnerDebtsAsync(Guid ownerId);
    Task<IEnumerable<DebtDto>> GetAllDebtsAsync();
    Task<Guid> CreateDebtAsync(Guid ownerId, int month, int year, string concept);
    Task<DebtGenerationResultDto> GenerateYearDebtsAsync(int year);
}
