using CondoFlow.Application.Common.DTOs.Reservation;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservationsController : BaseApiController
{
    private readonly IReservationService _reservationService;

    public ReservationsController(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    [HttpGet]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> GetAll()
    {
        var reservations = await _reservationService.GetAllReservationsAsync();
        return Success(reservations, "Reservas obtenidas exitosamente");
    }

    [HttpGet("my-reservations")]
    public async Task<IActionResult> GetMyReservations()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError();

        var reservations = await _reservationService.GetUserReservationsAsync(userId);
        return Success(reservations, "Mis reservas obtenidas exitosamente");
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
        var isAdmin = User.IsInRole(UserRoles.Admin);
        
        try
        {
            var reservation = await _reservationService.GetReservationByIdAsync(id, userId, isAdmin);
            if (reservation == null)
                return NotFoundError<ReservationDto>("Reserva no encontrada");

            return Success(reservation, "Reserva obtenida exitosamente");
        }
        catch (UnauthorizedAccessException)
        {
            return ForbiddenError("No tienes permiso para ver esta reserva");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateReservationDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError();

        try
        {
            var reservation = await _reservationService.CreateReservationAsync(dto, userId);
            return Created(reservation, "Reserva creada exitosamente");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestError(ex.Message);
        }
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] object request)
    {
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
            return BadRequestError("Formato de solicitud inválido");
        }

        try
        {
            var reservation = await _reservationService.UpdateReservationStatusAsync(id, status, reason);
            return Success(reservation, "Estado de reserva actualizado exitosamente");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundError<ReservationDto>(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestError(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] object? request = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
        var isAdmin = User.IsInRole(UserRoles.Admin);

        string? reason = null;
        if (request != null && request is System.Text.Json.JsonElement jsonElement)
        {
            if (jsonElement.TryGetProperty("reason", out var reasonElement))
            {
                reason = reasonElement.GetString();
            }
        }

        try
        {
            await _reservationService.CancelReservationAsync(id, userId, isAdmin, reason);
            return Success<object>(null, "Reserva cancelada exitosamente");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundError(ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenError(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestError(ex.Message);
        }
    }

    [HttpGet("slots")]
    public async Task<IActionResult> GetAvailableSlots()
    {
        var slots = await _reservationService.GetAvailableSlotsAsync();
        return Success(slots, "Horarios disponibles obtenidos exitosamente");
    }

    [HttpGet("availability")]
    public async Task<IActionResult> CheckAvailability(
        [FromQuery] DateTime date, 
        [FromQuery] TimeSpan startTime, 
        [FromQuery] TimeSpan endTime)
    {
        var isAvailable = await _reservationService.CheckAvailabilityAsync(date, startTime, endTime);
        return Success(isAvailable, isAvailable ? "Horario disponible" : "Horario no disponible");
    }
}
