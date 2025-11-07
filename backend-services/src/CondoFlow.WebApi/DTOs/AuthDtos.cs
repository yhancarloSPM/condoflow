using System.ComponentModel.DataAnnotations;

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
    [Required, StringLength(1)] string Block,
    [Required, StringLength(10)] string Apartment,
    [Required, RegularExpression("^(Owner|Admin)$")] string Role = "Owner");

public record AuthResponse(
    string Token, 
    string RefreshToken,
    string Email, 
    string FirstName, 
    string LastName, 
    IList<string> Roles,
    Guid? OwnerId = null,
    string? Block = null,
    string? Apartment = null);

public record RefreshTokenRequest(string RefreshToken);