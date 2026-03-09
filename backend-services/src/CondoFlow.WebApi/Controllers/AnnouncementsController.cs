using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Common.DTOs.Announcement;
using CondoFlow.Application.Common.Services;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Enums;
using CondoFlow.WebApi.DTOs;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/announcements")]
[Authorize]
public class AnnouncementsController : BaseApiController
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
        var response = await _announcementService.GetAllAnnouncementsAsync();
        return Success(response, "Anuncios obtenidos exitosamente");
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequestError("Datos inválidos");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System";
        var announcement = await _announcementService.CreateAnnouncementAsync(dto, userId);
        
        // Enviar notificación a todos los usuarios
        await _notificationService.SendAnnouncementNotificationAsync(announcement.Id, announcement.Title, announcement.IsUrgent);

        return Created(announcement, "Anuncio creado exitosamente");
    }

    [HttpPut("{id}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UpdateAnnouncement(Guid id, [FromBody] UpdateAnnouncementDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequestError("Datos inválidos");

        var announcement = await _announcementService.UpdateAnnouncementAsync(id, dto);
        if (announcement == null)
            return NotFoundError("Anuncio no encontrado");

        return Success(announcement, "Anuncio actualizado exitosamente");
    }

    [HttpGet("types")]
    public async Task<IActionResult> GetAnnouncementTypes()
    {
        var types = await _announcementService.GetAnnouncementTypesAsync();
        return Success(types, "Tipos de anuncio obtenidos exitosamente");
    }

    [HttpPut("{id}/type")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UpdateAnnouncementType(Guid id, [FromBody] UpdateAnnouncementTypeRequest request)
    {
        var success = await _announcementService.UpdateAnnouncementTypeAsync(id, request.AnnouncementTypeId);
        if (!success)
            return NotFoundError("Anuncio no encontrado o tipo inválido");

        return Success<object>(null!, "Tipo de anuncio actualizado exitosamente");
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> DeleteAnnouncement(Guid id)
    {
        // Obtener el anuncio antes de eliminarlo para la notificación
        var announcement = await _announcementService.GetAnnouncementByIdAsync(id);
        if (announcement == null)
            return NotFoundError("Anuncio no encontrado");

        await _announcementService.DeleteAnnouncementAsync(id);
        
        // Notificar a todos los propietarios sobre la eliminación
        await _notificationService.SendAnnouncementDeletionNotificationAsync(announcement.Title);
        
        return Success<object>(null!, "Anuncio eliminado exitosamente");
    }
}
