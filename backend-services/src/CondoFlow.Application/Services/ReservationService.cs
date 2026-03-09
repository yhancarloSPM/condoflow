using AutoMapper;
using CondoFlow.Application.Common.DTOs.Reservation;
using CondoFlow.Application.Common.Services;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Entities;
using CondoFlow.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CondoFlow.Application.Services;

public class ReservationService : IReservationService
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;
    private readonly IMapper _mapper;
    private readonly ILogger<ReservationService> _logger;

    public ReservationService(
        IReservationRepository reservationRepository,
        IUserRepository userRepository,
        INotificationService notificationService,
        IMapper mapper,
        ILogger<ReservationService> logger)
    {
        _reservationRepository = reservationRepository;
        _userRepository = userRepository;
        _notificationService = notificationService;
        _mapper = mapper;
        _logger = logger;
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

    public async Task<ReservationDto> CreateReservationAsync(CreateReservationDto dto, string userId)
    {
        _logger.LogInformation("Creating reservation for user {UserId} on {Date}", userId, dto.ReservationDate);
        
        // Validaciones de negocio
        if (dto.ReservationDate.Date <= DateTime.Now.Date)
        {
            _logger.LogWarning("Reservation date validation failed for user {UserId}: date must be in the future", userId);
            throw new InvalidOperationException("La fecha de reserva debe ser futura");
        }

        if (!TimeSpan.TryParse(dto.StartTime, out var startTime) || !TimeSpan.TryParse(dto.EndTime, out var endTime))
        {
            _logger.LogWarning("Invalid time format for user {UserId}: StartTime={StartTime}, EndTime={EndTime}", userId, dto.StartTime, dto.EndTime);
            throw new InvalidOperationException("Formato de hora inválido");
        }

        if (startTime == endTime)
        {
            _logger.LogWarning("Start time equals end time for user {UserId}", userId);
            throw new InvalidOperationException("La hora de inicio debe ser diferente a la hora de fin");
        }

        // Verificar disponibilidad
        var isAvailable = await _reservationRepository.IsSlotAvailableAsync(dto.ReservationDate, startTime, endTime);
        if (!isAvailable)
        {
            _logger.LogWarning("Time slot not available for user {UserId} on {Date} from {StartTime} to {EndTime}", userId, dto.ReservationDate, startTime, endTime);
            throw new InvalidOperationException("El horario seleccionado no está disponible");
        }

        // Verificar límite de reservas por mes (máximo 5)
        var userReservations = await _reservationRepository.GetByUserIdAsync(userId);
        var monthlyReservations = userReservations.Count(r => 
            (r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Confirmed) &&
            r.ReservationDate.Month == dto.ReservationDate.Month &&
            r.ReservationDate.Year == dto.ReservationDate.Year);
        
        if (monthlyReservations >= 5)
        {
            _logger.LogWarning("User {UserId} has reached monthly reservation limit: {Count}/5", userId, monthlyReservations);
            throw new InvalidOperationException("Has alcanzado el límite de 5 reservas para este mes. Puedes crear nuevas reservas el próximo mes o cancelar una reserva existente.");
        }

        // Crear reserva
        var reservation = new Reservation
        {
            UserId = userId,
            ReservationDate = dto.ReservationDate,
            StartTime = startTime,
            EndTime = endTime,
            Notes = dto.Notes,
            EventTypeCode = dto.EventTypeCode,
            Status = ReservationStatus.Pending
        };

        var created = await _reservationRepository.CreateAsync(reservation);
        var createdReservation = await _reservationRepository.GetByIdAsync(created.Id);
        
        _logger.LogInformation("Reservation {ReservationId} created successfully for user {UserId}", created.Id, userId);
        
        // Enviar notificación al admin
        await SendNewReservationNotificationToAdmin(createdReservation!);
        
        return await MapReservationToDtoAsync(createdReservation!);
    }

    public async Task<ReservationDto> UpdateReservationStatusAsync(Guid id, string status, string? reason = null)
    {
        _logger.LogInformation("Updating reservation {ReservationId} status to {Status}", id, status);
        
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null)
        {
            _logger.LogWarning("Reservation {ReservationId} not found", id);
            throw new KeyNotFoundException("Reserva no encontrada");
        }

        if (!Enum.TryParse<ReservationStatus>(status, out var newStatus))
        {
            _logger.LogWarning("Invalid status {Status} for reservation {ReservationId}", status, id);
            throw new InvalidOperationException("Estado inválido");
        }

        // Validar motivo para rechazos
        if (newStatus == ReservationStatus.Rejected)
        {
            if (string.IsNullOrWhiteSpace(reason))
            {
                _logger.LogWarning("Rejection reason missing for reservation {ReservationId}", id);
                throw new InvalidOperationException("El motivo de rechazo es obligatorio");
            }
            
            if (reason.Length < 10)
            {
                _logger.LogWarning("Rejection reason too short for reservation {ReservationId}: {Length} characters", id, reason.Length);
                throw new InvalidOperationException("El motivo de rechazo debe tener al menos 10 caracteres");
            }
                
            reservation.Reject(reason);
            _logger.LogInformation("Reservation {ReservationId} rejected with reason: {Reason}", id, reason);
        }
        else if (newStatus == ReservationStatus.Confirmed)
        {
            reservation.Confirm();
            _logger.LogInformation("Reservation {ReservationId} confirmed", id);
        }
        else
        {
            reservation.Status = newStatus;
            _logger.LogInformation("Reservation {ReservationId} status updated to {Status}", id, newStatus);
        }
        
        var updated = await _reservationRepository.UpdateAsync(reservation);
        
        // Enviar notificación al propietario
        await SendReservationStatusNotification(updated, reason);
        
        return await MapReservationToDtoAsync(updated);
    }

    public async Task CancelReservationAsync(Guid id, string userId, bool isAdmin, string? reason = null)
    {
        _logger.LogInformation("Cancelling reservation {ReservationId} by user {UserId} (IsAdmin: {IsAdmin})", id, userId, isAdmin);
        
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null)
        {
            _logger.LogWarning("Reservation {ReservationId} not found for cancellation", id);
            throw new KeyNotFoundException("Reserva no encontrada");
        }

        if (!isAdmin && reservation.UserId != userId)
        {
            _logger.LogWarning("User {UserId} attempted to cancel reservation {ReservationId} without permission", userId, id);
            throw new UnauthorizedAccessException("No tienes permiso para cancelar esta reserva");
        }

        if (reservation.Status != ReservationStatus.Pending && 
            reservation.Status != ReservationStatus.Confirmed)
        {
            _logger.LogWarning("Cannot cancel reservation {ReservationId} with status {Status}", id, reservation.Status);
            throw new InvalidOperationException("No se puede cancelar esta reserva");
        }

        reservation.Cancel(reason);
        await _reservationRepository.UpdateAsync(reservation);
        
        _logger.LogInformation("Reservation {ReservationId} cancelled successfully", id);
        
        // Enviar notificación al admin si el owner cancela
        if (!isAdmin)
        {
            await SendCancellationNotificationToAdmin(reservation, reason);
        }
    }

    public async Task<IEnumerable<ReservationDto>> GetAllReservationsAsync()
    {
        var reservations = await _reservationRepository.GetAllAsync();
        var reservationDtos = new List<ReservationDto>();
        
        foreach (var reservation in reservations)
        {
            reservationDtos.Add(await MapReservationToDtoAsync(reservation));
        }
        
        return reservationDtos;
    }

    public async Task<IEnumerable<ReservationDto>> GetUserReservationsAsync(string userId)
    {
        var reservations = await _reservationRepository.GetByUserIdAsync(userId);
        var reservationDtos = new List<ReservationDto>();
        
        foreach (var reservation in reservations)
        {
            reservationDtos.Add(await MapReservationToDtoAsync(reservation));
        }
        
        return reservationDtos;
    }

    public async Task<ReservationDto?> GetReservationByIdAsync(Guid id, string userId, bool isAdmin)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null)
            return null;

        if (!isAdmin && reservation.UserId != userId)
            throw new UnauthorizedAccessException("No tienes permiso para ver esta reserva");

        return await MapReservationToDtoAsync(reservation);
    }

    public async Task<IEnumerable<ReservationSlotDto>> GetAvailableSlotsAsync()
    {
        var slots = await _reservationRepository.GetAvailableSlotsAsync();
        return slots.Select(s => new ReservationSlotDto
        {
            Id = s.Id,
            Name = s.Name,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            IsAvailable = s.IsAvailable
        });
    }

    public async Task<bool> CheckAvailabilityAsync(DateTime date, TimeSpan startTime, TimeSpan endTime)
    {
        return await _reservationRepository.IsSlotAvailableAsync(date, startTime, endTime);
    }

    private async Task SendReservationStatusNotification(Reservation reservation, string? rejectionReason = null)
    {
        string title, message;
        
        if (reservation.Status == ReservationStatus.Confirmed)
        {
            title = "Reserva Confirmada";
            message = $"Tu reserva del gazebo para el {reservation.ReservationDate:dd/MM/yyyy} de {reservation.StartTime.Hours:00}:{reservation.StartTime.Minutes:00} a {reservation.EndTime.Hours:00}:{reservation.EndTime.Minutes:00} ha sido confirmada.";
        }
        else if (reservation.Status == ReservationStatus.Rejected)
        {
            title = "Reserva Rechazada";
            message = $"Tu reserva del gazebo para el {reservation.ReservationDate:dd/MM/yyyy} ha sido rechazada.";
            if (!string.IsNullOrEmpty(rejectionReason))
            {
                message += $" Motivo: {rejectionReason}";
            }
        }
        else
        {
            return; // No enviar notificación para otros estados
        }
        
        await _notificationService.CreateNotificationAsync(
            reservation.UserId,
            title,
            message,
            "Reservation",
            reservation.Id.ToString()
        );
    }
    
    private async Task SendCancellationNotificationToAdmin(Reservation reservation, string? cancellationReason)
    {
        var dto = await MapReservationToDtoAsync(reservation);
        var userName = dto.UserName;
        
        var title = "Reserva Cancelada por Propietario";
        var message = $"{userName} ha cancelado su reserva del gazebo para el {reservation.ReservationDate:dd/MM/yyyy} de {reservation.StartTime.Hours:00}:{reservation.StartTime.Minutes:00} a {reservation.EndTime.Hours:00}:{reservation.EndTime.Minutes:00}.";
        
        if (!string.IsNullOrEmpty(cancellationReason))
        {
            message += $" Motivo: {cancellationReason}";
        }
        
        await _notificationService.SendAdminNotificationAsync(
            title,
            message,
            "Reservation",
            reservation.Id.ToString()
        );
    }
    
    private async Task SendNewReservationNotificationToAdmin(Reservation reservation)
    {
        var dto = await MapReservationToDtoAsync(reservation);
        var userName = dto.UserName;
        
        var title = "Nueva Reserva de Gazebo";
        var message = $"{userName} ha solicitado una reserva del gazebo para el {reservation.ReservationDate:dd/MM/yyyy} de {reservation.StartTime.Hours:00}:{reservation.StartTime.Minutes:00} a {reservation.EndTime.Hours:00}:{reservation.EndTime.Minutes:00}. Requiere aprobación.";
        
        await _notificationService.SendAdminNotificationAsync(
            title,
            message,
            "Reservation",
            reservation.Id.ToString()
        );
    }
}
