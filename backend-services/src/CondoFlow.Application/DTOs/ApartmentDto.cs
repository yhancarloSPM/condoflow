namespace CondoFlow.Application.DTOs;

public class ApartmentDto
{
    public int Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public int BlockId { get; set; }
    public string BlockName { get; set; } = string.Empty;
}
