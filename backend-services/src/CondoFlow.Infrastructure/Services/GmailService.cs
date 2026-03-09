using CondoFlow.Application.Common.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;

namespace CondoFlow.Infrastructure.Services;

public class GmailService : IEmailService
{
    private readonly SmtpClient _smtpClient;
    private readonly string _fromEmail;
    private readonly string _fromName;
    private readonly ILogger<GmailService> _logger;

    public GmailService(IConfiguration configuration, ILogger<GmailService> logger)
    {
        _logger = logger;
        
        var host = configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
        var port = int.Parse(configuration["Email:SmtpPort"] ?? "587");
        var username = configuration["Email:Username"] ?? throw new ArgumentNullException("Email:Username");
        var password = configuration["Email:Password"] ?? throw new ArgumentNullException("Email:Password");
        
        _fromEmail = configuration["Email:FromEmail"] ?? username;
        _fromName = configuration["Email:FromName"] ?? "CondoFlow";

        _smtpClient = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(username, password),
            EnableSsl = true
        };

        _logger.LogInformation("Gmail service initialized - From: {FromEmail}, Host: {Host}:{Port}, SSL: true", 
            _fromEmail, host, port);
    }

    public async Task SendUserApprovedEmailAsync(string toEmail, string firstName, string lastName, string block, string apartment)
    {
        try
        {
            _logger.LogInformation("Sending approval email to {Email} for user {FirstName} {LastName}, Apartment: {Block}-{Apartment}", 
                toEmail, firstName, lastName, block, apartment);
            
            var subject = "¡Tu cuenta en CondoFlow ha sido aprobada!";
            var body = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
    <div style='background: #2563EB; padding: 30px; text-align: center;'>
        <h1 style='color: white; margin: 0;'>¡Bienvenido a CondoFlow!</h1>
    </div>
    <div style='padding: 30px; background: #f8fafc;'>
        <h2 style='color: #1f2937;'>¡Hola {firstName}!</h2>
        <p style='color: #374151; font-size: 16px;'>
            Tu cuenta ha sido <strong style='color: #10b981;'>aprobada exitosamente</strong>.
        </p>
        <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0;'>
            <h3 style='color: #1f2937;'>Para iniciar sesión:</h3>
            <p><strong>Usuario:</strong> {toEmail}</p>
            <p><strong>Apartamento:</strong> {block}-{apartment}</p>
        </div>
        <p style='color: #6b7280;'>¡Bienvenido a CondoFlow!</p>
    </div>
</div>";

            await SendEmailAsync(toEmail, subject, body);
            _logger.LogInformation("Approval email sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send approval email to {Email}", toEmail);
            throw;
        }
    }

    public async Task SendUserRejectedEmailAsync(string toEmail, string firstName, string lastName)
    {
        try
        {
            _logger.LogInformation("Sending rejection email to {Email} for user {FirstName} {LastName}", 
                toEmail, firstName, lastName);
            
            var subject = "Actualización sobre tu solicitud en CondoFlow";
            var body = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
    <div style='background: #ef4444; padding: 30px; text-align: center;'>
        <h1 style='color: white; margin: 0;'>CondoFlow</h1>
    </div>
    <div style='padding: 30px; background: #f8fafc;'>
        <h2 style='color: #1f2937;'>Hola {firstName},</h2>
        <p style='color: #374151; font-size: 16px;'>
            Lamentamos informarte que tu solicitud no ha sido aprobada en este momento.
        </p>
        <p style='color: #6b7280;'>
            Si crees que esto es un error, contacta al administrador del condominio.
        </p>
    </div>
</div>";

            await SendEmailAsync(toEmail, subject, body);
            _logger.LogInformation("Rejection email sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send rejection email to {Email}", toEmail);
            throw;
        }
    }

    private async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        _logger.LogDebug("Creating email message - From: {FromEmail} To: {ToEmail}, Subject: {Subject}", 
            _fromEmail, toEmail, subject);
        
        var mailMessage = new MailMessage
        {
            From = new MailAddress(_fromEmail, _fromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };
        
        mailMessage.To.Add(toEmail);
        
        _logger.LogDebug("Sending email via SMTP...");
        await _smtpClient.SendMailAsync(mailMessage);
        _logger.LogDebug("Email sent successfully via SMTP");
    }

    public void Dispose()
    {
        _smtpClient?.Dispose();
    }
}