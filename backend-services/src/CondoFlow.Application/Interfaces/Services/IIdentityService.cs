namespace CondoFlow.Application.Interfaces.Services;

public interface IIdentityService
{
    Task<object?> FindUserByIdAsync(string userId);
    Task<object?> FindUserByEmailAsync(string email);
    Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    Task<bool> UpdateUserAsync(string userId, string firstName, string lastName, string phoneNumber);
    Task<bool> ChangeUserStatusAsync(string userId, bool isApproved, bool isRejected, string adminUserId);
    Task<IEnumerable<object>> GetAllUsersAsync();
    Task<IEnumerable<object>> GetPendingUsersAsync();
}
