using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Common.Services;
using CondoFlow.Infrastructure.Repositories;
using CondoFlow.Domain.Entities;
using CondoFlow.WebApi.DTOs;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/announcements")]
[Authorize]
public class AnnouncementsController : ControllerBase
{
    private readonly IAnnouncementRepository _announcementRepository;
    private readonly INotificationService _notificationService;

    public AnnouncementsController(IAnnouncementRepository announcementRepository, INotificationService notificationService)
    {
        _announcementRepository = announcementRepository;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAnnouncements()
    {
        try
        {
            var announcements = await _announcementRepository.GetAllAsync();
            var response = announcements.Select(a => new AnnouncementResponse
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                IsUrgent = a.IsUrgent,
                EventDate = a.EventDate,
                CreatedAt = a.CreatedAt,
                CreatedBy = a.CreatedBy
            }).ToList();

            return Ok(ApiResponse<List<AnnouncementResponse>>.SuccessResult(response, "Anuncios obtenidos exitosamente", 200));
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
            var announcement = new Announcement(request.Title, request.Content, request.IsUrgent, userId, request.EventDate);
            
            await _announcementRepository.AddAsync(announcement);
            
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
                CreatedBy = announcement.CreatedBy
            };

            return Ok(ApiResponse<AnnouncementResponse>.SuccessResult(response, "Anuncio creado exitosamente", 201));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al crear anuncio", 500));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAnnouncement(Guid id)
    {
        try
        {
            // Obtener el anuncio antes de eliminarlo para la notificación
            var announcement = await _announcementRepository.GetByIdAsync(id);
            if (announcement == null)
                return NotFound(ApiResponse.ErrorResult("Anuncio no encontrado", 404));

            await _announcementRepository.DeleteAsync(id);
            
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
