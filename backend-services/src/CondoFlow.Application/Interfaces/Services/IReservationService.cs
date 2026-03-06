using CondoFlow.Application.Common.DTOs.Reservation;
using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Services;

public interface IReservationService
{
    Task<ReservationDto> MapReservationToDtoAsync(Reservation reservation);
}
