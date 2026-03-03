using CondoFlow.Domain.Entities;
using CondoFlow.Domain.Enums;
using CondoFlow.Domain.ValueObjects;
using Xunit;

namespace CondoFlow.Domain.Tests.Entities;

public class DebtTests
{
    [Fact]
    public void Constructor_ValidParameters_CreatesDebt()
    {
        // Arrange
        var ownerId = Guid.NewGuid();
        var amount = new Money(1800, "DOP");
        var dueDate = DateTime.Now.AddDays(30);
        var concept = "Mantenimiento Enero 2024";
        var month = 1;
        var year = 2024;

        // Act
        var debt = new Debt(ownerId, amount, dueDate, concept, month, year);

        // Assert
        Assert.Equal(ownerId, debt.OwnerId);
        Assert.Equal(amount, debt.Amount);
        Assert.Equal(dueDate, debt.DueDate);
        Assert.Equal(concept, debt.Concept);
        Assert.Equal("Pending", debt.Status);
        Assert.Equal(month, debt.Month);
        Assert.Equal(year, debt.Year);
    }

    [Fact]
    public void Constructor_NullAmount_ThrowsArgumentNullException()
    {
        // Arrange
        var ownerId = Guid.NewGuid();
        var dueDate = DateTime.Now.AddDays(30);

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new Debt(ownerId, null!, dueDate, "Test", 1, 2024));
    }

    [Fact]
    public void Constructor_NullConcept_ThrowsArgumentNullException()
    {
        // Arrange
        var ownerId = Guid.NewGuid();
        var amount = new Money(1800, "DOP");
        var dueDate = DateTime.Now.AddDays(30);

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new Debt(ownerId, amount, dueDate, null!, 1, 2024));
    }

    [Fact]
    public void MarkAsPaid_ChangesStatusToPaid()
    {
        // Arrange
        var debt = CreateValidDebt();

        // Act
        debt.MarkAsPaid();

        // Assert
        Assert.Equal(StatusPayments.Paid, debt.Status);
    }

    [Fact]
    public void MarkAsOverdue_ChangesStatusToOverdue()
    {
        // Arrange
        var debt = CreateValidDebt();

        // Act
        debt.MarkAsOverdue();

        // Assert
        Assert.Equal(StatusPayments.Overdue, debt.Status);
    }

    private static Debt CreateValidDebt()
    {
        return new Debt(
            Guid.NewGuid(),
            new Money(1800, "DOP"),
            DateTime.Now.AddDays(30),
            "Mantenimiento",
            1,
            2024);
    }
}