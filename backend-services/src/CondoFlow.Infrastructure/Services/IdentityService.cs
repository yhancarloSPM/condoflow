using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Services;

public class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public IdentityService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<object?> FindUserByIdAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return null;

        return new
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            ApartmentId = user.ApartmentId,
            OwnerId = user.OwnerId,
            IsApproved = user.IsApproved,
            IsRejected = user.IsRejected,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<object?> FindUserByEmailAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
            return null;

        return new
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            ApartmentId = user.ApartmentId,
            OwnerId = user.OwnerId,
            IsApproved = user.IsApproved,
            IsRejected = user.IsRejected,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return false;

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        return result.Succeeded;
    }

    public async Task<bool> UpdateUserAsync(string userId, string firstName, string lastName, string phoneNumber)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return false;

        user.FirstName = firstName;
        user.LastName = lastName;
        user.PhoneNumber = phoneNumber;

        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    public async Task<bool> ChangeUserStatusAsync(string userId, bool isApproved, bool isRejected, string adminUserId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return false;

        user.IsApproved = isApproved;
        user.IsRejected = isRejected;
        
        if (isApproved)
        {
            user.ApprovedAt = DateTime.UtcNow;
            user.ApprovedBy = adminUserId;
        }
        else if (isRejected)
        {
            user.RejectedAt = DateTime.UtcNow;
            user.RejectedBy = adminUserId;
        }

        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    public async Task<IEnumerable<object>> GetAllUsersAsync()
    {
        var users = await _userManager.Users.ToListAsync();
        
        return users.Select(u => new
        {
            Id = u.Id,
            Email = u.Email,
            FirstName = u.FirstName,
            LastName = u.LastName,
            PhoneNumber = u.PhoneNumber,
            ApartmentId = u.ApartmentId,
            CreatedAt = u.CreatedAt,
            IsApproved = u.IsApproved,
            ApprovedAt = u.ApprovedAt,
            ApprovedBy = u.ApprovedBy,
            IsRejected = u.IsRejected,
            RejectedAt = u.RejectedAt,
            RejectedBy = u.RejectedBy
        }).OrderByDescending(u => u.CreatedAt).ToList();
    }

    public async Task<IEnumerable<object>> GetPendingUsersAsync()
    {
        var users = await _userManager.Users
            .Where(u => !u.IsApproved)
            .ToListAsync();
        
        return users.Select(u => new
        {
            Id = u.Id,
            Email = u.Email,
            FirstName = u.FirstName,
            LastName = u.LastName,
            PhoneNumber = u.PhoneNumber,
            ApartmentId = u.ApartmentId,
            CreatedAt = u.CreatedAt,
            IsRejected = u.IsRejected,
            RejectedAt = u.RejectedAt,
            RejectedBy = u.RejectedBy
        }).ToList();
    }
}
