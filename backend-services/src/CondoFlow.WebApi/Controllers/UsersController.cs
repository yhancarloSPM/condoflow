using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Common.DTOs.User;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Enums;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : BaseApiController
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        var userProfile = await _userService.GetUserProfileAsync(userId);
        if (userProfile == null)
            return NotFoundError("Usuario no encontrado");

        return Success(userProfile, "Perfil obtenido exitosamente");
    }

    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        var success = await _userService.ChangePasswordAsync(userId, request);
        if (!success)
            return BadRequestError("Contraseña actual incorrecta o error al cambiar contraseña");

        return Success<string>("Contraseña cambiada exitosamente");
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        var success = await _userService.UpdateProfileAsync(userId, request);
        if (!success)
            return BadRequestError("Error al actualizar perfil");

        return Success<string>("Perfil actualizado exitosamente");
    }

    [HttpPut("{userId}/status")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> ChangeUserStatus(string userId, [FromBody] ChangeUserStatusRequest request)
    {
        if (request.Status != UserStatusCodes.Approved && request.Status != UserStatusCodes.Rejected)
            return BadRequestError($"Estado inválido. Use '{UserStatusCodes.Approved}' o '{UserStatusCodes.Rejected}'");

        var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminUserId))
            return UnauthorizedError("Admin no identificado");

        var success = await _userService.ChangeUserStatusAsync(userId, request, adminUserId);
        if (!success)
            return NotFoundError("Usuario no encontrado o error al actualizar");

        var statusText = request.Status == UserStatusCodes.Approved ? "aprobado" : "rechazado";
        return Success(new { userId, status = request.Status }, $"Usuario {statusText} exitosamente");
    }
}
