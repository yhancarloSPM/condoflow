using CondoFlow.Application.Common.Services;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

namespace CondoFlow.Infrastructure.Services;

public class GmailService : IEmailService
{
    private readonly SmtpClient _smtpClient;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public GmailService(IConfiguration configuration)
    {
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

        Console.WriteLine($"[GMAIL] Servicio inicializado - Email: {_fromEmail}");
        Console.WriteLine($"[GMAIL] Host: {host}:{port}, SSL: true");
    }

    public async Task SendUserApprovedEmailAsync(string toEmail, string firstName, string lastName, string block, string apartment)
    {
        try
        {
            Console.WriteLine($"[GMAIL] Iniciando envío de email a: {toEmail}");
            Console.WriteLine($"[GMAIL] Usuario: {firstName} {lastName}, Apt: {block}-{apartment}");
            
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
            Console.WriteLine($"[GMAIL] ✅ Email de aprobación enviado a: {toEmail}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GMAIL] ❌ Error enviando aprobación: {ex.Message}");
            if (ex.InnerException != null)
                Console.WriteLine($"[GMAIL] ❌ Inner Exception: {ex.InnerException.Message}");
            throw;
        }
    }

    public async Task SendUserRejectedEmailAsync(string toEmail, string firstName, string lastName)
    {
        try
        {
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
            Console.WriteLine($"[GMAIL] ✅ Email de rechazo enviado a: {toEmail}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GMAIL] ❌ Error enviando rechazo: {ex.Message}");
            throw;
        }
    }

    private async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        Console.WriteLine($"[GMAIL] Creando mensaje - De: {_fromEmail} -> Para: {toEmail}");
        Console.WriteLine($"[GMAIL] Asunto: {subject}");
        
        var mailMessage = new MailMessage
        {
            From = new MailAddress(_fromEmail, _fromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };
        
        mailMessage.To.Add(toEmail);
        
        Console.WriteLine($"[GMAIL] Enviando email vía SMTP...");
        await _smtpClient.SendMailAsync(mailMessage);
        Console.WriteLine($"[GMAIL] Email enviado exitosamente");
    }

    public void Dispose()
    {
        _smtpClient?.Dispose();
    }
}