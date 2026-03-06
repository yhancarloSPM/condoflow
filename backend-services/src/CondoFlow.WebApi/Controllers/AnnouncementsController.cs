using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Common.Services;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.WebApi.DTOs;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/announcements")]
[Authorize]
public class AnnouncementsController : ControllerBase
{
    private readonly IAnnouncementService _announcementService;
    private readonly INotificationService _notificationService;

    public AnnouncementsController(IAnnouncementService announcementService, INotificationService notificationService)
    {
        _announcementService = announcementService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAnnouncements()
    {
        try
        {
            var response = await _announcementService.GetAllAnnouncementsAsync();
            return Ok(ApiResponse<object>.SuccessResult(response, "Anuncios obtenidos exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al obtener anuncios", 500));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.ErrorResult("Datos inválidos", 400));

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System";
            var announcement = await _announcementService.CreateAnnouncementAsync(
                request.Title, request.Content, request.IsUrgent, userId, request.EventDate);
            
            // Enviar notificación a todos los usuarios
            await _notificationService.SendAnnouncementNotificationAsync(announcement.Id, announcement.Title, announcement.IsUrgent);

            var response = new AnnouncementResponse
            {
                Id = announcement.Id,
                Title = announcement.Title,
                Content = announcement.Content,
                IsUrgent = announcement.IsUrgent,
                EventDate = announcement.EventDate,
                CreatedAt = announcement.CreatedAt,
                CreatedBy = announcement.CreatedBy,
                IsActive = announcement.IsActive,
                AnnouncementTypeId = announcement.AnnouncementTypeId,
                AnnouncementTypeName = "General"
            };

            return Ok(ApiResponse<AnnouncementResponse>.SuccessResult(response, "Anuncio creado exitosamente", 201));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al crear anuncio", 500));
        }
    }

    [HttpGet("types")]
    public async Task<IActionResult> GetAnnouncementTypes()
    {
        try
        {
            var types = await _announcementService.GetAnnouncementTypesAsync();
            return Ok(ApiResponse<object>.SuccessResult(types, "Tipos de anuncio obtenidos exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al obtener tipos de anuncio", 500));
        }
    }

    [HttpPut("{id}/type")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateAnnouncementType(Guid id, [FromBody] UpdateAnnouncementTypeRequest request)
    {
        try
        {
            var success = await _announcementService.UpdateAnnouncementTypeAsync(id, request.AnnouncementTypeId);
            if (!success)
                return NotFound(ApiResponse.ErrorResult("Anuncio no encontrado o tipo inválido", 404));

            return Ok(ApiResponse<object?>.SuccessResult(null, "Tipo de anuncio actualizado exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al actualizar tipo de anuncio", 500));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAnnouncement(Guid id)
    {
        try
        {
            // Obtener el anuncio antes de eliminarlo para la notificación
            var announcement = await _announcementService.GetAnnouncementByIdAsync(id);
            if (announcement == null)
                return NotFound(ApiResponse.ErrorResult("Anuncio no encontrado", 404));

            await _announcementService.DeleteAnnouncementAsync(id);
            
            // Notificar a todos los propietarios sobre la eliminación
            await _notificationService.SendAnnouncementDeletionNotificationAsync(announcement.Title);
            
            return Ok(ApiResponse<object?>.SuccessResult(null, "Anuncio eliminado exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al eliminar anuncio", 500));
        }
    }
}
