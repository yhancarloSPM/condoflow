using CondoFlow.Application.Common.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;

namespace CondoFlow.Infrastructure.Services;

public class TelegramService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly string _botToken;
    private readonly string _chatId;
    private readonly ILogger<TelegramService> _logger;

    public TelegramService(
        IConfiguration configuration, 
        HttpClient httpClient,
        ILogger<TelegramService> logger)
    {
        _httpClient = httpClient;
        _botToken = configuration["Telegram:BotToken"] ?? "";
        _chatId = configuration["Telegram:ChatId"] ?? "";
        _logger = logger;
        
        _logger.LogInformation("Telegram service initialized - Token: {TokenPrefix}***", 
            _botToken.Length > 8 ? _botToken.Substring(0, 8) : "INVALID");
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
                _logger.LogWarning("Telegram bot token or chat ID not configured");
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
                _logger.LogInformation("Telegram message sent successfully to chat {ChatId}", _chatId);
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to send Telegram message. Status: {StatusCode}, Error: {Error}", 
                    response.StatusCode, error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while sending Telegram message");
        }
    }
}