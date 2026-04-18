using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Application.Services;

public class PredictiveHolidaysService : IPredictiveHolidaysService
{
    public IEnumerable<PredictiveSpecialDate> GenerateHolidays(int year, string countryCode)
    {
        return countryCode.ToUpper() switch
        {
            "CO" => GetColombiaHolidays(year),
            "MX" => GetMexicoHolidays(year),
            _ => Enumerable.Empty<PredictiveSpecialDate>()
        };
    }

    private IEnumerable<PredictiveSpecialDate> GetColombiaHolidays(int year)
    {
        var holidays = new List<PredictiveSpecialDate>();
        var easter = GetEaster(year);

        // 1. Fixed Holidays (Stay on the same date)
        AddHoliday(holidays, new DateTime(year, 1, 1), "Año Nuevo", "CO");
        AddHoliday(holidays, new DateTime(year, 5, 1), "Día del Trabajo", "CO");
        AddHoliday(holidays, new DateTime(year, 7, 20), "Grito de Independencia", "CO");
        AddHoliday(holidays, new DateTime(year, 8, 7), "Batalla de Boyacá", "CO");
        AddHoliday(holidays, new DateTime(year, 12, 8), "Inmaculada Concepción", "CO");
        AddHoliday(holidays, new DateTime(year, 12, 25), "Navidad", "CO");

        // 2. Easter Based (Fixed Relative to Easter)
        AddHoliday(holidays, easter.AddDays(-3), "Jueves Santo", "CO");
        AddHoliday(holidays, easter.AddDays(-2), "Viernes Santo", "CO");

        // 3. Emiliani Law (Moved to following Monday)
        AddEmiliani(holidays, new DateTime(year, 1, 6), "Reyes Magos", "CO");
        AddEmiliani(holidays, new DateTime(year, 3, 19), "San José", "CO");
        AddEmiliani(holidays, new DateTime(year, 6, 29), "San Pedro y San Pablo", "CO");
        AddEmiliani(holidays, new DateTime(year, 8, 15), "Asunción de la Virgen", "CO");
        AddEmiliani(holidays, new DateTime(year, 10, 12), "Día de la Raza", "CO");
        AddEmiliani(holidays, new DateTime(year, 11, 1), "Todos los Santos", "CO");
        AddEmiliani(holidays, new DateTime(year, 11, 11), "Independencia de Cartagena", "CO");

        // 4. Easter-Based Emiliani (Moved to following Monday)
        AddEmiliani(holidays, easter.AddDays(40), "Ascensión del Señor", "CO");
        AddEmiliani(holidays, easter.AddDays(60), "Corpus Christi", "CO");
        AddEmiliani(holidays, easter.AddDays(68), "Sagrado Corazón de Jesús", "CO");

        return holidays;
    }

    private IEnumerable<PredictiveSpecialDate> GetMexicoHolidays(int year)
    {
        var holidays = new List<PredictiveSpecialDate>();

        // 1. Fixed Holidays
        AddHoliday(holidays, new DateTime(year, 1, 1), "Año Nuevo", "MX");
        AddHoliday(holidays, new DateTime(year, 5, 1), "Día del Trabajo", "MX");
        AddHoliday(holidays, new DateTime(year, 9, 16), "Día de la Independencia", "MX");
        AddHoliday(holidays, new DateTime(year, 12, 25), "Navidad", "MX");

        // 2. Transmisión del Poder Ejecutivo (every 6 years since 2024, changed to Oct 1st)
        if (year % 6 == 0) // Simplified check, actually depends on specific electoral years
        {
            AddHoliday(holidays, new DateTime(year, 10, 1), "Transmisión del Poder Ejecutivo", "MX");
        }

        // 3. Floating (N-th Monday)
        AddFloating(holidays, year, 2, 1, "Día de la Constitución", "MX"); // 1st Mon of Feb
        AddFloating(holidays, year, 3, 3, "Natalicio de Benito Juárez", "MX"); // 3rd Mon of Mar
        AddFloating(holidays, year, 11, 3, "Día de la Revolución", "MX"); // 3rd Mon of Nov

        return holidays;
    }

    private void AddHoliday(List<PredictiveSpecialDate> list, DateTime date, string name, string country)
    {
        list.Add(new PredictiveSpecialDate
        {
            Date = date,
            Name = name,
            Country = country,
            IsSystem = true,
            Type = SpecialDateType.Holiday
        });
    }

    private void AddEmiliani(List<PredictiveSpecialDate> list, DateTime date, string name, string country)
    {
        var holidayDate = date;
        if (date.DayOfWeek != DayOfWeek.Monday)
        {
            int daysToAdd = ((int)DayOfWeek.Monday - (int)date.DayOfWeek + 7) % 7;
            holidayDate = date.AddDays(daysToAdd);
        }
        AddHoliday(list, holidayDate, name, country);
    }

    private void AddFloating(List<PredictiveSpecialDate> list, int year, int month, int occurrence, string name, string country)
    {
        DateTime date = new DateTime(year, month, 1);
        int count = 0;
        while (count < occurrence)
        {
            if (date.DayOfWeek == DayOfWeek.Monday) count++;
            if (count < occurrence) date = date.AddDays(1);
        }
        AddHoliday(list, date, name, country);
    }

    private DateTime GetEaster(int year)
    {
        int a = year % 19;
        int b = year / 100;
        int c = year % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int month = (h + l - 7 * m + 114) / 31;
        int day = ((h + l - 7 * m + 114) % 31) + 1;
        return new DateTime(year, month, day);
    }
}
