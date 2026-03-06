using System.Globalization;

namespace CondoFlow.Domain.Helpers;

public static class DateHelper
{
    private static readonly CultureInfo SpanishCulture = new("es-ES");

    /// <summary>
    /// Obtiene el nombre del mes en español
    /// </summary>
    /// <param name="month">Número del mes (1-12)</param>
    /// <returns>Nombre del mes en español con la primera letra en mayúscula</returns>
    public static string GetMonthName(int month)
    {
        if (month < 1 || month > 12)
            return month.ToString();

        var monthName = SpanishCulture.DateTimeFormat.GetMonthName(month);
        return char.ToUpper(monthName[0]) + monthName.Substring(1);
    }

    /// <summary>
    /// Obtiene el nombre abreviado del mes en español
    /// </summary>
    /// <param name="month">Número del mes (1-12)</param>
    /// <returns>Nombre abreviado del mes en español</returns>
    public static string GetAbbreviatedMonthName(int month)
    {
        if (month < 1 || month > 12)
            return month.ToString();

        var monthName = SpanishCulture.DateTimeFormat.GetAbbreviatedMonthName(month);
        return char.ToUpper(monthName[0]) + monthName.Substring(1);
    }
}
