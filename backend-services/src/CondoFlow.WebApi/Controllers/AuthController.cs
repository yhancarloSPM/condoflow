using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Common.Services;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Enums;
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
public class AuthController : BaseApiController
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
        if (!ModelState.IsValid)
            return BadRequestError(_localization.GetMessage("InvalidInputData"));

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequestError(_localization.GetMessage("EmailPasswordRequired"));

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return UnauthorizedError(_localization.GetMessage("InvalidCredentials"));

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, true);
        if (!result.Succeeded)
        {
            if (result.IsLockedOut)
                return UnauthorizedError(_localization.GetMessage("AccountLocked"));
            return UnauthorizedError(_localization.GetMessage("InvalidCredentials"));
        }

        // Verificar si el usuario fue rechazado
        if (user.IsRejected)
            return UnauthorizedError("Tu cuenta ha sido rechazada. Contacta al administrador.");

        // Verificar si el usuario está aprobado
        if (!user.IsApproved)
            return UnauthorizedError("Tu cuenta está pendiente de aprobación. Espera la confirmación.");

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
                role = roles.FirstOrDefault() ?? UserRoles.Owner,
                apartmentId = user.ApartmentId,
                apartment = apartmentInfo,
                ownerId = user.OwnerId?.ToString()
            }
        };
        return Success(userData, _localization.GetMessage("LoginSuccessful"));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequestError(_localization.GetMessage("InvalidInputData"));

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequestError(_localization.GetMessage("EmailPasswordRequired"));

        // Validar rol permitido
        var allowedRoles = new[] { UserRoles.Owner, UserRoles.Admin };
        if (!allowedRoles.Contains(request.Role))
            return BadRequestError(_localization.GetMessage("InvalidRole"));

        var normalizedEmail = _userManager.NormalizeEmail(request.Email);
        
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
            return BadRequestError(_localization.GetMessage("UserExists"));

        // Verificar que el apartamento existe y está disponible
        var apartmentData = await _authService.GetApartmentInfoAsync(request.ApartmentId);
        if (apartmentData == null)
            return BadRequestError("Apartamento no encontrado o no disponible");

        // Verificar que el apartamento no esté ya asignado
        var isAvailable = await _authService.IsApartmentAvailableAsync(request.ApartmentId);
        if (!isAvailable)
            return BadRequestError("Este apartamento ya está asignado a otro usuario");

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
            IsApproved = request.Role == UserRoles.Admin
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequestError(_localization.GetMessage("CreateUserFailed"));

        await _userManager.AddToRoleAsync(user, request.Role);

        // Enviar notificación de nuevo registro
        if (request.Role == UserRoles.Owner)
        {
            try
            {
                await _notificationService.SendUserRegistrationNotificationAsync(
                    user.FirstName, user.LastName, apartment.Block.Name, apartment.Number);
            }
            catch (Exception ex)
            {
                // Log error but continue - notification failure shouldn't break registration
            }
        }

        // Si es Owner y no está aprobado, retornar mensaje especial
        if (request.Role == UserRoles.Owner && !user.IsApproved)
        {
            var pendingData = new { 
                email = user.Email,
                status = UserStatusCodes.PendingApproval
            };
            return Success(pendingData, _localization.GetMessage("RegistrationPending"));
        }

        // Solo generar tokens si está aprobado (Admin)
        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtService.GenerateToken(user, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();
        await _jwtService.StoreRefreshTokenAsync(user, refreshToken);

        var authResponse = new AuthResponse(token, refreshToken, user.Email, user.FirstName, user.LastName, roles, user.OwnerId, user.ApartmentId);
        return Success(authResponse, _localization.GetMessage("RegistrationSuccessful"));
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return BadRequestError(_localization.GetMessage("RefreshTokenRequired"));

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
            return UnauthorizedError(_localization.GetMessage("InvalidRefreshToken"));

        // Generar nuevos tokens
        var roles = await _userManager.GetRolesAsync(user);
        var newToken = _jwtService.GenerateToken(user, roles);
        var newRefreshToken = _jwtService.GenerateRefreshToken();
        
        // Actualizar refresh token
        await _jwtService.StoreRefreshTokenAsync(user, newRefreshToken);

        var authResponse = new AuthResponse(newToken, newRefreshToken, user.Email!, user.FirstName, user.LastName, roles, user.OwnerId, user.ApartmentId);
        return Success(authResponse, _localization.GetMessage("TokenRefreshed"));
    }

    [HttpPost("approve-user/{userId}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> ApproveUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFoundError(_localization.GetMessage("UserNotFound"));

        // Resetear estado anterior y aprobar usuario
        user.IsApproved = true;
        user.IsRejected = false;
        user.ApprovedAt = DateTime.UtcNow;
        user.ApprovedBy = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        user.RejectedAt = null;
        user.RejectedBy = null;
        
        // Si es Owner, generar OwnerId y actualizar Apartment
        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains(UserRoles.Owner))
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
            return BadRequestError(_localization.GetMessage("ApprovalError"));

        // Enviar notificación al usuario
        try
        {
            await _notificationService.SendUserStatusNotificationAsync(
                user.Id, UserStatusCodes.Approved, user.FirstName, user.LastName);
        }
        catch (Exception ex)
        {
            // Log error but continue - notification failure shouldn't break approval
        }

        var approvalData = new {
            userId = user.Id,
            email = user.Email,
            ownerId = user.OwnerId,
            approvedAt = user.ApprovedAt
        };
        return Success(approvalData, _localization.GetMessage("UserApproved"));
    }

    [HttpPost("reject-user/{userId}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> RejectUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFoundError(_localization.GetMessage("UserNotFound"));

        // Resetear estado anterior y rechazar usuario
        user.IsRejected = true;
        user.IsApproved = false;
        user.RejectedAt = DateTime.UtcNow;
        user.RejectedBy = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        user.ApprovedAt = null;
        user.ApprovedBy = null;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequestError(_localization.GetMessage("RejectionError"));

        // Enviar notificación al usuario
        try
        {
            await _notificationService.SendUserStatusNotificationAsync(
                user.Id, UserStatusCodes.Rejected, user.FirstName, user.LastName);
        }
        catch (Exception ex)
        {
            // Log error but continue - notification failure shouldn't break rejection
        }

        var rejectionData = new {
            userId = userId,
            email = user.Email,
            rejectedAt = user.RejectedAt,
            rejectedBy = user.RejectedBy
        };
        return Success(rejectionData, _localization.GetMessage("UserRejected"));
    }

    [HttpGet("pending-users")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> GetPendingUsers()
    {
        var pendingUsers = await _authService.GetPendingUsersAsync();
        return Success(pendingUsers, "Usuarios pendientes obtenidos");
    }

    [HttpGet("all-users")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _authService.GetAllUsersAsync();
        return Success(users, "Usuarios obtenidos");
    }

    [HttpDelete("delete-user/{userId}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFoundError("Usuario no encontrado");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequestError("Error eliminando usuario");

        return Success(new { userId }, "Usuario eliminado");
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
