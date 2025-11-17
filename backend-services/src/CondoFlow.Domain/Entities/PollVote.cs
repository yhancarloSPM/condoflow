namespace CondoFlow.Domain.Entities;

public class PollVote
{
    public int Id { get; set; }
    public int PollId { get; set; }
    public int PollOptionId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime VotedAt { get; set; }
    
    public Poll Poll { get; set; } = null!;
    public PollOption PollOption { get; set; } = null!;
}