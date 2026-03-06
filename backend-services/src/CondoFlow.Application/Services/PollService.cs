using AutoMapper;
using CondoFlow.Application.Common.Services;
using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Entities;
using CondoFlow.Domain.Enums;

namespace CondoFlow.Application.Services;

public class PollService : IPollService
{
    private readonly IPollRepository _pollRepository;
    private readonly IPollOptionRepository _pollOptionRepository;
    private readonly IPollVoteRepository _pollVoteRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;
    private readonly IMapper _mapper;

    public PollService(
        IPollRepository pollRepository,
        IPollOptionRepository pollOptionRepository,
        IPollVoteRepository pollVoteRepository,
        IUserRepository userRepository,
        INotificationService notificationService,
        IMapper mapper)
    {
        _pollRepository = pollRepository;
        _pollOptionRepository = pollOptionRepository;
        _pollVoteRepository = pollVoteRepository;
        _userRepository = userRepository;
        _notificationService = notificationService;
        _mapper = mapper;
    }

    public async Task<IEnumerable<PollDto>> GetAllPollsAsync(string userId)
    {
        var polls = await _pollRepository.GetActiveAsync();
        var totalUsers = await _pollRepository.GetOwnerCountAsync();

        var result = new List<PollDto>();
        foreach (var poll in polls)
        {
            result.Add(await MapToPollDtoAsync(poll, userId, totalUsers));
        }

        return result;
    }

    public async Task<PollDto?> GetPollByIdAsync(int id, string userId)
    {
        var poll = await _pollRepository.GetByIdAsync(id);
        if (poll == null) return null;

        var totalUsers = await _pollRepository.GetOwnerCountAsync();
        return await MapToPollDtoAsync(poll, userId, totalUsers);
    }

    public async Task<PollDto> CreatePollAsync(CreatePollDto createDto, string userId)
    {
        var poll = _mapper.Map<Poll>(createDto);
        poll.CreatedBy = userId;
        poll.CreatedAt = DateTime.UtcNow;

        await _pollRepository.AddAsync(poll);

        // Agregar opciones
        var options = createDto.Options.Select((text, index) => new PollOption
        {
            PollId = poll.Id,
            Text = text,
            Order = index + 1
        }).ToList();

        await _pollOptionRepository.AddRangeAsync(options);

        // Enviar notificación a todos los propietarios
        await _notificationService.NotifyNewPollAsync(poll.Id, poll.Title);

        return await GetPollByIdAsync(poll.Id, userId) ?? throw new InvalidOperationException("Failed to create poll");
    }

    public async Task<PollDto> UpdatePollAsync(int pollId, CreatePollDto updateDto, string userId)
    {
        var poll = await _pollRepository.GetByIdAsync(pollId);
        if (poll == null)
            throw new InvalidOperationException("Poll not found");

        // Solo permitir edición si no hay votos aún
        var hasVotes = await _pollRepository.HasVotesAsync(pollId);
        if (hasVotes)
            throw new InvalidOperationException("Cannot edit poll with existing votes");

        // Actualizar propiedades usando AutoMapper
        _mapper.Map(updateDto, poll);
        poll.UpdatedAt = DateTime.UtcNow;

        // Eliminar opciones existentes
        var existingOptions = await _pollOptionRepository.GetByPollIdAsync(pollId);
        await _pollOptionRepository.DeleteRangeAsync(existingOptions);

        // Agregar nuevas opciones
        var newOptions = updateDto.Options.Select((text, index) => new PollOption
        {
            PollId = poll.Id,
            Text = text,
            Order = index + 1
        }).ToList();

        await _pollOptionRepository.AddRangeAsync(newOptions);
        await _pollRepository.UpdateAsync(poll);

        return await GetPollByIdAsync(poll.Id, userId) ?? throw new InvalidOperationException("Failed to update poll");
    }

    public async Task<bool> VoteAsync(VoteDto voteDto, string userId)
    {
        var poll = await _pollRepository.GetByIdAsync(voteDto.PollId);
        if (poll == null) return false;

        if (DateTime.UtcNow > poll.EndDate) return false;

        var option = await _pollOptionRepository.GetByIdAsync(voteDto.OptionId);
        if (option == null || option.PollId != voteDto.PollId) return false;

        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null) return false;
        
