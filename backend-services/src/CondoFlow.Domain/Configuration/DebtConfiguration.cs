namespace CondoFlow.Domain.Configuration;

public class DebtConfiguration
{
    public decimal DefaultAmount { get; set; } = 2000;
    public decimal RoofApartmentAmount { get; set; } = 1000;
    public string[] RoofApartmentNumbers { get; set; } = { "501", "502" };
}
