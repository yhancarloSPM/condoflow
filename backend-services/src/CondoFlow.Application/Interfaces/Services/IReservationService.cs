using CondoFlow.Application.Common.DTOs.Reservation;
using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Services;

public interface IReservationService
{
    Task<ReservationDto> MapReservationToDtoAsync(Reservation reservation);
    Task<ReservationDto> CreateReservationAsync(CreateReservationDto dto, string userId);
    Task<ReservationDto> UpdateReservationStatusAsync(Guid id, string status, string? reason = null);
    Task CancelReservationAsync(Guid id, string userId, bool isAdmin, string? reason = null);
    Task<IEnumerable<ReservationDto>> GetAllReservationsAsync();
    Task<IEnumerable<ReservationDto>> GetUserReservationsAsync(string userId);
    Task<ReservationDto?> GetReservationByIdAsync(Guid id, string userId, bool isAdmin);
    Task<IEnumerable<ReservationSlotDto>> GetAvailableSlotsAsync();
    Task<bool> CheckAvailabilityAsync(DateTime date, TimeSpan startTime, TimeSpan endTime);
}
