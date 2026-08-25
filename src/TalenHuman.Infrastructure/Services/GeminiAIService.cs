using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Infrastructure.Persistence;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Infrastructure.Services;

public class GeminiAIService : IGeminiAIService
{
    private readonly HttpClient _httpClient;
    private readonly ApplicationDbContext _context;
    private readonly ISystemSettingsService _settingsService;

    public GeminiAIService(HttpClient httpClient, ApplicationDbContext context, ISystemSettingsService settingsService)
    {
        _httpClient = httpClient;
        _context = context;
        _settingsService = settingsService;
    }

    public async Task<string> GetResponseAsync(string prompt, string userRole, string userName, Guid? companyId, Guid? storeId, Guid? districtId, List<AIChatMessage> history)
    {
        string apiKey = await _settingsService.GetSettingAsync("GeminiApiKey");
        string model = await _settingsService.GetSettingAsync("GeminiModel") ?? "gemini-3.6-flash";

        if (string.IsNullOrEmpty(apiKey))
            return "La configuración de IA (GeminiApiKey) no está activa en SystemSettings.";

        string dbSchema = @"Vistas Operativas: ""vw_TalenHumanAI_Operativo"". Columnas: ""EmpleadoId"", ""NombreEmpleado"", ""Cedula"", ""DateOfEntry"" (FECHA DE CONTRATACIÓN, NO es entrada al turno), ""EmpleadoActivo"", ""TiendaNombre"", ""StoreId"", ""DistrictId"", ""MarcaNombre"", ""CompanyId"", ""CompanyNombre"", ""EstadoAsistencia"" (Si es -1 NO ha entrado hoy. Si es >= 0 SÍ entró hoy), ""ClockIn"" (Hora de entrada real de hoy), ""ClockOut"" (Hora de salida real de hoy), ""ObservacionAsistencia"" (Razón de la tardanza, ej. trafico), ""EstadoNovedad"", ""NovedadInicio"", ""NovedadFin"". 
Vista Histórica de Asistencias Pasadas: ""vw_TalenHumanAI_HistoricoAsistencia"". Columnas: ""AsistenciaId"", ""EmpleadoId"", ""NombreEmpleado"", ""Cedula"", ""TiendaNombre"", ""StoreId"", ""DistrictId"", ""MarcaNombre"", ""CompanyId"", ""CompanyNombre"", ""EstadoAsistencia"", ""ClockIn"" (Fecha/Hora exacta), ""ClockOut"", ""ObservacionAsistencia"". ÚSALA SÓLO CUANDO PREGUNTEN POR ASISTENCIAS DEL PASADO (AYER, LA SEMANA PASADA, HISTÓRICO, QUIEN ASISTE MÁS, ETC).
IMPORTANTE: Envuelve los nombres de vistas y columnas en comillas dobles.";
        
        string scopeRule = "";
        bool isSuperAdmin = userRole.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase);
        bool isAdmin = userRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) || userRole.Equals("Recursos Humanos", StringComparison.OrdinalIgnoreCase);
        bool isSupervisor = userRole.Equals("Supervisor", StringComparison.OrdinalIgnoreCase);
        bool isGerente = userRole.Equals("Gerente", StringComparison.OrdinalIgnoreCase);

        if (isSuperAdmin) {
            scopeRule = "Eres un SuperAdministrador Global. Puedes consultar datos de cualquier Company, Store o District. No tienes restricciones de filtro.";
        } else if (isAdmin && companyId.HasValue) {
            scopeRule = $"Eres Administrador/RRHH. Solo puedes consultar datos de tu CompanyId. Tus consultas se filtrarán automáticamente para CompanyId = '{companyId}'. NUNCA incluyas la cláusula WHERE CompanyId tú mismo.";
        } else if (isSupervisor && districtId.HasValue) {
            scopeRule = $"Eres Supervisor. Solo puedes consultar datos de tu Distrito. Tus consultas se filtrarán automáticamente para DistrictId = '{districtId}'. NUNCA incluyas la cláusula WHERE DistrictId tú mismo.";
        } else if (isGerente && storeId.HasValue) {
            scopeRule = $"Eres Gerente. Solo puedes consultar datos de tu Tienda. Tus consultas se filtrarán automáticamente para StoreId = '{storeId}'. NUNCA incluyas la cláusula WHERE StoreId tú mismo.";
        } else {
            return "Rol no soportado o contexto de datos insuficiente para el asistente IA.";
        }

        string supportKnowledge = "";
        string knowledgeFilePath = Path.Combine(AppContext.BaseDirectory, "SupportKnowledgeBase.md");
        if (System.IO.File.Exists(knowledgeFilePath))
        {
            supportKnowledge = "\nBASE DE CONOCIMIENTO DE SOPORTE:\n" + await System.IO.File.ReadAllTextAsync(knowledgeFilePath);
        }
        else
        {
            // Fallback for development/source path
            string srcPath = Path.Combine(Directory.GetCurrentDirectory(), "SupportKnowledgeBase.md");
            if (System.IO.File.Exists(srcPath))
            {
                supportKnowledge = "\nBASE DE CONOCIMIENTO DE SOPORTE:\n" + await System.IO.File.ReadAllTextAsync(srcPath);
            }
        }

        string systemInstruction = $@"Eres TalentIA, un asistente experto en RRHH para TalenHuman. 
