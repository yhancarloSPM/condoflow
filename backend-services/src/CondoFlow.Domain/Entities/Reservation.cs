using CondoFlow.Domain.Common;

namespace CondoFlow.Domain.Entities;

public class Reservation : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public DateTime ReservationDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
    public string? Notes { get; set; }
    public string? RejectionReason { get; set; }
    public string? CancellationReason { get; set; }
    public string? EventTypeCode { get; set; }

    public bool IsOverdue => ReservationDate.Date < DateTime.Now.Date || 
                           (ReservationDate.Date == DateTime.Now.Date && EndTime < DateTime.Now.TimeOfDay);

    public void Confirm()
    {
        if (Status == ReservationStatus.Completed || Status == ReservationStatus.Cancelled)
            throw new InvalidOperationException("No se pueden confirmar reservas completadas o canceladas");
            
        Status = ReservationStatus.Confirmed;
        SetUpdatedAt();
    }

    public void Reject(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("El motivo de rechazo es obligatorio");
            
        if (Status == ReservationStatus.Completed || Status == ReservationStatus.Cancelled)
            throw new InvalidOperationException("No se pueden rechazar reservas completadas o canceladas");
        
        Status = ReservationStatus.Rejected;
        RejectionReason = reason;
        SetUpdatedAt();
    }

    public void Cancel(string? reason = null)
    {
        if (Status == ReservationStatus.Completed)
            throw new InvalidOperationException("No se puede cancelar una reserva completada");
            
        Status = ReservationStatus.Cancelled;
        CancellationReason = reason;
        SetUpdatedAt();
    }
}

public enum ReservationStatus
{
    Pending = 0,
    Confirmed = 1,
    Cancelled = 2,
    Completed = 3,
    Rejected = 4
}