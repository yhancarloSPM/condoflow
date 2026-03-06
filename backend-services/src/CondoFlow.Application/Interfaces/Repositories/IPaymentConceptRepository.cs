using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IPaymentConceptRepository
{
    Task<PaymentConcept?> GetByCodeAsync(string code);
}
