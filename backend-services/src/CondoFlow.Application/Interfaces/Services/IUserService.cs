using CondoFlow.Application.Common.DTOs.User;
using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Services;

public interface IUserService
{
    Task<UserDto?> GetUserProfileAsync(string userId);
    Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    Task<bool> UpdateProfileAsync(string userId, UpdateProfileRequest request);
    Task<bool> ChangeUserStatusAsync(string userId, string status, string adminUserId);
}
