using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IReservationRepository
{
    Task<IEnumerable<Reservation>> GetAllAsync();
    Task<IEnumerable<Reservation>> GetByUserIdAsync(string userId);
    Task<Reservation?> GetByIdAsync(Guid id);
    Task<bool> IsSlotAvailableAsync(DateTime date, TimeSpan startTime, TimeSpan endTime, Guid? excludeId = null);
    Task<Reservation> CreateAsync(Reservation reservation);
    Task<Reservation> UpdateAsync(Reservation reservation);
    Task DeleteAsync(Guid id);
    Task<IEnumerable<ReservationSlot>> GetAvailableSlotsAsync();
}
