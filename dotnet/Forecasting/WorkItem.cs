using SamHowes.Analytics.Forecasting.Teams;

namespace SamHowes.Analytics.Forecasting;

public enum WorkState
{
    New,
    Active,
    Completed
}

public enum WorkItemState
{
    New,
    Active,
    Completed
}



public record AzureUser(string? UserEmail);

public class WorkItem
{
    public string Id { get; set; }
    public string? ParentId { get; set; }
    public WorkItem? Parent { get; set; }
    public string Title { get; set; }
    public WorkItemState State { get; set; }
    public WorkState WorkState { get; set; }
    public double? StoryPoints { get; set; }
    public double? PointsRemaining { get; set; }

    public string Type { get; set; } = null!;
    public AzureUser? AssignedTo { get; set; }

    public List<WorkItem> Children { get; set; } = [];
    public int Priority { get; set; } = int.MaxValue;
    
    public DateTimeOffset? StartedAt { get; set; }
    
    public DateTimeOffset? CompletedAt { get; set; }
    public int Depth { get; set; }
    public bool Workable { get; set; }
    public Contributor? Contributor { get; set; }
    public double? DaysRemaining { get; set; }
    public int Index { get; set; }
}