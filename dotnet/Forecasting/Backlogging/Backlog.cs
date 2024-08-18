using System.Reflection.Emit;
using Microsoft.VisualBasic.CompilerServices;
using SamHowes.Analytics.Forecasting.Teams;

namespace SamHowes.Analytics.Forecasting.Backlogging;

public class Backlog(BacklogConfig config, Team team)
{
    public readonly List<WorkItem> Items = [];
    private Dictionary<string,WorkItem> _map = [];
    private int _fakeId = -1;
    public Team Team { get; } = team;

    private readonly WorkItem _unparented = new WorkItem()
    {
        Id = "-1",
        ParentId = null,
        Title = "Unparented",
        WorkState = WorkState.New,
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
            item.WorkState = item.State switch
            {
                WorkItemState.New => WorkState.New,
                WorkItemState.Active => WorkState.Active,
                WorkItemState.Completed => WorkState.Completed,
            };
            
            item.Workable = config.Workable.Contains(item.Type);
            if (item.Workable)
                item.StoryPoints ??= config.DefaultStoryPoints;
            else
                item.StoryPoints = 0;
            
            if (item.Type == config.TopLevel)
                Items.Add(item);
            
            if (item.AssignedTo?.UserEmail != null)
                item.Contributor = Team.Contributor(item.AssignedTo.UserEmail);
            
            if (item.WorkState == WorkState.Active && item.AssignedTo?.UserEmail == null)
                item.WorkState = WorkState.New;
            
            item.PointsRemaining = item.WorkState == WorkState.Completed ? 0.0 : item.StoryPoints;
            
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
            })
            .OnAscend((item) =>
            {
                depth--;
                
                if (item.Parent == null) 
                    return;
                
                if (item.Parent.WorkState >= WorkState.Completed && item.WorkState < WorkState.Completed)
                {
                    item.Parent.WorkState = item.WorkState;
                }
                
                item.Parent!.StoryPoints += item.StoryPoints;
                item.Parent!.PointsRemaining += item.PointsRemaining;
            })
            .Iterate(Items);
        
        SetIndices();
    }

    private void SetIndices()
    {
        var queue = new Queue<List<WorkItem>>();
        queue.Enqueue(Items);
        while (queue.Count > 0)
        {
            var items = queue.Dequeue();
            for (var index = 0; index < items.Count; index++)
            {
                var child = items[index];
                child.Index = index;
                
                if (child.Children.Count > 0)
                    queue.Enqueue(child.Children);
            }    
        }
    }

    private WorkItem Placeholder(WorkItem parent)
    {
        return new WorkItem()
        {
            Id = (_fakeId--).ToString(),
            ParentId = parent.Id,
            Parent = parent,
            Title = "[Placeholder]",
            WorkState = WorkState.Active,
            StoryPoints = parent.StoryPoints ?? config.DefaultStoryPoints,
            Type = config.Workable.First(),
            Workable = true,
            AssignedTo = parent.AssignedTo,
        };
    }
}