Rol del usuario: {userRole}. Nombre del usuario: {userName}.
{scopeRule}
Esquema disponible: {dbSchema}
Si te hacen una pregunta que requiere datos, usa la herramienta ConsultarBaseDatosSQL enviando una consulta SQL válida (PostgreSQL). Haz un SELECT simple (ej. SELECT * FROM ""vw_TalenHumanAI_Operativo"").
REGLA DE CONVERSACIÓN: El historial de chat es solo para contexto. NO repitas respuestas a preguntas anteriores. Responde ÚNICAMENTE al último mensaje del usuario.
REGLA DE RESPUESTA: Dirígete al usuario por su nombre. NUNCA menciones IDs internos, ni lenguaje técnico como ""base de datos"", ""SQL"", ""tablas"" o ""vistas"". Responde de forma natural.
REGLA DE CONTEXTO: Tu único propósito es ayudar con temas de TalenHuman, Recursos Humanos, empleados, turnos, novedades y operaciones. Si el usuario hace preguntas fuera de este contexto (ej. temas generales, películas, otras áreas), debes responder amablemente diciendo que eres TalentIA y tu conocimiento está enfocado exclusivamente en la gestión de RRHH de TalenHuman.
Si el usuario hace una pregunta de soporte técnico o cómo usar la plataforma, responde usando la información de la Base de Conocimiento a continuación.
{supportKnowledge}";

        var toolsDecl = new[]
        {
            new {
                function_declarations = new[] {
                    new {
                        name = "ConsultarBaseDatosSQL",
                        description = "Ejecuta una consulta SQL SELECT en la base de datos",
                        parameters = new {
                            type = "object",
                            properties = new {
                                query = new { type = "string", description = "Consulta SQL SELECT" }
                            },
                            required = new[] { "query" }
                        }
                    }
                }
            }
        };

        var currentContents = new List<object>();
        
        string chatHistoryContext = "";
        if (history != null && history.Any())
        {
            chatHistoryContext = "HISTORIAL DE CONVERSACIÓN PREVIA (Solo para tu contexto, NO respondas a esto nuevamente):\n";
            foreach (var msg in history.OrderBy(h => h.CreatedAt))
            {
                string roleName = msg.Role == "user" ? "Usuario" : "TalentIA";
                chatHistoryContext += $"[{roleName}]: {msg.Content}\n";
            }
            chatHistoryContext += "--- FIN DEL HISTORIAL ---\n\n";
        }

        string finalUserPrompt = $"{chatHistoryContext}PREGUNTA ACTUAL DEL USUARIO (Responde SOLO a esto):\n{prompt}";

        currentContents.Add(new { role = "user", parts = new[] { new { text = finalUserPrompt } } });

        int maxIterations = 5;
        for (int i = 0; i < maxIterations; i++)
        {
            var requestBody = new {
                system_instruction = new { parts = new[] { new { text = systemInstruction } } },
                contents = currentContents,
                tools = toolsDecl
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}", jsonContent);

            if (!response.IsSuccessStatusCode) 
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                return $"Error de la IA: {response.StatusCode} - {errorBody}";
            }

            var result = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync());
            var modelContent = result.GetProperty("candidates")[0].GetProperty("content");
            var parts = modelContent.GetProperty("parts");

            JsonElement functionCall = default;
            bool hasFunctionCall = false;
            string textResponse = null;

            foreach (var part in parts.EnumerateArray())
            {
                if (part.TryGetProperty("functionCall", out functionCall)) hasFunctionCall = true;
                if (part.TryGetProperty("text", out var textProp)) textResponse = textProp.GetString();
            }

            if (!hasFunctionCall) return textResponse ?? "Respuesta sin texto.";

            currentContents.Add(modelContent); 
            string sqlQuery = functionCall.GetProperty("args").GetProperty("query").GetString();

            if (!sqlQuery.Trim().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
                return "Consulta bloqueada. Solo se permiten operaciones de lectura (SELECT).";

            // WRAP QUERY FOR SECURITY
            if (!isSuperAdmin)
            {
                string securityFilter = "";
                if (isGerente && storeId.HasValue) securityFilter = $"\"StoreId\" = '{storeId}'";
                else if (isSupervisor && districtId.HasValue) securityFilter = $"\"DistrictId\" = '{districtId}'";
                else if (isAdmin && companyId.HasValue) securityFilter = $"\"CompanyId\" = '{companyId}'";

                if (!string.IsNullOrEmpty(securityFilter))
                {
                    string[] viewsToSecure = { "\"vw_TalenHumanAI_Operativo\"", "\"vw_TalenHumanAI_HistoricoAsistencia\"" };
                    foreach (var viewName in viewsToSecure)
                    {
                        string secureView = $"(SELECT * FROM {viewName} WHERE {securityFilter}) AS {viewName}";
                        
                        if (sqlQuery.Contains(viewName))
                        {
                            sqlQuery = sqlQuery.Replace(viewName, secureView);
                        }
                        else if (sqlQuery.Contains(viewName.Replace("\"", "")))
                        {
                            sqlQuery = sqlQuery.Replace(viewName.Replace("\"", ""), secureView);
                        }
                    }
                }
            }

            string jsonResultData = await ExecuteSqlSafeAsync(sqlQuery);

            currentContents.Add(new { 
                role = "user", 
                parts = new object[] { 
                    new { functionResponse = new { name = "ConsultarBaseDatosSQL", response = new { result = jsonResultData } } } 
                } 
            });
        }

        return "Lo siento, tuve un poco de dificultad procesando esa consulta. ¿Podrías intentar reformular tu pregunta?";
    }

    private async Task<string> ExecuteSqlSafeAsync(string sql)
    {
        try
        {
            var resultList = new List<Dictionary<string, object>>();
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = sql;
                if (command.Connection.State != ConnectionState.Open) await command.Connection.OpenAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        var row = new Dictionary<string, object>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            row[reader.GetName(i)] = reader.GetValue(i);
                        }
                        resultList.Add(row);
                    }
                }
            }
            return JsonSerializer.Serialize(resultList.Take(50));
        }
        catch (Exception ex)
        {
            return $"Error ejecutando consulta: {ex.Message}";
        }
    }
}
