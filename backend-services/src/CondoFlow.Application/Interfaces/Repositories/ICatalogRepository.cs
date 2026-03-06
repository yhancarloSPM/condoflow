namespace CondoFlow.Application.Interfaces.Repositories;

public interface ICatalogRepository
{
    Task<IEnumerable<object>> GetCategoriesAsync();
    Task<IEnumerable<object>> GetEventTypesAsync();
    Task<IEnumerable<object>> GetPaymentConceptsAsync();
    Task<IEnumerable<object>> GetPrioritiesAsync();
    Task<IEnumerable<object>> GetReservationStatusesAsync();
    Task<IEnumerable<object>> GetIncidentStatusesAsync();
    Task<IEnumerable<object>> GetExpenseStatusesAsync();
    Task<IEnumerable<object>> GetAnnouncementTypesAsync();
}
