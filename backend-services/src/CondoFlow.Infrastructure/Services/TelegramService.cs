using CondoFlow.Application.Common.Services;
using Microsoft.Extensions.Configuration;
using System.Text;

namespace CondoFlow.Infrastructure.Services;

public class TelegramService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly string _botToken;
    private readonly string _chatId;

    public TelegramService(IConfiguration configuration, HttpClient httpClient)
    {
        _httpClient = httpClient;
        _botToken = configuration["Telegram:BotToken"] ?? "";
        _chatId = configuration["Telegram:ChatId"] ?? "";
        
        Console.WriteLine($"[TELEGRAM] Servicio inicializado - Token: {_botToken.Substring(0, 8)}***");
    }

    public async Task SendUserApprovedEmailAsync(string toEmail, string firstName, string lastName, string block, string apartment)
    {
        var message = $"✅ *Usuario Aprobado*\n\n" +
                     $"👤 *Nombre:* {firstName} {lastName}\n" +
                     $"📧 *Email:* {toEmail}\n" +
                     $"🏠 *Apartamento:* {block}-{apartment}\n" +
                     $"⏰ *Fecha:* {DateTime.Now:dd/MM/yyyy HH:mm}";

        await SendMessageAsync(message);
    }

    public async Task SendUserRejectedEmailAsync(string toEmail, string firstName, string lastName)
    {
        var message = $"❌ *Usuario Rechazado*\n\n" +
                     $"👤 *Nombre:* {firstName} {lastName}\n" +
                     $"📧 *Email:* {toEmail}\n" +
                     $"⏰ *Fecha:* {DateTime.Now:dd/MM/yyyy HH:mm}";

        await SendMessageAsync(message);
    }

    private async Task SendMessageAsync(string message)
    {
        try
        {
            if (string.IsNullOrEmpty(_botToken) || string.IsNullOrEmpty(_chatId))
            {
                Console.WriteLine("[TELEGRAM] Token o ChatId no configurado");
                return;
            }

            var url = $"https://api.telegram.org/bot{_botToken}/sendMessage";
            var payload = new
            {
                chat_id = _chatId,
                text = message,
                parse_mode = "Markdown"
            };

            var json = System.Text.Json.JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[TELEGRAM] ✅ Mensaje enviado exitosamente");
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[TELEGRAM] ❌ Error: {error}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TELEGRAM] ❌ Excepción: {ex.Message}");
        }
    }
}