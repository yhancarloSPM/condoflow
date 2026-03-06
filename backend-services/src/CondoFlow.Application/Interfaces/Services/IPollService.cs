using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Services;

public interface IPollService
{
    Task<IEnumerable<PollDto>> GetAllPollsAsync(string userId);
    Task<PollDto?> GetPollByIdAsync(int id, string userId);
    Task<PollDto> CreatePollAsync(CreatePollDto createDto, string userId);
    Task<PollDto> UpdatePollAsync(int pollId, CreatePollDto updateDto, string userId);
    Task<bool> VoteAsync(VoteDto voteDto, string userId);
    Task<bool> VoteMultipleAsync(MultipleVoteDto voteDto, string userId);
    Task<bool> VoteCustomAsync(CustomVoteDto voteDto, string userId);
    Task<bool> VoteCustomMultipleAsync(CustomMultipleVoteDto voteDto, string userId);
    Task<bool> DeletePollAsync(int id);
    Task<bool> ClosePollAsync(int id);
}
