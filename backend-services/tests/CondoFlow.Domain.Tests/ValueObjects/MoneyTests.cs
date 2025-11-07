using CondoFlow.Domain.ValueObjects;

namespace CondoFlow.Domain.Tests.ValueObjects;

public class MoneyTests
{
    [Fact]
    public void Money_ShouldCreateWithValidAmount()
    {
        // Arrange & Act
        var money = new Money(100.50m, "USD");

        // Assert
        Assert.Equal(100.50m, money.Amount);
        Assert.Equal("USD", money.Currency);
    }

    [Fact]
    public void Money_ShouldThrowException_WhenAmountIsNegative()
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => new Money(-10, "USD"));
    }

    [Fact]
    public void Money_ShouldUseDefaultCurrency()
    {
        // Arrange & Act
        var money = new Money(50);

        // Assert
        Assert.Equal(50m, money.Amount);
        Assert.Equal("DOP", money.Currency);
    }

    [Fact]
    public void Money_Zero_ShouldReturnZeroAmount()
    {
        // Act
        var zero = Money.Zero;

        // Assert
        Assert.Equal(0m, zero.Amount);
        Assert.Equal("DOP", zero.Currency);
    }
}