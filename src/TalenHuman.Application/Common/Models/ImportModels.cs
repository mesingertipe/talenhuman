using Microsoft.AspNetCore.Http;

namespace TalenHuman.Application.Common.Models;

public class ImportPreviewDto
{
    public string Type { get; set; } = null!;
    public List<string> Headers { get; set; } = new();
    public List<ImportRowDto> Rows { get; set; } = new();
    public bool HasErrors => Rows.Any(r => r.HasErrors);
}

public class ImportRowDto
{
    public int RowNumber { get; set; }
    public Dictionary<string, string> Data { get; set; } = new();
    public List<ImportFieldError> Errors { get; set; } = new();
    public bool HasErrors => Errors.Any();
}

public class ImportFieldError
{
    public string Field { get; set; } = null!;
    public string Message { get; set; } = null!;
}

public class ImportResultDto
{
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public List<string> Messages { get; set; } = new();
}
