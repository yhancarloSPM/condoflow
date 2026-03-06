using AutoMapper;
using CondoFlow.Application.Common.DTOs.Reservation;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Services;

public class ReservationService : IReservationService
{
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public ReservationService(IUserRepository userRepository, IMapper mapper)
    {
        _userRepository = userRepository;
        _mapper = mapper;
    }

    public async Task<ReservationDto> MapReservationToDtoAsync(Reservation reservation)
    {
        var reservationDto = _mapper.Map<ReservationDto>(reservation);
        
        var user = await _userRepository.GetUserWithApartmentAsync(reservation.UserId);
        
        if (user != null)
        {
            var fullName = $"{user.FirstName} {user.LastName}".Trim();
            var apartment = user.Apartment ?? "Sin apartamento";
            reservationDto.UserName = $"{fullName}\n{apartment}";
        }
        else
        {
            reservationDto.UserName = "Usuario desconocido";
        }
        
        return reservationDto;
    }
}
