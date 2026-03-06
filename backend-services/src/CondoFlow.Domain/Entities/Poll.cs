namespace CondoFlow.Domain.Entities;

public class Poll
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public PollType Type { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public bool IsAnonymous { get; set; } = false;
    public bool ShowResults { get; set; } = true;
    public int? QuorumRequired { get; set; }
    public bool AllowOther { get; set; } = false;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    
    public ICollection<PollOption> Options { get; set; } = new List<PollOption>();
    public ICollection<PollVote> Votes { get; set; } = new List<PollVote>();
}

public enum PollType
{
    Simple = 0,     // Votación simple (una opción)
    Multiple = 1    // Votación múltiple (varias opciones)
}