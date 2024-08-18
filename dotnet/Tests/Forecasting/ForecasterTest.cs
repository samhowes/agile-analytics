using FluentAssertions;
using Moq;
using SamHowes.Analytics.Forecasting;
using SamHowes.Analytics.Forecasting.Backlogging;
using SamHowes.Analytics.Forecasting.Teams;

namespace SamHowes.Analytics.Tests.Forecasting;

public class ForecasterTest
{
    private readonly Team _team;
    private readonly Contributor _fred;
    private readonly Contributor _dave;
    private int _workItemId = 1;
    private readonly Backlog _backlog;
    private readonly Forecaster _forecaster;
    private readonly DateTimeOffset _now;
    private Dictionary<int, WorkItem> _map = new();

    public ForecasterTest()
    {
        var config = new AzureBacklogConfig(AzureWorKItemType.Epic)
        {
            Workable = ["Story", "Bug"]
        };
        var clock = new Mock<IClock>();
        _now = new DateTimeOffset(new DateTime(2024, 5, 1, 12, 0, 0, DateTimeKind.Utc));
        clock.Setup(c => c.Now).Returns(_now);
        _team = new Team(new Predictor(clock.Object, new PredictorConfig()));
        _fred = _team.Contributor("fred");
        _dave = _team.Contributor("dave");
        _forecaster = new Forecaster(_team);
        _backlog = new Backlog(config, _team);
    }

    [Fact]
    public void Assignments_TrickleDown()
    {
        Backlog()
            .Epic()
            .Assign(_dave)
            .Feature()
            .Story()
            .Story()
            .Build();

        _forecaster.Forecast(_backlog);

        var epic = _backlog.Items[0];
        epic.Contributor.Should().Be(_dave);
        epic.Children[0].Contributor.Should().Be(_dave);
        foreach (var story in epic.Children[0].Children)
        {
            story.Contributor.Should().Be(_dave);
        }
    }

    [Fact]
    public void MultiplePeople_CanWorkOnTheSameFeature()
    {
        Backlog()
            .Epic()
            .Feature()
            .Story(_dave)
            .Story(_fred)
            .Build();

        _forecaster.Forecast(_backlog);

        var daveStory = _map[3];
        daveStory.Contributor.Should().Be(_dave);
        daveStory.StartedAt.Should().Be(_now);
        daveStory.WorkState.Should().Be(WorkState.Completed);
        daveStory.CompletedAt.Should().Be(_now.AddDays(5));

        var fredStory = _map[4];
        fredStory.Contributor.Should().Be(_fred);
        fredStory.StartedAt.Should().Be(_now);
        fredStory.WorkState.Should().Be(WorkState.Completed);
        fredStory.CompletedAt.Should().Be(_now.AddDays(10));

        var feature = _map[2];
        feature.WorkState.Should().Be(WorkState.Completed);
        feature.CompletedAt.Should().Be(fredStory.CompletedAt);
    }

    [Fact]
    public void OutOfOrderActive_DoesActiveFirst_ThenInOrder()
    {
        _backlog.Ingest([
            WorkItem(AzureWorKItemType.Epic),
            WorkItem(AzureWorKItemType.Feature, 1),
            WorkItem(AzureWorKItemType.Story, 2, 5.0),
            WorkItem(AzureWorKItemType.Story, 2, 10.0, _fred, WorkItemState.Active),
            WorkItem(AzureWorKItemType.Story, 2, 5.0),
        ]);

        _forecaster.Forecast(_backlog);

        var epic = _backlog.Items[0];
        var feature = epic.Children[0];

        var first = feature.Children[0];
        var second = feature.Children[1];
        var last = feature.Children[2];

        Assert.True(second.CompletedAt < last.CompletedAt);
        Assert.True(first.CompletedAt < last.CompletedAt);
    }

    [Fact]
    public void QueueWork_Works()
    {
        Backlog()
            .Epic()
            .Feature()
            .Story()
            .Story()
            .Feature()
            .Story(_fred)
            .Story(_dave)
            .Build();
        
        _forecaster.QueueWork(_backlog);

        _team.Unassigned.Size.Should().Be(1);
        _fred.Work.Size.Should().Be(1);
        _dave.Work.Size.Should().Be(0);

        var story = _fred.Work.Pop();
        story.Id.Should().Be("6");

        story = _team.Unassigned.Pop();
        story.Id.Should().Be("3");
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

        _map[id] = workItem;

        if (contributor != null)
            workItem.AssignedTo = new AzureUser(contributor.Email);
        return workItem;
    }

    private BacklogBuilder Backlog()
    {
        var builder = new BacklogBuilder(_backlog);
        _map = builder.Map;
        return builder;
    }
}