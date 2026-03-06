using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Common.Services;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Infrastructure.Identity;
using CondoFlow.WebApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly JwtService _jwtService;
    private readonly ILocalizationService _localization;
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly IAuthService _authService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        JwtService jwtService,
        ILocalizationService localization,
        ApplicationDbContext context,
        IEmailService emailService,
        INotificationService notificationService,
        IAuthService authService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtService = jwtService;
        _localization = localization;
        _context = context;
        _emailService = emailService;
        _notificationService = notificationService;
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("InvalidInputData"), 400));

            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("EmailPasswordRequired"), 400));

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return Unauthorized(ApiResponse.ErrorResult(_localization.GetMessage("InvalidCredentials"), 401));

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, true);
            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                    return Unauthorized(ApiResponse.ErrorResult(_localization.GetMessage("AccountLocked"), 401));
                return Unauthorized(ApiResponse.ErrorResult(_localization.GetMessage("InvalidCredentials"), 401));
            }

            // Verificar si el usuario fue rechazado
            if (user.IsRejected)
            {
                return Unauthorized(ApiResponse.ErrorResult("Tu cuenta ha sido rechazada. Contacta al administrador.", 401));
            }

            // Verificar si el usuario está aprobado
            if (!user.IsApproved)
            {
                return Unauthorized(ApiResponse.ErrorResult("Tu cuenta está pendiente de aprobación. Espera la confirmación.", 401));
            }

            var roles = await _userManager.GetRolesAsync(user);
            var token = _jwtService.GenerateToken(user, roles);
            var refreshToken = _jwtService.GenerateRefreshToken();
            await _jwtService.StoreRefreshTokenAsync(user, refreshToken);

            // Cargar información del apartamento si existe
            string? apartmentInfo = null;
            if (user.ApartmentId.HasValue)
            {
                var apartment = await _authService.GetApartmentInfoAsync(user.ApartmentId.Value);
                if (apartment != null)
                {
                    apartmentInfo = $"{apartment.BlockName}-{apartment.Number}";
                }
            }

            var userData = new {
                token = token,
                refreshToken = refreshToken,
                user = new {
                    id = user.Id,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    email = user.Email,
                    role = roles.FirstOrDefault() ?? "Owner",
                    apartmentId = user.ApartmentId,
                    apartment = apartmentInfo,
                    ownerId = user.OwnerId?.ToString()
                }
            };
            return Ok(ApiResponse<object>.SuccessResult(userData, _localization.GetMessage("LoginSuccessful"), 200));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LOGIN ERROR] {ex.Message}");
            Console.WriteLine($"[LOGIN ERROR STACK] {ex.StackTrace}");
            return StatusCode(500, ApiResponse.ErrorResult(_localization.GetMessage("LoginError"), 500));
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("InvalidInputData"), 400));

            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("EmailPasswordRequired"), 400));

            // Validar rol permitido
            var allowedRoles = new[] { "Owner", "Admin" };
            if (!allowedRoles.Contains(request.Role))
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("InvalidRole"), 400));


            var normalizedEmail = _userManager.NormalizeEmail(request.Email);

            
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {

                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("UserExists"), 400));
            }


            // Verificar que el apartamento existe y está disponible
            var apartmentData = await _authService.GetApartmentInfoAsync(request.ApartmentId);
            if (apartmentData == null)
                return BadRequest(ApiResponse.ErrorResult("Apartamento no encontrado o no disponible", 400));

            // Verificar que el apartamento no esté ya asignado
            var isAvailable = await _authService.IsApartmentAvailableAsync(request.ApartmentId);
            if (!isAvailable)
                return BadRequest(ApiResponse.ErrorResult("Este apartamento ya está asignado a otro usuario", 400));

            var apartment = apartmentData as dynamic;

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = CleanPhoneNumber(request.PhoneNumber),
                ApartmentId = request.ApartmentId,
                BlockId = apartment.BlockId,
                IsApproved = request.Role == "Admin"
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("CreateUserFailed"), 400));

            await _userManager.AddToRoleAsync(user, request.Role);

            // Enviar notificación de nuevo registro
            if (request.Role == "Owner")
            {
                try
                {
                    await _notificationService.SendUserRegistrationNotificationAsync(
                        user.FirstName, user.LastName, apartment.Block.Name, apartment.Number);
                }
                catch (Exception ex)
                {
                    // Log error but continue
                }
            }

            // Si es Owner y no está aprobado, retornar mensaje especial
            if (request.Role == "Owner" && !user.IsApproved)
            {
                var pendingData = new { 
                    email = user.Email,
                    status = "pending_approval"
                };
                return Ok(ApiResponse<object>.SuccessResult(pendingData, _localization.GetMessage("RegistrationPending"), 200));
            }

            // Solo generar tokens si está aprobado (Admin)
            var roles = await _userManager.GetRolesAsync(user);
            var token = _jwtService.GenerateToken(user, roles);
            var refreshToken = _jwtService.GenerateRefreshToken();
            await _jwtService.StoreRefreshTokenAsync(user, refreshToken);

            var authResponse = new AuthResponse(token, refreshToken, user.Email, user.FirstName, user.LastName, roles, user.OwnerId, user.ApartmentId);
            return Ok(ApiResponse<AuthResponse>.SuccessResult(authResponse, _localization.GetMessage("RegistrationSuccessful"), 200));
        }
        catch (Exception ex)
        {


            return StatusCode(500, ApiResponse.ErrorResult($"Error: {ex.Message}", 500));
        }
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("RefreshTokenRequired"), 400));

            // Buscar usuario por refresh token
            var users = _userManager.Users.ToList();
            ApplicationUser? user = null;
            
            foreach (var u in users)
            {
                var storedToken = await _userManager.GetAuthenticationTokenAsync(u, "CondoFlow", "RefreshToken");
                if (storedToken == request.RefreshToken)
                {
                    user = u;
                    break;
                }
            }

            if (user == null)
                return Unauthorized(ApiResponse.ErrorResult(_localization.GetMessage("InvalidRefreshToken"), 401));

            // Generar nuevos tokens
            var roles = await _userManager.GetRolesAsync(user);
            var newToken = _jwtService.GenerateToken(user, roles);
            var newRefreshToken = _jwtService.GenerateRefreshToken();
            
            // Actualizar refresh token
            await _jwtService.StoreRefreshTokenAsync(user, newRefreshToken);

            var authResponse = new AuthResponse(newToken, newRefreshToken, user.Email!, user.FirstName, user.LastName, roles, user.OwnerId, user.ApartmentId);
            return Ok(ApiResponse<AuthResponse>.SuccessResult(authResponse, _localization.GetMessage("TokenRefreshed"), 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult(_localization.GetMessage("TokenRefreshError"), 500));
        }
    }

    [HttpPost("approve-user/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveUser(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(ApiResponse.ErrorResult(_localization.GetMessage("UserNotFound"), 404));

            // Resetear estado anterior y aprobar usuario
            user.IsApproved = true;
            user.IsRejected = false;
            user.ApprovedAt = DateTime.UtcNow;
            user.ApprovedBy = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            user.RejectedAt = null;
            user.RejectedBy = null;
            
            // Si es Owner, generar OwnerId y actualizar Apartment
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains("Owner"))
            {
                var ownerId = Guid.NewGuid();
                user.OwnerId = ownerId;
                
                // Actualizar el OwnerId en el Apartment correspondiente
                if (user.ApartmentId.HasValue)
                {
                    var apartment = await _context.Apartments
                        .FirstOrDefaultAsync(a => a.Id == user.ApartmentId.Value);
                    
                    if (apartment != null)
                    {
                        apartment.OwnerId = ownerId;
                        await _context.SaveChangesAsync();
                    }
                }
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("ApprovalError"), 400));

            // Enviar notificación al usuario
            try
            {
                await _notificationService.SendUserStatusNotificationAsync(
                    user.Id, "Approved", user.FirstName, user.LastName);
            }
            catch (Exception ex)
            {

            }

            var approvalData = new {
                userId = user.Id,
                email = user.Email,
                ownerId = user.OwnerId,
                approvedAt = user.ApprovedAt
            };
            return Ok(ApiResponse<object>.SuccessResult(approvalData, _localization.GetMessage("UserApproved"), 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult(_localization.GetMessage("ApprovalError"), 500));
        }
    }

    [HttpPost("reject-user/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RejectUser(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(ApiResponse.ErrorResult(_localization.GetMessage("UserNotFound"), 404));

            // Resetear estado anterior y rechazar usuario
            user.IsRejected = true;
            user.IsApproved = false;
            user.RejectedAt = DateTime.UtcNow;
            user.RejectedBy = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            user.ApprovedAt = null;
            user.ApprovedBy = null;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("RejectionError"), 400));

            // Enviar notificación al usuario
            try
            {
                await _notificationService.SendUserStatusNotificationAsync(
                    user.Id, "Rejected", user.FirstName, user.LastName);
            }
            catch (Exception ex)
            {

            }

            var rejectionData = new {
                userId = userId,
                email = user.Email,
                rejectedAt = user.RejectedAt,
                rejectedBy = user.RejectedBy
            };
            return Ok(ApiResponse<object>.SuccessResult(rejectionData, _localization.GetMessage("UserRejected"), 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult(_localization.GetMessage("RejectionError"), 500));
        }
    }

    [HttpGet("pending-users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPendingUsers()
    {
        try
        {
            var pendingUsers = await _authService.GetPendingUsersAsync();
            return Ok(ApiResponse<object>.SuccessResult(pendingUsers, "Usuarios pendientes obtenidos", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error: {ex.Message}", 500));
        }
    }

    [HttpGet("all-users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await _authService.GetAllUsersAsync();
            return Ok(ApiResponse<object>.SuccessResult(users, "Usuarios obtenidos", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error: {ex.Message}", 500));
        }
    }

    [HttpDelete("delete-user/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(ApiResponse.ErrorResult("Usuario no encontrado", 404));

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(ApiResponse.ErrorResult("Error eliminando usuario", 400));

            return Ok(ApiResponse<object>.SuccessResult(new { userId }, "Usuario eliminado", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error: {ex.Message}", 500));
        }
    }

    private string CleanPhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber)) return phoneNumber;
        
        // Remover espacios y caracteres especiales
        var cleaned = phoneNumber.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
        
        // Si empieza con 1 y tiene 11 dígitos (formato US), quitar el 1
        if (cleaned.StartsWith("1") && cleaned.Length == 11)
        {
            return cleaned.Substring(1);
        }
        
        return cleaned;
    }
}
