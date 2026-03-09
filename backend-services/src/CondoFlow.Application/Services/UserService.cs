using AutoMapper;
using CondoFlow.Application.Common.DTOs.User;
using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Enums;

namespace CondoFlow.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IIdentityService _identityService;
    private readonly IMapper _mapper;

    public UserService(IUserRepository userRepository, IIdentityService identityService, IMapper mapper)
    {
        _userRepository = userRepository;
        _identityService = identityService;
        _mapper = mapper;
    }

    public async Task<UserDto?> GetUserProfileAsync(string userId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null) return null;
        
        return _mapper.Map<UserDto>(user);
    }

    public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordRequest request)
    {
        return await _identityService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
    }

    public async Task<bool> UpdateProfileAsync(string userId, UpdateProfileRequest request)
    {
        var phoneNumber = CleanPhoneNumber(request.PhoneNumber);
        
        // Actualizar en Identity
        var identityResult = await _identityService.UpdateUserAsync(userId, request.FirstName, request.LastName, phoneNumber);
        if (!identityResult)
            return false;

        // Actualizar en tabla Users
        await _userRepository.UpdateUserAsync(userId, request.FirstName, request.LastName, phoneNumber);
        
        return true;
    }

    public async Task<bool> ChangeUserStatusAsync(string userId, ChangeUserStatusRequest request, string adminUserId)
    {
        bool isApproved = request.Status == UserStatusCodes.Approved;
        bool isRejected = request.Status == UserStatusCodes.Rejected;
        
        if (!isApproved && !isRejected)
            return false;

        return await _identityService.ChangeUserStatusAsync(userId, isApproved, isRejected, adminUserId);
    }

    private string CleanPhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber)) return phoneNumber;
        
        var cleaned = phoneNumber.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
        
        if (cleaned.StartsWith("1") && cleaned.Length == 11)
        {
            return cleaned.Substring(1);
        }
        
        return cleaned;
    }
}
