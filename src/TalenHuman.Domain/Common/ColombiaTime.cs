using System;

namespace TalenHuman.Domain.Common;

public static class ColombiaTime
{
    private static readonly TimeZoneInfo ColombiaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time");

    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ColombiaTimeZone);
    
    public static DateTime ToColombia(this DateTime dateTime)
    {
        if (dateTime.Kind == DateTimeKind.Utc)
        {
            return TimeZoneInfo.ConvertTimeFromUtc(dateTime, ColombiaTimeZone);
        }
        
        // If unspecified, we assume it's already in Colombia time or needs conversion from local
        return TimeZoneInfo.ConvertTime(dateTime, ColombiaTimeZone);
    }
}
