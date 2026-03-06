using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Common.DTOs.User;
using CondoFlow.Application.Interfaces.Services;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest(ApiResponse.ErrorResult("Usuario no encontrado", 400));

            var userProfile = await _userService.GetUserProfileAsync(userId);
            if (userProfile == null)
                return NotFound(ApiResponse.ErrorResult("Usuario no encontrado", 404));

            return Ok(ApiResponse<object>.SuccessResult(userProfile, "Perfil obtenido exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al obtener el perfil", 500));
        }
    }

    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest(ApiResponse.ErrorResult("Usuario no encontrado", 400));

            var success = await _userService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
            if (!success)
                return BadRequest(ApiResponse.ErrorResult("Error al cambiar contraseña", 400));

            return Ok(ApiResponse<object>.SuccessResult(new { message = "Contraseña actualizada" }, "Contraseña cambiada exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al cambiar la contraseña", 500));
        }
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest(ApiResponse.ErrorResult("Usuario no encontrado", 400));

            var success = await _userService.UpdateProfileAsync(userId, request);
            if (!success)
                return BadRequest(ApiResponse.ErrorResult("Error al actualizar usuario", 400));

            return Ok(ApiResponse<object>.SuccessResult(new { message = "Perfil actualizado" }, "Perfil actualizado exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al actualizar el perfil", 500));
        }
    }

    [HttpPut("{userId}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ChangeUserStatus(string userId, [FromBody] ChangeUserStatusRequest request)
    {
        try
        {
            if (request.Status != "Approved" && request.Status != "Rejected")
                return BadRequest(ApiResponse.ErrorResult("Estado inválido. Use 'Approved' o 'Rejected'", 400));

            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(adminUserId))
                return BadRequest(ApiResponse.ErrorResult("Admin no identificado", 400));

            var success = await _userService.ChangeUserStatusAsync(userId, request.Status, adminUserId);
            if (!success)
                return NotFound(ApiResponse.ErrorResult("Usuario no encontrado o error al actualizar", 404));

            var statusText = request.Status == "Approved" ? "aprobado" : "rechazado";
            return Ok(ApiResponse<object>.SuccessResult(
                new { userId, status = request.Status }, 
                $"Usuario {statusText} exitosamente", 
                200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error al cambiar estado: {ex.Message}", 500));
        }
    }
}
