using CondoFlow.Application.DTOs;
using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Services;

public interface IPollService
{
    Task<IEnumerable<PollDto>> GetAllPollsAsync(string userId);
    Task<PollDto?> GetPollByIdAsync(int id, string userId);
    Task<PollDto> CreatePollAsync(CreatePollDto createDto, string userId);
    Task<bool> VoteAsync(VoteDto voteDto, string userId);
    Task<bool> DeletePollAsync(int id);
    Task<bool> ClosePollAsync(int id);
}

public class PollService : IPollService
{
    private readonly ApplicationDbContext _context;

    public PollService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PollDto>> GetAllPollsAsync(string userId)
    {
        var polls = await _context.Polls
            .Include(p => p.Options)
                .ThenInclude(o => o.Votes)
            .Include(p => p.Votes)
            .Where(p => p.IsActive && !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var totalUsers = await _context.Users
            .Where(u => _context.UserRoles
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                .Any(ur => ur.UserId == u.Id && ur.Name == "Owner"))
            .CountAsync();

        return polls.Select(p => MapToPollDto(p, userId, totalUsers));
    }

    public async Task<PollDto?> GetPollByIdAsync(int id, string userId)
    {
        var poll = await _context.Polls
            .Include(p => p.Options)
                .ThenInclude(o => o.Votes)
            .Include(p => p.Votes)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive && !p.IsDeleted);

        if (poll == null) return null;

        var totalUsers = await _context.Users
            .Where(u => _context.UserRoles
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                .Any(ur => ur.UserId == u.Id && ur.Name == "Owner"))
            .CountAsync();
        return MapToPollDto(poll, userId, totalUsers);
    }

    public async Task<PollDto> CreatePollAsync(CreatePollDto createDto, string userId)
    {
        var poll = new Poll
        {
            Title = createDto.Title,
            Description = createDto.Description,
            Type = (PollType)createDto.Type,
            StartDate = createDto.StartDate,
            EndDate = createDto.EndDate,
            IsAnonymous = createDto.IsAnonymous,
            ShowResults = createDto.ShowResults,
            QuorumRequired = createDto.QuorumRequired,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Polls.Add(poll);
        await _context.SaveChangesAsync();

        // Agregar opciones
        var options = createDto.Options.Select((text, index) => new PollOption
        {
            PollId = poll.Id,
            Text = text,
            Order = index + 1
        }).ToList();

        _context.PollOptions.AddRange(options);
        await _context.SaveChangesAsync();

        return await GetPollByIdAsync(poll.Id, userId) ?? throw new InvalidOperationException("Failed to create poll");
    }

    public async Task<bool> VoteAsync(VoteDto voteDto, string userId)
    {
        // Verificar que la encuesta existe y está activa
        var poll = await _context.Polls
            .Include(p => p.Options)
            .FirstOrDefaultAsync(p => p.Id == voteDto.PollId && p.IsActive);

        if (poll == null) return false;

        // Verificar que la encuesta no ha terminado
        if (DateTime.UtcNow > poll.EndDate) return false;

        // Verificar que la opción existe
        var option = poll.Options.FirstOrDefault(o => o.Id == voteDto.OptionId);
        if (option == null) return false;

        // Verificar que el usuario existe y es Owner
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;
        
        // Verificar si el usuario ya votó
        var existingVote = await _context.PollVotes
            .FirstOrDefaultAsync(v => v.PollId == voteDto.PollId && v.UserId == userId);

        if (existingVote != null)
        {
            // Actualizar voto existente
            existingVote.PollOptionId = voteDto.OptionId;
            existingVote.VotedAt = DateTime.UtcNow;
        }
        else
        {
            // Crear nuevo voto
            var vote = new PollVote
            {
                PollId = voteDto.PollId,
                PollOptionId = voteDto.OptionId,
                UserId = userId,
                VotedAt = DateTime.UtcNow
            };
            _context.PollVotes.Add(vote);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeletePollAsync(int id)
    {
        var poll = await _context.Polls.FindAsync(id);
        if (poll == null || poll.IsDeleted) return false;

        poll.IsDeleted = true;
        poll.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ClosePollAsync(int id)
    {
        var poll = await _context.Polls.FindAsync(id);
        if (poll == null) return false;

        poll.EndDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    private PollDto MapToPollDto(Poll poll, string userId, int totalUsers)
    {
        var totalVotes = poll.Votes.Count;
        var userVote = poll.Votes.FirstOrDefault(v => v.UserId == userId);
        
        var options = poll.Options.Select(o => new PollOptionDto
        {
            Id = o.Id,
            Text = o.Text,
            VoteCount = o.Votes.Count,
            Percentage = totalVotes > 0 ? Math.Round((decimal)o.Votes.Count / totalVotes * 100, 1) : 0,
            Voters = poll.IsAnonymous ? new List<VoterDto>() : 
                o.Votes.Select(v => new VoterDto
                {
                    OwnerName = GetOwnerName(v.UserId),
                    Apartment = GetOwnerApartment(v.UserId),
                    VotedAt = v.VotedAt
                }).ToList()
        }).ToList();

        var participationRate = totalUsers > 0 ? Math.Round((decimal)totalVotes / totalUsers * 100, 1) : 0;
        var hasQuorum = poll.QuorumRequired.HasValue ? totalVotes >= poll.QuorumRequired.Value : true;

        var status = DateTime.UtcNow > poll.EndDate ? "Closed" : 
                    DateTime.UtcNow < poll.StartDate ? "Pending" : "Active";

        return new PollDto
        {
            Id = poll.Id,
            Title = poll.Title,
            Description = poll.Description,
            Type = poll.Type.ToString(),
            StartDate = poll.StartDate,
            EndDate = poll.EndDate,
            IsActive = poll.IsActive,
            IsAnonymous = poll.IsAnonymous,
            ShowResults = poll.ShowResults,
            QuorumRequired = poll.QuorumRequired,
            CreatedBy = poll.CreatedBy,
            CreatedAt = poll.CreatedAt,
            Options = options,
            Stats = new PollStatsDto
            {
                TotalVotes = totalVotes,
                TotalUsers = totalUsers,
                ParticipationRate = participationRate,
                HasQuorum = hasQuorum,
                Status = status
            },
            HasUserVoted = userVote != null,
            UserVoteOptionId = userVote?.PollOptionId
        };
    }
    
    private string GetOwnerName(string userId)
    {
        try
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            return user != null ? $"{user.FirstName} {user.LastName}" : "Usuario desconocido";
        }
        catch
        {
            return "Usuario desconocido";
        }
    }
    
    private string GetOwnerApartment(string userId)
    {
        try
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            return user != null ? $"{user.Block}-{user.Apartment}" : "N/A";
        }
        catch
        {
            return "N/A";
        }
    }
}