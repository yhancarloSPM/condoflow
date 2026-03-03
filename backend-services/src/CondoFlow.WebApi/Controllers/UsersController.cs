using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Infrastructure.Identity;
using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Common.DTOs.User;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public UsersController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest(ApiResponse.ErrorResult("Usuario no encontrado", 400));

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return NotFound(ApiResponse.ErrorResult("Usuario no encontrado", 404));

            var userProfile = new
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                ApartmentId = user.ApartmentId,
                OwnerId = user.OwnerId,
                IsApproved = user.IsApproved,
                CreatedAt = user.CreatedAt
            };

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

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(ApiResponse.ErrorResult("Usuario no encontrado", 404));

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(ApiResponse.ErrorResult($"Error al cambiar contraseña: {errors}", 400));
            }

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

            // Actualizar AspNetUsers (Identity)
            var identityUser = await _userManager.FindByIdAsync(userId);
            if (identityUser == null)
                return NotFound(ApiResponse.ErrorResult("Usuario no encontrado", 404));

            identityUser.FirstName = request.FirstName;
            identityUser.LastName = request.LastName;
            identityUser.PhoneNumber = CleanPhoneNumber(request.PhoneNumber);

            var result = await _userManager.UpdateAsync(identityUser);
            if (!result.Succeeded)
                return BadRequest(ApiResponse.ErrorResult("Error al actualizar usuario", 400));

            // Actualizar tabla Users si existe
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null)
            {
                user.FirstName = request.FirstName;
                user.LastName = request.LastName;
                user.PhoneNumber = CleanPhoneNumber(request.PhoneNumber);
                await _context.SaveChangesAsync();
            }

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
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(ApiResponse.ErrorResult("Usuario no encontrado", 404));

            // Resetear ambos estados
            user.IsApproved = false;
            user.IsRejected = false;
            
            // Establecer el nuevo estado
            if (request.Status == "Approved")
            {
                user.IsApproved = true;
                user.ApprovedAt = DateTime.UtcNow;
                user.ApprovedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            }
            else if (request.Status == "Rejected")
            {
                user.IsRejected = true;
                user.RejectedAt = DateTime.UtcNow;
                user.RejectedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            }
            else
            {
                return BadRequest(ApiResponse.ErrorResult("Estado inválido. Use 'Approved' o 'Rejected'", 400));
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(ApiResponse.ErrorResult("Error al actualizar estado del usuario", 400));

            var statusText = request.Status == "Approved" ? "aprobado" : "rechazado";
            return Ok(ApiResponse<object>.SuccessResult(
                new { userId = user.Id, status = request.Status }, 
                $"Usuario {statusText} exitosamente", 
                200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error al cambiar estado: {ex.Message}", 500));
        }
    }

    private string CleanPhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber)) return phoneNumber;
        
        var cleaned = phoneNumber.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
        
        if (cleaned.StartsWith("1") && cleaned.Length == 11)
        {
            return cleaned.Substring(1);
        }
        
        return cleaned;
    }
}
