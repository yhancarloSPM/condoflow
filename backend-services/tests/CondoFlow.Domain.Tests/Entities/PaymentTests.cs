using CondoFlow.Domain.Entities;
using CondoFlow.Domain.ValueObjects;

namespace CondoFlow.Domain.Tests.Entities;

public class PaymentTests
{
    [Fact]
    public void Payment_ShouldCreateWithValidData()
    {
        // Arrange & Act
        var ownerId = Guid.NewGuid();
        var amount = new Money(500, "USD");
        var paymentDate = DateTime.UtcNow;
        
        var payment = new Payment(ownerId, amount, paymentDate, "Bank Transfer");

        // Assert
        Assert.Equal(ownerId, payment.OwnerId);
        Assert.Equal(amount, payment.Amount);
        Assert.Equal(paymentDate, payment.PaymentDate);
        Assert.Equal("Bank Transfer", payment.PaymentMethod);
        Assert.Equal("Pending", payment.Status);
        Assert.Null(payment.DebtId);
    }

    [Fact]
    public void AddReceipt_ShouldUpdateReceiptUrl()
    {
        // Arrange
        var payment = new Payment(Guid.NewGuid(), new Money(500), DateTime.UtcNow, "Cash");

        // Act
        payment.AddReceipt("receipt.jpg");

        // Assert
        Assert.Equal("receipt.jpg", payment.ReceiptUrl);
    }

    [Fact]
    public void Approve_ShouldChangeStatusToApproved()
    {
        // Arrange
        var payment = new Payment(Guid.NewGuid(), new Money(500), DateTime.UtcNow, "Cash");

        // Act
        payment.Approve();

        // Assert
        Assert.Equal("Approved", payment.Status);
    }

    [Fact]
    public void Reject_ShouldChangeStatusToRejected()
    {
        // Arrange
        var payment = new Payment(Guid.NewGuid(), new Money(500), DateTime.UtcNow, "Cash");

        // Act
        payment.Reject();

        // Assert
        Assert.Equal("Rejected", payment.Status);
    }
}