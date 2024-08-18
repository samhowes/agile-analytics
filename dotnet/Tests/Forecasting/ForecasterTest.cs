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
        
        _now = new DateTimeOffset(new DateTime(2024, 5, 1, 12, 0, 0, DateTimeKind.Utc));
        var clock = new ForecastingClock(_now);
        _team = new Team(new Predictor(clock, new PredictorConfig()));
        _fred = new Contributor("fred");
        _dave = new Contributor("dave");
        _forecaster = new Forecaster(clock);
        _backlog = new Backlog(config, _team);
    }

    private void Contributors(params Contributor[] contributors)
    {
        foreach (var contributor in contributors)
        {
            _team.Contributors[contributor.Email] = contributor;
        }
    }

    [Fact]
    public void Assignments_TrickleDown()
    {
        Contributors(_dave);
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
        Contributors(_dave, _fred);
        Backlog()
            .Epic()
            .Feature()
            .Story(_dave)
            .Grab(out var daveStory)
            .Story(_fred)
            .Grab(out var fredStory)
            .Build();

        _forecaster.Forecast(_backlog);

        daveStory.Contributor.Should().Be(_dave);
        daveStory.StartedAt.Should().Be(_now);
        daveStory.WorkState.Should().Be(WorkState.Completed);
        daveStory.CompletedAt.Should().Be(_now.AddDays(5));

        fredStory.Contributor.Should().Be(_fred);
        fredStory.StartedAt.Should().Be(daveStory.CompletedAt);
        fredStory.WorkState.Should().Be(WorkState.Completed);
        fredStory.CompletedAt.Should().Be(_now.AddDays(10));

        var feature = _map[2];
        feature.WorkState.Should().Be(WorkState.Completed);
        feature.CompletedAt.Should().Be(fredStory.CompletedAt);
    }

    [Fact]
    public void OutOfOrderActive_DoesActiveFirst_ThenInOrder()
    {
        Contributors(_fred, _dave);
        Backlog()
            .Epic()
            .Feature()
            .Story() // should be started immediately
            .Grab(out var firstStory)
            .Points(10)
            .Story(_fred, WorkItemState.Active) // should be done first
            .Grab(out var secondStory)
            .Story() // should be done third, after the first story in the feature
            .Grab(out var lastStory)
            .Build();

        _forecaster.Forecast(_backlog);
        
        firstStory.CompletedAt.Should().NotBeNull();
        secondStory.CompletedAt.Should().NotBeNull();
        lastStory.CompletedAt.Should().NotBeNull();
        
        // first and second stories are worked in parallel
        firstStory.StartedAt.Should().Be(secondStory.StartedAt);
        
        // last story is only worked once the first story is complete
        // "Active creates parallel, then resume serial from the start"
        lastStory.StartedAt.Should().Be(firstStory.CompletedAt);
    }

    [Fact]
    public void QueueWork_Works()
    {
        Contributors(_dave, _fred);
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

    [Fact]
    public void StartWork_Works()
    {
        Contributors(_dave);
        Backlog()
            .Epic()
            .Feature()
            .Story()
            .Build();
        
        _forecaster.QueueWork(_backlog);
        _forecaster.StartWork(_team);
        
        _team.Unassigned.Size.Should().Be(0);
        _dave.Active.Count.Should().Be(1);
    }
    
    [Fact]
    public void StartWork_HigherPriorityUnassigned_TakesPrecedence()
    {
        Contributors(_fred);
        Backlog()
            .Epic()
            .Feature()
            .Story()
            .Grab(out var shouldBeActive)
            
            .Feature()
            .Story(_fred)
            .Grab(out var assignedToFred)
            .Build();
        
        _forecaster.QueueWork(_backlog);
        _fred.Work.Size.Should().Be(1);
        _fred.Work.Peek().Should().Be(assignedToFred);
        
        _forecaster.StartWork(_team);
        
        _fred.Active.Count.Should().Be(1);
        var active = _fred.Active.First();
        active.Should().Be(shouldBeActive);
    }

    [Fact]
    public void StartWork_FillsInFreeWorkers_First()
    {
        Contributors(_dave, _fred);
        Backlog()
            .Epic()
            .Feature()
            .Story()
            .Grab(out var shouldBeDave)
            
            .Feature()
            .Story(_fred)
            .Grab(out var shouldBeFred)
            .Build();
        
        _forecaster.QueueWork(_backlog);
        _fred.Work.Size.Should().Be(1);
        _fred.Work.Peek().Should().Be(shouldBeFred);
        
        _forecaster.StartWork(_team);
        
        _fred.Active.Count.Should().Be(1);
        _dave.Active.Count.Should().Be(1);

        _fred.Active.First().Should().Be(shouldBeFred);
        _dave.Active.First().Should().Be(shouldBeDave);
    }

    [Fact]
    public void CompleteWork_Works()
    {
        Contributors(_fred);
        Backlog()
            .Epic()
            .Grab(out var epic)
            .Feature()
            .Grab(out var feature)
            .Story()
            .Grab(out var story)
            .Build();
        
        _forecaster.QueueWork(_backlog);
        _forecaster.StartWork(_team);
        _forecaster.CompleteWork(_team);
        
        story.WorkState.Should().Be(WorkState.Completed);
        feature.WorkState.Should().Be(WorkState.Completed);
        epic.WorkState.Should().Be(WorkState.Completed);
        
        feature.CompletedAt.Should().Be(story.CompletedAt);
        epic.CompletedAt.Should().Be(story.CompletedAt);
        
        _fred.Active.Count.Should().Be(0);

        _team.NeedsWork.Should().Contain(_fred);
    }
    
    
    [Fact]
    public void CompleteWork_QueuesNextItem()
    {
        Contributors(_fred, _dave);
        Backlog()
            .Epic()
            .Feature()
            .Story()
            .Story()
            .Grab(out var story)
            .Build();
        
        _forecaster.QueueWork(_backlog);
        _forecaster.StartWork(_team);
        _forecaster.CompleteWork(_team);
        
        _team.Unassigned.Size.Should().Be(1);
        _team.Unassigned.Peek().Should().Be(story);
    }

    [Fact]
    public void Forecast_ShouldCompleteAllWork()
    {
        Contributors(_fred);
        Backlog()
            .Epic()     // 1
            .Feature()  // 2
            .Story()    // 3
            .Story()    // 4
            .Story()    // 5
            .Build();
        
        _forecaster.Forecast(_backlog);

        new BacklogIterator()
            .OnDescend(item =>
            {
                item.CompletedAt.Should().NotBeNull();
                return true;
            })
            .Iterate(_backlog.Items);
    }

    private BacklogBuilder Backlog()
    {
        var builder = new BacklogBuilder(_backlog);
        _map = builder.Map;
        return builder;
    }
}