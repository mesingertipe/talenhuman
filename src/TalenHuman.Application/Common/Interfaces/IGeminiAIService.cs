using System.Threading.Tasks;

using TalenHuman.Domain.Entities;

namespace TalenHuman.Application.Common.Interfaces;

public interface IGeminiAIService
{
    Task<string> GetResponseAsync(string prompt, string userRole, string userName, Guid? companyId, Guid? storeId, Guid? districtId, List<AIChatMessage> history);
}
