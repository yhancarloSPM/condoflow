using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public class ReservationRepository : IReservationRepository
{
    private readonly ApplicationDbContext _context;

    public ReservationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Reservation>> GetAllAsync()
    {
        return await _context.Reservations
            .OrderByDescending(r => r.ReservationDate)
            .ThenBy(r => r.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Reservation>> GetByUserIdAsync(string userId)
    {
        return await _context.Reservations
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.ReservationDate)
            .ThenBy(r => r.StartTime)
            .ToListAsync();
    }

    public async Task<Reservation?> GetByIdAsync(Guid id)
    {
        return await _context.Reservations
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<bool> IsSlotAvailableAsync(DateTime date, TimeSpan startTime, TimeSpan endTime, Guid? excludeId = null)
    {
        var query = _context.Reservations
            .Where(r => r.ReservationDate.Date == date.Date &&
                       r.Status != ReservationStatus.Cancelled &&
                       r.Status != ReservationStatus.Rejected &&
                       ((startTime >= r.StartTime && startTime < r.EndTime) ||
                        (endTime > r.StartTime && endTime <= r.EndTime) ||
                        (startTime <= r.StartTime && endTime >= r.EndTime)));

        if (excludeId.HasValue)
            query = query.Where(r => r.Id != excludeId.Value);

        return !await query.AnyAsync();
    }

    public async Task<Reservation> CreateAsync(Reservation reservation)
    {
        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync();
        return reservation;
    }

    public async Task<Reservation> UpdateAsync(Reservation reservation)
    {
        _context.Reservations.Update(reservation);
        await _context.SaveChangesAsync();
        return reservation;
    }

    public async Task DeleteAsync(Guid id)
    {
        var reservation = await _context.Reservations.FindAsync(id);
        if (reservation != null)
        {
            _context.Reservations.Remove(reservation);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<ReservationSlot>> GetAvailableSlotsAsync()
    {
        return await _context.ReservationSlots
            .Where(s => s.IsAvailable)
            .OrderBy(s => s.StartTime)
            .ToListAsync();
    }
}