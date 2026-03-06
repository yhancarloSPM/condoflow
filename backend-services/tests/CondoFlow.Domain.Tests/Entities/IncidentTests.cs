using CondoFlow.Domain.Entities;

namespace CondoFlow.Domain.Tests.Entities;

public class IncidentTests
{
    [Fact]
    public void Incident_ShouldCreateWithValidData()
    {
        // Arrange & Act
        var ownerId = Guid.NewGuid();
        var incident = new Incident(ownerId, "Water leak", "Leak in bathroom", "plumbing", "high", "data:image/jpeg;base64,/9j/4AAQ");

        // Assert
        Assert.Equal(ownerId, incident.OwnerId);
        Assert.Equal("Water leak", incident.Title);
        Assert.Equal("Leak in bathroom", incident.Description);
        Assert.Equal("reported", incident.Status);
        Assert.Equal("high", incident.Priority);
        Assert.Equal("plumbing", incident.Category);
        Assert.Equal("data:image/jpeg;base64,/9j/4AAQ", incident.ImageData);
    }

    [Fact]
    public void ChangeStatus_ShouldUpdateStatus()
    {
        // Arrange
        var incident = new Incident(Guid.NewGuid(), "Test", "Test description", "general");

        // Act
        incident.ChangeStatus("in_progress");

        // Assert
        Assert.Equal("in_progress", incident.Status);
    }

    [Fact]
    public void AddImage_ShouldUpdateImageData()
    {
        // Arrange
        var incident = new Incident(Guid.NewGuid(), "Test", "Test description", "general");

        // Act
        incident.AddImage("data:image/jpeg;base64,/9j/4AAQ");

        // Assert
        Assert.Equal("data:image/jpeg;base64,/9j/4AAQ", incident.ImageData);
    }
}