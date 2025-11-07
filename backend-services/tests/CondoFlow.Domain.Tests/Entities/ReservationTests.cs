using CondoFlow.Domain.Entities;

namespace CondoFlow.Domain.Tests.Entities;

public class ReservationTests
{
    [Fact]
    public void Reservation_ShouldCreateWithValidData()
    {
        // Arrange & Act
        var userId = Guid.NewGuid().ToString();
        var reservationDate = DateTime.Today.AddDays(1);
        var startTime = new TimeSpan(10, 0, 0);
        var endTime = new TimeSpan(12, 0, 0);
        
        var reservation = new Reservation
        {
            UserId = userId,
            ReservationDate = reservationDate,
            StartTime = startTime,
            EndTime = endTime,
            Notes = "Birthday party",
            Status = ReservationStatus.Pending
        };

        // Assert
        Assert.Equal(userId, reservation.UserId);
        Assert.Equal(reservationDate, reservation.ReservationDate);
        Assert.Equal(startTime, reservation.StartTime);
        Assert.Equal(endTime, reservation.EndTime);
        Assert.Equal(ReservationStatus.Pending, reservation.Status);
        Assert.Equal("Birthday party", reservation.Notes);
    }

    [Fact]
    public void Confirm_ShouldChangeStatusToConfirmed()
    {
        // Arrange
        var reservation = new Reservation
        {
            UserId = Guid.NewGuid().ToString(),
            ReservationDate = DateTime.Today.AddDays(1),
            StartTime = new TimeSpan(10, 0, 0),
            EndTime = new TimeSpan(12, 0, 0),
            Status = ReservationStatus.Pending
        };

        // Act
        reservation.Confirm();

        // Assert
        Assert.Equal(ReservationStatus.Confirmed, reservation.Status);
    }

    [Fact]
    public void Cancel_ShouldChangeStatusToCancelled()
    {
        // Arrange
        var reservation = new Reservation
        {
            UserId = Guid.NewGuid().ToString(),
            ReservationDate = DateTime.Today.AddDays(1),
            StartTime = new TimeSpan(10, 0, 0),
            EndTime = new TimeSpan(12, 0, 0),
            Status = ReservationStatus.Pending
        };

        // Act
        reservation.Cancel();

        // Assert
        Assert.Equal(ReservationStatus.Cancelled, reservation.Status);
    }
}