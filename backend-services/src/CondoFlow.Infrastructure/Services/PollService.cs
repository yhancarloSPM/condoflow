using CondoFlow.Application.DTOs;
using CondoFlow.Application.Common.Services;
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
    Task<bool> VoteMultipleAsync(MultipleVoteDto voteDto, string userId);
    Task<bool> VoteCustomAsync(CustomVoteDto voteDto, string userId);
    Task<bool> VoteCustomMultipleAsync(CustomMultipleVoteDto voteDto, string userId);
    Task<bool> DeletePollAsync(int id);
    Task<bool> ClosePollAsync(int id);
}

public class PollService : IPollService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public PollService(ApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
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
            AllowOther = createDto.AllowOther,
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

        // Enviar notificación a todos los propietarios
        await _notificationService.NotifyNewPollAsync(poll.Id, poll.Title);

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
        var existingVotes = await _context.PollVotes
            .Where(v => v.PollId == voteDto.PollId && v.UserId == userId)
            .ToListAsync();

        if (existingVotes.Any())
        {
            // Eliminar votos existentes
            _context.PollVotes.RemoveRange(existingVotes);
        }

        // Crear nuevo voto
        var vote = new PollVote
        {
            PollId = voteDto.PollId,
            PollOptionId = voteDto.OptionId,
            UserId = userId,
            VotedAt = DateTime.UtcNow
        };
        _context.PollVotes.Add(vote);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> VoteMultipleAsync(MultipleVoteDto voteDto, string userId)
    {
        // Verificar que la encuesta existe y está activa
        var poll = await _context.Polls
            .Include(p => p.Options)
            .FirstOrDefaultAsync(p => p.Id == voteDto.PollId && p.IsActive);

        if (poll == null) return false;

        // Verificar que la encuesta es de tipo múltiple
        if (poll.Type != PollType.Multiple) return false;

        // Verificar que la encuesta no ha terminado
        if (DateTime.UtcNow > poll.EndDate) return false;

        // Verificar que todas las opciones existen
        var validOptionIds = poll.Options.Select(o => o.Id).ToList();
        if (!voteDto.OptionIds.All(id => validOptionIds.Contains(id))) return false;

        // Verificar que el usuario existe
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;
        
        // Eliminar votos existentes del usuario en esta encuesta
        var existingVotes = await _context.PollVotes
            .Where(v => v.PollId == voteDto.PollId && v.UserId == userId)
            .ToListAsync();

        if (existingVotes.Any())
        {
            _context.PollVotes.RemoveRange(existingVotes);
        }

        // Crear nuevos votos para cada opción seleccionada
        var newVotes = voteDto.OptionIds.Select(optionId => new PollVote
        {
            PollId = voteDto.PollId,
            PollOptionId = optionId,
            UserId = userId,
            VotedAt = DateTime.UtcNow
        }).ToList();

        _context.PollVotes.AddRange(newVotes);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> VoteCustomAsync(CustomVoteDto voteDto, string userId)
    {
        // Verificar que la encuesta existe y está activa
        var poll = await _context.Polls
            .Include(p => p.Options)
            .FirstOrDefaultAsync(p => p.Id == voteDto.PollId && p.IsActive);

        if (poll == null) return false;

        // Verificar que la encuesta permite opción personalizada
        if (!poll.AllowOther) return false;

        // Verificar que la encuesta no ha terminado
        if (DateTime.UtcNow > poll.EndDate) return false;

        // Verificar que el usuario existe
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;

        // Eliminar votos existentes del usuario en esta encuesta
        var existingVotes = await _context.PollVotes
            .Where(v => v.PollId == voteDto.PollId && v.UserId == userId)
            .ToListAsync();

        if (existingVotes.Any())
        {
            _context.PollVotes.RemoveRange(existingVotes);
        }

        // Crear o encontrar la opción "Otro" con el texto personalizado
        var customOption = poll.Options.FirstOrDefault(o => o.Text == voteDto.CustomText);
        if (customOption == null)
        {
            // Crear nueva opción personalizada
            customOption = new PollOption
            {
                PollId = poll.Id,
                Text = voteDto.CustomText,
                Order = poll.Options.Count + 1
            };
            _context.PollOptions.Add(customOption);
            await _context.SaveChangesAsync();
        }

        // Crear voto para la opción personalizada
        var vote = new PollVote
        {
            PollId = voteDto.PollId,
            PollOptionId = customOption.Id,
            UserId = userId,
            VotedAt = DateTime.UtcNow
        };
        _context.PollVotes.Add(vote);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> VoteCustomMultipleAsync(CustomMultipleVoteDto voteDto, string userId)
    {
        // Verificar que la encuesta existe y está activa
        var poll = await _context.Polls
            .Include(p => p.Options)
            .FirstOrDefaultAsync(p => p.Id == voteDto.PollId && p.IsActive);

        if (poll == null) return false;

        // Verificar que la encuesta es de tipo múltiple
        if (poll.Type != PollType.Multiple) return false;

        // Verificar que la encuesta permite opción personalizada
        if (!poll.AllowOther) return false;

        // Verificar que la encuesta no ha terminado
        if (DateTime.UtcNow > poll.EndDate) return false;

        // Verificar que todas las opciones existen
        var validOptionIds = poll.Options.Select(o => o.Id).ToList();
        if (voteDto.OptionIds.Any() && !voteDto.OptionIds.All(id => validOptionIds.Contains(id))) return false;

        // Verificar que el usuario existe
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;

        // Eliminar votos existentes del usuario en esta encuesta
        var existingVotes = await _context.PollVotes
            .Where(v => v.PollId == voteDto.PollId && v.UserId == userId)
            .ToListAsync();

        if (existingVotes.Any())
        {
            _context.PollVotes.RemoveRange(existingVotes);
        }

        // Crear votos para opciones seleccionadas
        var newVotes = new List<PollVote>();
        
        foreach (var optionId in voteDto.OptionIds)
        {
            newVotes.Add(new PollVote
            {
                PollId = voteDto.PollId,
                PollOptionId = optionId,
                UserId = userId,
                VotedAt = DateTime.UtcNow
            });
        }

        // Crear o encontrar la opción personalizada
        if (!string.IsNullOrWhiteSpace(voteDto.CustomText))
        {
            var customOption = poll.Options.FirstOrDefault(o => o.Text == voteDto.CustomText);
            if (customOption == null)
            {
                customOption = new PollOption
                {
                    PollId = poll.Id,
                    Text = voteDto.CustomText,
                    Order = poll.Options.Count + 1
                };
                _context.PollOptions.Add(customOption);
                await _context.SaveChangesAsync();
            }

            newVotes.Add(new PollVote
            {
                PollId = voteDto.PollId,
                PollOptionId = customOption.Id,
                UserId = userId,
                VotedAt = DateTime.UtcNow
            });
        }

        _context.PollVotes.AddRange(newVotes);
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
        var userVotes = poll.Votes.Where(v => v.UserId == userId).ToList();
        var totalVotes = poll.Votes.GroupBy(v => v.UserId).Count(); // Contar usuarios únicos que votaron
        
        var options = poll.Options.Select(o => new PollOptionDto
        {
            Id = o.Id,
            Text = o.Text,
            VoteCount = o.Votes.Count,
            Percentage = totalVotes > 0 ? Math.Round((decimal)o.Votes.Count / poll.Votes.Count * 100, 1) : 0,
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
            AllowOther = poll.AllowOther,
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
            HasUserVoted = userVotes.Any(),
            UserVoteOptionId = userVotes.FirstOrDefault()?.PollOptionId,
            UserVoteOptionIds = userVotes.Select(v => v.PollOptionId).ToList()
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
            var user = _context.Users
                .Include(u => u.ApartmentEntity)
                    .ThenInclude(a => a.Block)
                .FirstOrDefault(u => u.Id == userId);
                
            if (user?.ApartmentEntity != null)
            {
                return $"{user.ApartmentEntity.Block.Name}-{user.ApartmentEntity.Number}";
            }
            return "N/A";
        }
        catch
        {
            return "N/A";
        }
    }
}