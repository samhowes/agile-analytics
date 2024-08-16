namespace SamHowes.Analytics.Forecasting.Backlogging;

public class Backlog(BacklogConfig config, Team team)
{
    private DateTimeOffset _now;
    public readonly List<WorkItem> Items = [];
    private Dictionary<string,WorkItem> _map = [];
    private int _fakeId = -1;

    private readonly WorkItem _unparented = new WorkItem()
    {
        Id = "-1",
        ParentId = null,
        Title = "Unparented",
        State = WorkItemState.New.ToString(),
        StoryPoints = config.DefaultStoryPoints,
        Type = config.TopLevel,
        AssignedTo = null,
        Children = [],
    };

    public void Ingest(List<WorkItem> items)
    {
        _map = items.ToDictionary(i => i.Id);
        _map[_unparented.Id] = _unparented;
        
        // populate top-level list and map parents
        foreach (var item in items)
        {
            item.Workable = config.Workable.Contains(item.Type);
            if (item.Workable)
                item.StoryPoints ??= config.DefaultStoryPoints;
            else
                item.StoryPoints = 0;
            
            if (item.Type == config.TopLevel)
                Items.Add(item);
            if (item.AssignedTo?.UserEmail != null)
                team.Add(item.AssignedTo.UserEmail);
            
            if (item.ParentId == null)
            {
                if (!item.Workable)
                    continue;
                item.ParentId = _unparented.Id;
                item.Parent = _unparented;
                _unparented.Children.Add(item);
            }
            
            if (!_map.TryGetValue(item.ParentId, out var parent))
                continue; // item gets lost
            item.Parent = parent;
            parent.Children.Add(item);
        }

        var depth = 0;
        var priority = 1;
        new BacklogIterator()
            .OnDescend((item) =>
            {
                item.Depth = depth++;
                item.Priority = priority++;
                
                if (item.Children.Count == 0 && !item.Workable)
                {
                    // add a placeholder to add default points to this parent item
                    item.Children.Add(Placeholder(item));
                }
                item.PointsRemaining = item.State == WorkItemState.Closed.ToString() ? 0.0 : item.StoryPoints;
            })
            .OnAscend((item) =>
            {
                depth--;
                
                if (item.Parent == null) 
                    return;
                item.Parent!.StoryPoints += item.StoryPoints;
                item.Parent!.PointsRemaining += item.PointsRemaining;
            })
            .Iterate(Items);
    }

    private WorkItem Placeholder(WorkItem parent)
    {
        return new WorkItem()
        {
            Id = (_fakeId--).ToString(),
            ParentId = parent.Id,
            Parent = parent,
            Title = "[Placeholder]",
            State = WorkItemState.Active.ToString(),
            StoryPoints = parent.StoryPoints ?? config.DefaultStoryPoints,
            Type = config.Workable.First(),
            Workable = true,
            AssignedTo = parent.AssignedTo,
        };
    }

    public void Initialize(DateTimeOffset now)
    {
        _now = now;
    }
}