using CondoFlow.Application.Common.DTOs.Debt;
using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Services;

public interface IDebtService
{
    Task<DebtSummaryDto> GetOwnerDebtsAsync(Guid ownerId);
    Task<IEnumerable<DebtDto>> GetAllDebtsAsync();
    Task<Guid> CreateDebtAsync(CreateDebtRequest dto, Guid ownerId);
    Task<DebtGenerationResultDto> GenerateYearDebtsAsync(int year);
}
