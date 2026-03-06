using AutoMapper;
using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Interfaces.Services;

namespace CondoFlow.Application.Services;

public class AuthService : IAuthService
{
    private readonly IApartmentRepository _apartmentRepository;
    private readonly IIdentityService _identityService;
    private readonly IMapper _mapper;

    public AuthService(IApartmentRepository apartmentRepository, IIdentityService identityService, IMapper mapper)
    {
        _apartmentRepository = apartmentRepository;
        _identityService = identityService;
        _mapper = mapper;
    }

    public async Task<ApartmentDto?> GetApartmentInfoAsync(int apartmentId)
    {
        var apartment = await _apartmentRepository.GetApartmentWithBlockAsync(apartmentId);
        if (apartment == null) return null;
        
        return _mapper.Map<ApartmentDto>(apartment);
    }

    public async Task<bool> IsApartmentAvailableAsync(int apartmentId)
    {
        var apartment = await _apartmentRepository.GetByIdAsync(apartmentId);
        if (apartment == null)
            return false;

        // Verificar si ya hay un usuario aprobado con este apartamento
        var allUsers = await _identityService.GetAllUsersAsync();
        var usersArray = allUsers as object[] ?? allUsers.ToArray();
        
        foreach (dynamic user in usersArray)
        {
            if (user.ApartmentId == apartmentId && user.IsApproved)
                return false;
        }
        
        return true;
    }

    public async Task<List<UserDto>> GetPendingUsersAsync()
    {
        var users = await _identityService.GetPendingUsersAsync();
        var usersArray = users as object[] ?? users.ToArray();
        
        return usersArray.Select(u => _mapper.Map<UserDto>(u)).ToList();
    }

    public async Task<List<UserDto>> GetAllUsersAsync()
    {
        var users = await _identityService.GetAllUsersAsync();
        var usersArray = users as object[] ?? users.ToArray();
        
        return usersArray.Select(u => _mapper.Map<UserDto>(u)).ToList();
    }
}
