using SamHowes.Analytics.Forecasting;
using SamHowes.Analytics.Forecasting.Backlogging;
using SamHowes.Analytics.Forecasting.Teams;

namespace SamHowes.Analytics.Api.Gantt;

public class BacklogBuilder(Backlog backlog)
{
    
    private int _workItemId = 1;
    private readonly List<WorkItem> _items = [];
    public readonly Dictionary<int, WorkItem> Map = new();

    private WorkItem? _epic = null;
    private WorkItem? _feature = null;
    private WorkItem? _last = null;

    public BacklogBuilder Epic(string title)
    {
        _epic = WorkItem(AzureWorKItemType.Epic);
        _epic.Title = title;
        return this;
    }


    public BacklogBuilder Feature(string title)
    {
        _feature = WorkItem(AzureWorKItemType.Feature, ParentId(_epic));
        _feature.Title = title;
        return this;
    }

    public BacklogBuilder Story(string title, Contributor? contributor = null, WorkItemState state = WorkItemState.New)
    {
        var item = WorkItem(AzureWorKItemType.Story, ParentId(_feature), null, contributor, state);
        item.Title = title;
        return this;
    }

    private int? ParentId(WorkItem? parent)
    {
        int? parentId = parent != null ? int.Parse(parent.Id) : null;
        return parentId;
    }

    private WorkItem WorkItem(AzureWorKItemType type, int? parentId = null, double? storyPoints = null,
        Contributor? contributor = null, WorkItemState? workState = null)
    {
        var id = _workItemId++;
        var workItem = new WorkItem()
        {
            Id = id.ToString(),
            Type = type.ToString(),
            Title = id.ToString(),
            ParentId = parentId.ToString(),
            StoryPoints = storyPoints,
            State = workState ?? WorkItemState.New
        };

        Map[id] = workItem;

        if (contributor != null)
            workItem.AssignedTo = new AzureUser(contributor.Email);
        _last = workItem;
        _items.Add(workItem);
        return workItem;
    }

    public Backlog Build()
    {
        backlog.Ingest(_items);
        return backlog;
    }

    public BacklogBuilder Assign(Contributor contributor)
    {
        _last!.Contributor = contributor;
        return this;
    }

    public BacklogBuilder Grab(out WorkItem item)
    {
        item = _last!;
        return this;
    }

    public BacklogBuilder Points(double storyPoints)
    {
        _last!.StoryPoints = storyPoints;
        return this;
    }
}