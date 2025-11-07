using CondoFlow.Domain.Entities;

namespace CondoFlow.Domain.Tests.Entities;

public class OwnerTests
{
    [Fact]
    public void Owner_ShouldCreateWithValidData()
    {
        // Arrange & Act
        var owner = new Owner("John", "Doe", "john@test.com", "123456789", "12345678");

        // Assert
        Assert.NotEqual(Guid.Empty, owner.Id);
        Assert.Equal("John", owner.FirstName);
        Assert.Equal("Doe", owner.LastName);
        Assert.Equal("john@test.com", owner.Email);
        Assert.Equal("123456789", owner.Phone);
        Assert.Equal("12345678", owner.DocumentId);
        Assert.Empty(owner.Apartments);
    }

    [Fact]
    public void Owner_ShouldThrowException_WhenFirstNameIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new Owner(null!, "Doe", "john@test.com", "123456789", "12345678"));
    }

    [Fact]
    public void AddApartment_ShouldAddApartmentToCollection()
    {
        // Arrange
        var owner = new Owner("John", "Doe", "john@test.com", "123456789", "12345678");
        var apartment = new Apartment("101", 1, owner.Id, 1);

        // Act
        owner.AddApartment(apartment);

        // Assert
        Assert.Single(owner.Apartments);
        Assert.Contains(apartment, owner.Apartments);
    }
}