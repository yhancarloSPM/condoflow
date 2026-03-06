using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<object?> GetUserByIdAsync(string userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            return null;

        return new
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            ApartmentId = user.ApartmentId,
            OwnerId = user.OwnerId,
            IsApproved = user.IsApproved,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserWithApartmentDto?> GetUserWithApartmentAsync(string userId)
    {
        var user = await _context.Users
            .Include(u => u.ApartmentEntity)
                .ThenInclude(a => a.Block)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return null;

        return new UserWithApartmentDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            ApartmentId = user.ApartmentId,
            Apartment = user.ApartmentEntity != null 
                ? $"{user.ApartmentEntity.Block.Name}-{user.ApartmentEntity.Number}" 
                : null,
            OwnerId = user.OwnerId,
            IsApproved = user.IsApproved,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<IEnumerable<object>> GetUsersWithApartmentsAsync()
    {
        return await _context.Users
            .Include(u => u.ApartmentEntity)
                .ThenInclude(a => a.Block)
            .Select(u => new
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                ApartmentId = u.ApartmentId,
                Apartment = u.ApartmentEntity != null 
                    ? $"{u.ApartmentEntity.Block.Name}-{u.ApartmentEntity.Number}" 
                    : null,
                OwnerId = u.OwnerId,
                IsApproved = u.IsApproved,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<bool> UpdateUserAsync(string userId, string firstName, string lastName, string phoneNumber)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            return false;

        user.FirstName = firstName;
        user.LastName = lastName;
        user.PhoneNumber = phoneNumber;
        
        await _context.SaveChangesAsync();
        return true;
    }
}
