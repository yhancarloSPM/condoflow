namespace CondoFlow.Domain.Entities;

public class PollOption
{
    public int Id { get; set; }
    public int PollId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int Order { get; set; }
    
    public Poll Poll { get; set; } = null!;
    public ICollection<PollVote> Votes { get; set; } = new List<PollVote>();
}