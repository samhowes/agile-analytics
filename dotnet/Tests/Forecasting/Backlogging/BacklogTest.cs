using FluentAssertions;
using SamHowes.Analytics.Forecasting;
using SamHowes.Analytics.Forecasting.Backlogging;
using SamHowes.Analytics.Forecasting.Teams;

namespace SamHowes.Analytics.Tests.Forecasting.Backlogging;

public class BacklogTest
{
    private readonly Backlog _backlog;
    private int _workItemId = 1;

    public BacklogTest()
    {
        var config = new AzureBacklogConfig(AzureWorKItemType.Epic);
        var team = new Team(new Predictor(new Clock(), new PredictorConfig()));
        _backlog = new Backlog(config, team);
    }

    [Fact]
    public void Ingest_Works()
    {
        _backlog.Ingest([
            WorkItem(AzureWorKItemType.Epic),
            WorkItem(AzureWorKItemType.Feature, 1),
        ]);

        _backlog.Items.Count.Should().Be(1); // only the epic
        
        var epic = _backlog.Items.First();
        epic.StoryPoints.Should().Be(0.0);
        epic.Workable.Should().BeFalse();

        epic.Children.Count.Should().Be(1); // only the feature
        var feature = epic.Children[0];
        feature.StoryPoints.Should().Be(0.0);
        feature.Workable.Should().BeFalse();
        
        // should fill in a placeholder
        feature.Children.Count.Should().Be(1);
        var story = feature.Children[0];
        story.Id.Should().Be((-1).ToString());
    }
    
    [Fact]
    public void Ingest_ParentsWorkItems()
    {
        _backlog.Ingest([
            WorkItem(AzureWorKItemType.Epic),
            WorkItem(AzureWorKItemType.Feature, 1),
            WorkItem(AzureWorKItemType.Story, 2, 8.0),
            WorkItem(AzureWorKItemType.Story, 2, 8.0)
        ]);

        _backlog.Items.Count.Should().Be(1); // only the epic
        
        var epic = _backlog.Items.First();
        epic.StoryPoints.Should().Be(16.0);

        epic.Children.Count.Should().Be(1); // only the feature
        var feature = epic.Children[0];
        feature.StoryPoints.Should().Be(16.0);

        feature.Children.Count.Should().Be(2);
        feature.StoryPoints.Should().Be(16.0);
    }

    [Fact]
    public void Ingest_FixesParentWorkItemCompleted()
    {
        var workItems = new List<WorkItem>()
        {
            WorkItem(AzureWorKItemType.Epic),
            WorkItem(AzureWorKItemType.Feature, 1),
            WorkItem(AzureWorKItemType.Story, 2, 8.0)
        };

        workItems[0].State = WorkItemState.Completed;
        workItems[1].State = WorkItemState.New;
        workItems[2].State = WorkItemState.New;
        
        _backlog.Ingest(workItems);
        
        var epic = _backlog.Items.First();
        epic.WorkState.Should().Be(WorkState.New);
        
        var feature = epic.Children.First();
        feature.WorkState.Should().Be(WorkState.New);
    }

    private WorkItem WorkItem(AzureWorKItemType type, int? parentId = null, double? storyPoints = null, params WorkItem[] children)
    {
        var id = _workItemId++;
        return new WorkItem()
        {
            Id = id.ToString(),
            Type = type.ToString(),
            Title = id.ToString(),
            ParentId = parentId.ToString(),
            StoryPoints = storyPoints,
            Children = children.ToList()
        };
    }
}