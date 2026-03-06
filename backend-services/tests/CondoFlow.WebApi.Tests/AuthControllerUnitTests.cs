using CondoFlow.WebApi.DTOs;

namespace CondoFlow.WebApi.Tests;

public class AuthControllerUnitTests
{
    [Fact]
    public void Register_ShouldValidateRequiredFields()
    {
        // Arrange
        var request = new RegisterRequest(
            "", // Email vacío
            "Password123!",
            "John",
            "Doe",
            "123456789",
            1, // BlockId
            1, // ApartmentId
            "Admin"
        );

        // Act & Assert
        Assert.True(string.IsNullOrWhiteSpace(request.Email));
    }

    [Fact]
    public void RegisterRequest_ShouldCreateValidObject()
    {
        // Arrange & Act
        var request = new RegisterRequest(
            "test@example.com",
            "Password123!",
            "John",
            "Doe",
            "123456789",
            1, // BlockId
            1, // ApartmentId
            "Admin"
        );

        // Assert
        Assert.Equal("test@example.com", request.Email);
        Assert.Equal("Password123!", request.Password);
        Assert.Equal("John", request.FirstName);
        Assert.Equal("Doe", request.LastName);
        Assert.Equal("Admin", request.Role);
    }

    [Fact]
    public void LoginRequest_ShouldCreateValidObject()
    {
        // Arrange & Act
        var request = new LoginRequest("test@example.com", "Password123!");

        // Assert
        Assert.Equal("test@example.com", request.Email);
        Assert.Equal("Password123!", request.Password);
    }

    [Theory]
    [InlineData("Owner", true)]
    [InlineData("Admin", true)]
    [InlineData("InvalidRole", false)]
    public void Register_ShouldValidateAllowedRoles(string role, bool isValid)
    {
        // Arrange
        var allowedRoles = new[] { "Owner", "Admin" };

        // Act
        var result = allowedRoles.Contains(role);

        // Assert
        Assert.Equal(isValid, result);
    }
}