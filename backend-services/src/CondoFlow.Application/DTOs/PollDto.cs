namespace CondoFlow.Application.DTOs;

public class PollDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public bool IsAnonymous { get; set; }
    public bool ShowResults { get; set; }
    public int? QuorumRequired { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    public List<PollOptionDto> Options { get; set; } = new();
    public PollStatsDto Stats { get; set; } = new();
    public bool HasUserVoted { get; set; }
    public int? UserVoteOptionId { get; set; }
}

public class PollOptionDto
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public int VoteCount { get; set; }
    public decimal Percentage { get; set; }
    public List<VoterDto> Voters { get; set; } = new();
}

public class VoterDto
{
    public string OwnerName { get; set; } = string.Empty;
    public string Apartment { get; set; } = string.Empty;
    public DateTime VotedAt { get; set; }
}

public class PollStatsDto
{
    public int TotalVotes { get; set; }
    public int TotalUsers { get; set; }
    public decimal ParticipationRate { get; set; }
    public bool HasQuorum { get; set; }
    public string Status { get; set; } = string.Empty; // Active, Closed, Pending
}

public class CreatePollDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Type { get; set; } // 1=Survey, 2=Vote
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsAnonymous { get; set; } = false;
    public bool ShowResults { get; set; } = true;
    public int? QuorumRequired { get; set; }
    public List<string> Options { get; set; } = new();
}

public class VoteDto
{
    public int PollId { get; set; }
    public int OptionId { get; set; }
}