        var existingVotes = await _pollVoteRepository.GetByPollIdAndUserIdAsync(voteDto.PollId, userId);
        if (existingVotes.Any())
        {
            await _pollVoteRepository.DeleteRangeAsync(existingVotes);
        }

        var vote = new PollVote
        {
            PollId = voteDto.PollId,
            PollOptionId = voteDto.OptionId,
            UserId = userId,
            VotedAt = DateTime.UtcNow
        };
        await _pollVoteRepository.AddAsync(vote);

        return true;
    }

    public async Task<bool> VoteMultipleAsync(MultipleVoteDto voteDto, string userId)
    {
        var poll = await _pollRepository.GetByIdAsync(voteDto.PollId);
        if (poll == null) return false;

        if (poll.Type != PollType.Multiple) return false;
        if (DateTime.UtcNow > poll.EndDate) return false;

        var pollOptions = await _pollOptionRepository.GetByPollIdAsync(voteDto.PollId);
        var validOptionIds = pollOptions.Select(o => o.Id).ToList();
        if (!voteDto.OptionIds.All(id => validOptionIds.Contains(id))) return false;

        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null) return false;
        
        var existingVotes = await _pollVoteRepository.GetByPollIdAndUserIdAsync(voteDto.PollId, userId);
        if (existingVotes.Any())
        {
            await _pollVoteRepository.DeleteRangeAsync(existingVotes);
        }

        var newVotes = voteDto.OptionIds.Select(optionId => new PollVote
        {
            PollId = voteDto.PollId,
            PollOptionId = optionId,
            UserId = userId,
            VotedAt = DateTime.UtcNow
        }).ToList();

        await _pollVoteRepository.AddRangeAsync(newVotes);
        return true;
    }

    public async Task<bool> VoteCustomAsync(CustomVoteDto voteDto, string userId)
    {
        var poll = await _pollRepository.GetByIdAsync(voteDto.PollId);
        if (poll == null) return false;

        if (!poll.AllowOther) return false;
        if (DateTime.UtcNow > poll.EndDate) return false;

        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null) return false;

        var existingVotes = await _pollVoteRepository.GetByPollIdAndUserIdAsync(voteDto.PollId, userId);
        if (existingVotes.Any())
        {
            await _pollVoteRepository.DeleteRangeAsync(existingVotes);
        }

        var pollOptions = await _pollOptionRepository.GetByPollIdAsync(voteDto.PollId);
        var customOption = pollOptions.FirstOrDefault(o => o.Text == voteDto.CustomText);
        if (customOption == null)
        {
            customOption = new PollOption
            {
                PollId = poll.Id,
                Text = voteDto.CustomText,
                Order = pollOptions.Count() + 1
            };
            await _pollOptionRepository.AddAsync(customOption);
        }

        var vote = new PollVote
        {
            PollId = voteDto.PollId,
            PollOptionId = customOption.Id,
            UserId = userId,
            VotedAt = DateTime.UtcNow
        };
        await _pollVoteRepository.AddAsync(vote);
        return true;
    }

    public async Task<bool> VoteCustomMultipleAsync(CustomMultipleVoteDto voteDto, string userId)
    {
        var poll = await _pollRepository.GetByIdAsync(voteDto.PollId);
        if (poll == null) return false;

        if (poll.Type != PollType.Multiple) return false;
        if (!poll.AllowOther) return false;
        if (DateTime.UtcNow > poll.EndDate) return false;

        var pollOptions = await _pollOptionRepository.GetByPollIdAsync(voteDto.PollId);
        var validOptionIds = pollOptions.Select(o => o.Id).ToList();
        if (voteDto.OptionIds.Any() && !voteDto.OptionIds.All(id => validOptionIds.Contains(id))) return false;

        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null) return false;

        var existingVotes = await _pollVoteRepository.GetByPollIdAndUserIdAsync(voteDto.PollId, userId);
        if (existingVotes.Any())
        {
            await _pollVoteRepository.DeleteRangeAsync(existingVotes);
        }

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

        if (!string.IsNullOrWhiteSpace(voteDto.CustomText))
        {
            var customOption = pollOptions.FirstOrDefault(o => o.Text == voteDto.CustomText);
            if (customOption == null)
            {
                customOption = new PollOption
                {
                    PollId = poll.Id,
                    Text = voteDto.CustomText,
                    Order = pollOptions.Count() + 1
                };
                await _pollOptionRepository.AddAsync(customOption);
            }

            newVotes.Add(new PollVote
            {
                PollId = voteDto.PollId,
                PollOptionId = customOption.Id,
                UserId = userId,
                VotedAt = DateTime.UtcNow
            });
        }

        await _pollVoteRepository.AddRangeAsync(newVotes);
        return true;
    }

    public async Task<bool> DeletePollAsync(int id)
    {
        var poll = await _pollRepository.GetByIdAsync(id);
        if (poll == null || poll.IsDeleted) return false;

        poll.IsDeleted = true;
        poll.DeletedAt = DateTime.UtcNow;
        await _pollRepository.UpdateAsync(poll);
        return true;
    }

    public async Task<bool> ClosePollAsync(int id)
    {
        var poll = await _pollRepository.GetByIdAsync(id);
        if (poll == null) return false;

        poll.EndDate = DateTime.UtcNow;
        await _pollRepository.UpdateAsync(poll);
        return true;
    }

    private async Task<PollDto> MapToPollDtoAsync(Poll poll, string userId, int totalUsers)
    {
        // Mapeo base usando AutoMapper
        var pollDto = _mapper.Map<PollDto>(poll);
        
        // Calcular datos adicionales que no están en la entidad
        var userVotes = poll.Votes.Where(v => v.UserId == userId).ToList();
        var totalVotes = poll.Votes.GroupBy(v => v.UserId).Count();
        
        var users = await _userRepository.GetUsersWithApartmentsAsync();
        var usersArray = users as object[] ?? users.ToArray();

        // Mapear opciones con AutoMapper y agregar datos calculados
        pollDto.Options = poll.Options.Select(o =>
        {
            var optionDto = _mapper.Map<PollOptionDto>(o);
            optionDto.Percentage = totalVotes > 0 ? Math.Round((decimal)o.Votes.Count / poll.Votes.Count * 100, 1) : 0;
            
            if (!poll.IsAnonymous)
            {
                optionDto.Voters = o.Votes.Select(v => 
                {
                    var voterDto = new VoterDto
                    {
                        OwnerName = GetOwnerName(v.UserId, usersArray),
                        Apartment = GetOwnerApartment(v.UserId, usersArray),
                        VotedAt = v.VotedAt
                    };
                    return voterDto;
                }).ToList();
            }
            else
            {
                optionDto.Voters = new List<VoterDto>();
            }
            
            return optionDto;
        }).ToList();

        // Calcular estadísticas
        var participationRate = totalUsers > 0 ? Math.Round((decimal)totalVotes / totalUsers * 100, 1) : 0;
        var hasQuorum = poll.QuorumRequired.HasValue ? totalVotes >= poll.QuorumRequired.Value : true;
        
        var status = DateTime.UtcNow > poll.EndDate ? PollStatus.Closed : 
                    DateTime.UtcNow < poll.StartDate ? PollStatus.Pending : PollStatus.Active;

        pollDto.Stats = new PollStatsDto
        {
            TotalVotes = totalVotes,
            TotalUsers = totalUsers,
            ParticipationRate = participationRate,
            HasQuorum = hasQuorum,
            Status = status.ToString()
        };

        // Información de voto del usuario
        pollDto.HasUserVoted = userVotes.Any();
        pollDto.UserVoteOptionId = userVotes.FirstOrDefault()?.PollOptionId;
        pollDto.UserVoteOptionIds = userVotes.Select(v => v.PollOptionId).ToList();

        return pollDto;
    }
    
    private string GetOwnerName(string userId, object[] users)
    {
        try
        {
            dynamic? user = users.FirstOrDefault(u =>
            {
                dynamic userData = u;
                return userData.Id == userId;
            });
            return user != null ? $"{user.FirstName} {user.LastName}" : "Usuario desconocido";
        }
        catch
        {
            return "Usuario desconocido";
        }
    }
    
    private string GetOwnerApartment(string userId, object[] users)
    {
        try
        {
            dynamic? user = users.FirstOrDefault(u =>
            {
                dynamic userData = u;
                return userData.Id == userId;
            });
                
            if (user?.Apartment != null)
            {
                return user.Apartment;
            }
            return "N/A";
        }
        catch
        {
            return "N/A";
        }
    }
}
