using System.ComponentModel.DataAnnotations;
using CondoFlow.Domain.Enums;

namespace CondoFlow.WebApi.DTOs;

public record LoginRequest(
    [Required, EmailAddress, StringLength(100)] string Email, 
    [Required, StringLength(100, MinimumLength = 6)] string Password);

public record RegisterRequest(
    [Required, EmailAddress, StringLength(100)] string Email, 
    [Required, StringLength(100, MinimumLength = 6)] string Password, 
    [Required, StringLength(50, MinimumLength = 2)] string FirstName, 
    [Required, StringLength(50, MinimumLength = 2)] string LastName,
    [Required, Phone, StringLength(20)] string PhoneNumber,
    [Required] int BlockId,
    [Required] int ApartmentId,
    [Required, RegularExpression("^(Owner|Admin)$")] string Role = UserRoles.Owner);

public record AuthResponse(
    string Token, 
    string RefreshToken,
    string Email, 
    string FirstName, 
    string LastName, 
    IList<string> Roles,
    Guid? OwnerId = null,
    int? ApartmentId = null);

public record RefreshTokenRequest(string RefreshToken);