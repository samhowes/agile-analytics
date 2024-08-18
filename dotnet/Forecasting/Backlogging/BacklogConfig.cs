using System.Collections;

namespace SamHowes.Analytics.Forecasting.Backlogging;

public class BacklogConfig(string topLevel)
{
    public string TopLevel { get; } = topLevel;
    public double DefaultStoryPoints { get; set; } = 5.0;
    public List<string> PrimaryContributors { get; set; } = [];
    public string TeamDomain { get; set; }

    public HashSet<string> Workable = [];
}

public enum AzureWorKItemType
{
    Epic,
    Feature,
    Story,
    Bug
}

public enum JiraWorkItemType
{
    Epic,
    Story,
    Task,
    Bug,
}

public class AzureBacklogConfig : BacklogConfig
{
    public AzureBacklogConfig(AzureWorKItemType topLevel) : base(topLevel.ToString())
    {
        Workable.Add(AzureWorKItemType.Story.ToString());
        Workable.Add(AzureWorKItemType.Bug.ToString());
    }
}
public class JiraBacklogConfig : BacklogConfig
{
    public JiraBacklogConfig(string topLevel) : base(topLevel)
    {
        Workable.Add(JiraWorkItemType.Story.ToString());
        Workable.Add(JiraWorkItemType.Task.ToString());
        Workable.Add(JiraWorkItemType.Bug.ToString());
    }
}