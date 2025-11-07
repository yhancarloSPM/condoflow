using System.ComponentModel.DataAnnotations;

namespace CondoFlow.Application.Common.DTOs.Reservation;

public class RejectReservationRequest
{
    [Required(ErrorMessage = "El motivo de rechazo es obligatorio")]
    [StringLength(500, MinimumLength = 10, ErrorMessage = "El motivo debe tener entre 10 y 500 caracteres")]
    public string Reason { get; set; } = string.Empty;
}