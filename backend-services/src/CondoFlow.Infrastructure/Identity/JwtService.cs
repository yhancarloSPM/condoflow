using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace CondoFlow.Infrastructure.Identity;

public class JwtService
{
    private readonly IConfiguration _configuration;
    private readonly UserManager<ApplicationUser> _userManager;

    public JwtService(IConfiguration configuration, UserManager<ApplicationUser> userManager)
    {
        _configuration = configuration;
        _userManager = userManager;
    }

    public string GenerateToken(ApplicationUser user, IList<string> roles)
    {
        if (user == null) throw new ArgumentNullException(nameof(user));
        if (string.IsNullOrEmpty(user.Email)) throw new ArgumentException("User email is required");
        if (roles == null) throw new ArgumentNullException(nameof(roles));

        var jwtKey = _configuration["Jwt:Key"];
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];

        if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
            throw new InvalidOperationException("JWT key must be at least 32 characters long");
        if (string.IsNullOrEmpty(jwtIssuer))
            throw new InvalidOperationException("JWT issuer is required");
        if (string.IsNullOrEmpty(jwtAudience))
            throw new InvalidOperationException("JWT audience is required");

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new("FirstName", user.FirstName ?? string.Empty),
            new("LastName", user.LastName ?? string.Empty)
        };

        if (user.OwnerId.HasValue)
        {
            claims.Add(new Claim("OwnerId", user.OwnerId.Value.ToString()));
        }

        foreach (var role in roles)
        {
            if (!string.IsNullOrEmpty(role))
                claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1), // Reducido a 1 hora por seguridad
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public async Task<string> StoreRefreshTokenAsync(ApplicationUser user, string refreshToken)
    {
        Console.WriteLine($"[JWT] Almacenando refresh token para {user.Email}");
        Console.WriteLine($"[JWT] Token: {refreshToken[..20]}...");
        
        var result = await _userManager.SetAuthenticationTokenAsync(user, "CondoFlow", "RefreshToken", refreshToken);
        
        if (result.Succeeded)
        {
            Console.WriteLine($"[JWT] Token almacenado exitosamente");
        }
        else
        {
            Console.WriteLine($"[JWT] ERROR al almacenar token: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }
        
        return refreshToken;
    }

    public async Task<bool> ValidateRefreshTokenAsync(ApplicationUser user, string refreshToken)
    {
        Console.WriteLine($"[JWT] Validando refresh token para {user.Email}");
        var storedToken = await _userManager.GetAuthenticationTokenAsync(user, "CondoFlow", "RefreshToken");
        
        Console.WriteLine($"[JWT] Token almacenado existe: {!string.IsNullOrEmpty(storedToken)}");
        if (!string.IsNullOrEmpty(storedToken))
        {
            Console.WriteLine($"[JWT] Stored: {storedToken[..20]}...");
            Console.WriteLine($"[JWT] Request: {refreshToken[..20]}...");
        }
        
        var isValid = storedToken == refreshToken;
        Console.WriteLine($"[JWT] Token válido: {isValid}");
        
        return isValid;
    }

    public async Task RevokeRefreshTokenAsync(ApplicationUser user)
    {
        await _userManager.RemoveAuthenticationTokenAsync(user, "CondoFlow", "RefreshToken");
    }
}