using CondoFlow.Domain.Entities;

namespace CondoFlow.Domain.Tests.Entities;

public class BlockTests
{
    [Fact]
    public void Block_ShouldCreateWithValidData()
    {
        // Arrange & Act
        var block = new Block
        {
            Name = "Block A",
            Description = "Main building"
        };

        // Assert
        Assert.Equal("Block A", block.Name);
        Assert.Equal("Main building", block.Description);
        Assert.Empty(block.Apartments);
    }

    [Fact]
    public void AddApartment_ShouldAddApartmentToCollection()
    {
        // Arrange
        var block = new Block { Name = "Block A" };
        var apartment = new Apartment("101", 1, Guid.NewGuid(), block.Id);

        // Act
        block.AddApartment(apartment);

        // Assert
        Assert.Single(block.Apartments);
        Assert.Contains(apartment, block.Apartments);
    }
}