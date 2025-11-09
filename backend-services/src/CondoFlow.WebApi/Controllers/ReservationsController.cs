using CondoFlow.Application.Common.DTOs.Reservation;
using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Common.Services;
using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Repositories;
using CondoFlow.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly IReservationRepository _reservationRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notificationService;

    public ReservationsController(IReservationRepository reservationRepository, UserManager<ApplicationUser> userManager, INotificationService notificationService)
    {
        _reservationRepository = reservationRepository;
        _userManager = userManager;
        _notificationService = notificationService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ReservationDto>>>> GetAll()
    {
        var reservations = await _reservationRepository.GetAllAsync();
        var reservationDtos = new List<ReservationDto>();
        
        foreach (var reservation in reservations)
        {
            reservationDtos.Add(await MapToDtoAsync(reservation));
        }
        
        return Ok(ApiResponse<IEnumerable<ReservationDto>>.SuccessResult(
            reservationDtos, 
            "Reservas obtenidas exitosamente"));
    }

    [HttpGet("my-reservations")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ReservationDto>>>> GetMyReservations()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var reservations = await _reservationRepository.GetByUserIdAsync(userId);
        var reservationDtos = new List<ReservationDto>();
        
        foreach (var reservation in reservations)
        {
            reservationDtos.Add(await MapToDtoAsync(reservation));
        }
        
        return Ok(ApiResponse<IEnumerable<ReservationDto>>.SuccessResult(
            reservationDtos, 
            "Mis reservas obtenidas exitosamente"));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ReservationDto>>> GetById(Guid id)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null)
            return NotFound(ApiResponse<ReservationDto>.ErrorResult("Reserva no encontrada"));

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var isAdmin = User.IsInRole("Admin");
        
        if (!isAdmin && reservation.UserId != userId)
            return Forbid();

        return Ok(ApiResponse<ReservationDto>.SuccessResult(
            await MapToDtoAsync(reservation), 
            "Reserva obtenida exitosamente"));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ReservationDto>>> Create(CreateReservationDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        // Debug: Log received data


        // Validaciones de negocio
        if (dto.ReservationDate.Date <= DateTime.Now.Date)
            return BadRequest(ApiResponse<ReservationDto>.ErrorResult("La fecha de reserva debe ser futura"));

        if (!TimeSpan.TryParse(dto.StartTime, out var startTime) || !TimeSpan.TryParse(dto.EndTime, out var endTime))
            return BadRequest(ApiResponse<ReservationDto>.ErrorResult("Formato de hora inválido"));

        // Validar que no sean la misma hora
        if (startTime == endTime)
            return BadRequest(ApiResponse<ReservationDto>.ErrorResult("La hora de inicio debe ser diferente a la hora de fin"));

        // Verificar disponibilidad
        var isAvailable = await _reservationRepository.IsSlotAvailableAsync(
            dto.ReservationDate, startTime, endTime);
        
        if (!isAvailable)
            return BadRequest(ApiResponse<ReservationDto>.ErrorResult("El horario seleccionado no está disponible"));

        // Verificar límite de reservas por mes (máximo 5 reservas por mes)
        var userReservations = await _reservationRepository.GetByUserIdAsync(userId);
        var monthlyReservations = userReservations.Count(r => 
            (r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Confirmed) &&
            r.ReservationDate.Month == dto.ReservationDate.Month &&
            r.ReservationDate.Year == dto.ReservationDate.Year);
        
        if (monthlyReservations >= 5)
            return BadRequest(ApiResponse<ReservationDto>.ErrorResult("Has alcanzado el límite de 5 reservas para este mes. Puedes crear nuevas reservas el próximo mes o cancelar una reserva existente."));

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
        
        // Enviar notificación al admin cuando se crea una nueva reserva
        await SendNewReservationNotificationToAdmin(createdReservation!);
        
        return CreatedAtAction(nameof(GetById), new { id = created.Id },
            ApiResponse<ReservationDto>.SuccessResult(
                await MapToDtoAsync(createdReservation!), 
                "Reserva creada exitosamente"));
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<ReservationDto>>> UpdateStatus(Guid id, [FromBody] object request)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null)
            return NotFound(ApiResponse<ReservationDto>.ErrorResult("Reserva no encontrada"));

        string status;
        string? reason = null;

        if (request is string statusString)
        {
            status = statusString;
        }
        else if (request is System.Text.Json.JsonElement jsonElement)
        {
            status = jsonElement.GetProperty("status").GetString() ?? "";
            if (jsonElement.TryGetProperty("reason", out var reasonElement))
            {
                reason = reasonElement.GetString();
            }
        }
        else
        {
            return BadRequest(ApiResponse<ReservationDto>.ErrorResult("Formato de solicitud inválido"));
        }

        if (!Enum.TryParse<ReservationStatus>(status, out var newStatus))
            return BadRequest(ApiResponse<ReservationDto>.ErrorResult("Estado inválido"));

        // Validar que el motivo sea obligatorio para rechazos
        if (newStatus == ReservationStatus.Rejected)
        {
            if (string.IsNullOrWhiteSpace(reason))
                return BadRequest(ApiResponse<ReservationDto>.ErrorResult("El motivo de rechazo es obligatorio"));
            
            if (reason.Length < 10)
                return BadRequest(ApiResponse<ReservationDto>.ErrorResult("El motivo de rechazo debe tener al menos 10 caracteres"));
                
            reservation.Reject(reason);
        }
        else if (newStatus == ReservationStatus.Confirmed)
        {
            reservation.Confirm();
        }
        else
        {
            reservation.Status = newStatus;
        }
        
        var updated = await _reservationRepository.UpdateAsync(reservation);
        
        // Enviar notificación al propietario
        await SendReservationStatusNotification(updated, reason);
        
        return Ok(ApiResponse<ReservationDto>.SuccessResult(
            await MapToDtoAsync(updated), 
            "Estado de reserva actualizado exitosamente"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Cancel(Guid id, [FromBody] object? request = null)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null)
            return NotFound(ApiResponse<object>.ErrorResult("Reserva no encontrada"));

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var isAdmin = User.IsInRole("Admin");
        
        if (!isAdmin && reservation.UserId != userId)
            return Forbid();

        // Solo permitir cancelar reservas pendientes o confirmadas
        if (reservation.Status != ReservationStatus.Pending && 
            reservation.Status != ReservationStatus.Confirmed)
            return BadRequest(ApiResponse<object>.ErrorResult("No se puede cancelar esta reserva"));

        string? reason = null;
        if (request != null && request is System.Text.Json.JsonElement jsonElement)
        {
            if (jsonElement.TryGetProperty("reason", out var reasonElement))
            {
                reason = reasonElement.GetString();
            }
        }

        reservation.Cancel(reason);
        await _reservationRepository.UpdateAsync(reservation);
        
        // Enviar notificación al admin cuando el owner cancela
        if (!isAdmin)
        {
            await SendCancellationNotificationToAdmin(reservation, reason);
        }
        
        return Ok(ApiResponse<object>.SuccessResult("Reserva cancelada exitosamente"));
    }

    [HttpGet("slots")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ReservationSlotDto>>>> GetAvailableSlots()
    {
        var slots = await _reservationRepository.GetAvailableSlotsAsync();
        var slotDtos = slots.Select(s => new ReservationSlotDto
        {
            Id = s.Id,
            Name = s.Name,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            IsAvailable = s.IsAvailable
        });
        
        return Ok(ApiResponse<IEnumerable<ReservationSlotDto>>.SuccessResult(
            slotDtos, 
            "Horarios disponibles obtenidos exitosamente"));
    }

    [HttpGet("availability")]
    public async Task<ActionResult<ApiResponse<bool>>> CheckAvailability(
        [FromQuery] DateTime date, 
        [FromQuery] TimeSpan startTime, 
        [FromQuery] TimeSpan endTime)
    {
        var isAvailable = await _reservationRepository.IsSlotAvailableAsync(date, startTime, endTime);
        
        return Ok(ApiResponse<bool>.SuccessResult(
            isAvailable, 
            isAvailable ? "Horario disponible" : "Horario no disponible"));
    }

    private async Task<ReservationDto> MapToDtoAsync(Reservation reservation)
    {
        var user = await _userManager.FindByIdAsync(reservation.UserId);
        var userName = "Usuario desconocido";
        
        if (user != null)
        {
            var fullName = $"{user.FirstName} {user.LastName}".Trim();
            var apartment = !string.IsNullOrEmpty(user.Block) && !string.IsNullOrEmpty(user.Apartment) 
                ? $"{user.Block}-{user.Apartment}" 
                : "Sin apartamento";
            userName = $"{fullName}\n{apartment}";
        }
        
        return new ReservationDto
        {
            Id = reservation.Id,
            UserId = reservation.UserId,
            UserName = userName,
            ReservationDate = reservation.ReservationDate,
            StartTime = reservation.StartTime,
            EndTime = reservation.EndTime,
            Status = reservation.Status.ToString(),
            Notes = reservation.Notes,
            RejectionReason = reservation.RejectionReason,
            CancellationReason = reservation.CancellationReason,
            EventTypeCode = reservation.EventTypeCode,
            CreatedAt = reservation.CreatedAt,
            UpdatedAt = reservation.UpdatedAt
        };
    }
    
    private async Task SendReservationStatusNotification(Reservation reservation, string? rejectionReason = null)
    {
        Console.WriteLine($"[DEBUG] SendReservationStatusNotification llamado para reserva {reservation.Id}, estado: {reservation.Status}");
        
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
            Console.WriteLine($"[DEBUG] No se envía notificación para estado: {reservation.Status}");
            return; // No enviar notificación para otros estados
        }
        
        Console.WriteLine($"[DEBUG] Enviando notificación: {title}");
        
        await _notificationService.CreateNotificationAsync(
            reservation.UserId,
            title,
            message,
            "Reservation",
            reservation.Id.ToString()
        );
        
        Console.WriteLine($"[DEBUG] Notificación enviada exitosamente");
    }
    
    private async Task SendCancellationNotificationToAdmin(Reservation reservation, string? cancellationReason)
    {
        var user = await _userManager.FindByIdAsync(reservation.UserId);
        var userName = user != null ? $"{user.FirstName} {user.LastName}" : "Usuario desconocido";
        var apartment = user != null && !string.IsNullOrEmpty(user.Block) && !string.IsNullOrEmpty(user.Apartment) 
            ? $"{user.Block}-{user.Apartment}" 
            : "Sin apartamento";
        
        var title = "Reserva Cancelada por Propietario";
        var message = $"{userName} ({apartment}) ha cancelado su reserva del gazebo para el {reservation.ReservationDate:dd/MM/yyyy} de {reservation.StartTime.Hours:00}:{reservation.StartTime.Minutes:00} a {reservation.EndTime.Hours:00}:{reservation.EndTime.Minutes:00}.";
        
        if (!string.IsNullOrEmpty(cancellationReason))
        {
            message += $" Motivo: {cancellationReason}";
        }
        
        // Enviar notificación al grupo de administradores
        await _notificationService.SendAdminNotificationAsync(
            title,
            message,
            "Reservation",
            reservation.Id.ToString()
        );
    }
    
    private async Task SendNewReservationNotificationToAdmin(Reservation reservation)
    {
        var user = await _userManager.FindByIdAsync(reservation.UserId);
        var userName = user != null ? $"{user.FirstName} {user.LastName}" : "Usuario desconocido";
        var apartment = user != null && !string.IsNullOrEmpty(user.Block) && !string.IsNullOrEmpty(user.Apartment) 
            ? $"{user.Block}-{user.Apartment}" 
            : "Sin apartamento";
        
        var title = "Nueva Reserva de Gazebo";
        var message = $"{userName} ({apartment}) ha solicitado una reserva del gazebo para el {reservation.ReservationDate:dd/MM/yyyy} de {reservation.StartTime.Hours:00}:{reservation.StartTime.Minutes:00} a {reservation.EndTime.Hours:00}:{reservation.EndTime.Minutes:00}. Requiere aprobación.";
        
        // Enviar notificación al grupo de administradores
        await _notificationService.SendAdminNotificationAsync(
            title,
            message,
            "Reservation",
            reservation.Id.ToString()
        );
    }
}
