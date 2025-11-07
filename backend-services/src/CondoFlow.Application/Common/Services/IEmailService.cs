namespace CondoFlow.Application.Common.Services;

public interface IEmailService
{
    Task SendUserApprovedEmailAsync(string toEmail, string firstName, string lastName, string block, string apartment);
    Task SendUserRejectedEmailAsync(string toEmail, string firstName, string lastName);
}