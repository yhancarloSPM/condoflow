namespace CondoFlow.Domain.Enums;

public static class StatusCodes
{
    // Payment/Debt Status Codes
    public const string Pending = "pending";
    public const string Confirmed = "confirmed";
    public const string Paid = "paid";
    public const string Rejected = "rejected";
    public const string Cancelled = "cancelled";
    
    // Incident Status Codes
    public const string Reported = "reported";
    public const string InProgress = "in_progress";
    public const string Resolved = "resolved";
    
    // Reservation Status Codes
    public const string ReservationPending = "pending";
    public const string ReservationConfirmed = "confirmed";
    public const string ReservationRejected = "rejected";
    public const string ReservationCancelled = "cancelled";
}
