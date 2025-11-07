using CondoFlow.Domain.Entities;

namespace CondoFlow.Domain.Tests.Entities;

public class ApartmentTests
{
    [Fact]
    public void Apartment_ShouldCreateWithValidData()
    {
        // Arrange & Act
        var ownerId = Guid.NewGuid();
        var blockId = 1;
        var apartment = new Apartment("101", 1, ownerId, blockId);

        // Assert
        Assert.Equal("101", apartment.Number);
        Assert.Equal(1, apartment.Floor);
        Assert.Equal(ownerId, apartment.OwnerId);
        Assert.Equal(blockId, apartment.BlockId);
    }

    [Fact]
    public void AssignOwner_ShouldUpdateOwnerIdAndReference()
    {
        // Arrange
        var apartment = new Apartment("101", 1, Guid.NewGuid(), 1);
        var owner = new Owner("John", "Doe", "john@test.com", "123456789", "12345678");

        // Act
        apartment.AssignOwner(owner);

        // Assert
        Assert.Equal(owner.Id, apartment.OwnerId);
        Assert.Equal(owner, apartment.Owner);
    }
}