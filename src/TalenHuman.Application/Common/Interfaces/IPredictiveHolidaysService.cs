using TalenHuman.Domain.Entities;

namespace TalenHuman.Application.Common.Interfaces;

public interface IPredictiveHolidaysService
{
    IEnumerable<PredictiveSpecialDate> GenerateHolidays(int year, string countryCode);
}
