using SamHowes.Analytics.Forecasting.Backlogging;
using SamHowes.Analytics.Forecasting.Teams;

namespace SamHowes.Analytics.Forecasting;

public class ForecastingClock(DateTimeOffset now) : IClock
{
    public DateTimeOffset Now { get; private set; } = now;

    public void Set(DateTimeOffset currentTime)
    {
        Now = currentTime;
    }
}

public class Forecaster
{
    private readonly Team _team;
    private BacklogHeap _queue = new();
    private ForecastingClock _clock;

    public Forecaster(Team team, ForecastingClock clock)
    {
        _team = team;
        _clock = clock;
    }

    public void Forecast(Backlog backlog)
    {
        QueueWork(backlog);
        
        StartWork();
        
        CompleteWork();
    }

    public void StartWork()
    {
        if (_team.NeedsWork.Count == 0)
        {
            // assign work to those without work specifically assigned to them first
            // that way, someone who has work assigned will have a better chance of
            // starting the work assigned to them first
            foreach (var work in _team.Contributors.Values.OrderBy(c => c.Work.Size))
            {
                _team.NeedsWork.Add(work);
            }
        }
        
        var needsWork = _team.NeedsWork.ToList();
        _team.NeedsWork.Clear();
        foreach (var contributor in needsWork)
        {
            var unassigned = _team.Unassigned.Peek();
            if (contributor.Work.Size == 0)
            {
                if (unassigned == null)
                {
                    _team.NeedsWork.Add(contributor);
                    continue;
                }
                    
                _team.Start(unassigned, contributor);
                _team.Unassigned.Pop();
            }
            else
            {
                if (unassigned == null || contributor.Work.Peek()!.Priority < unassigned.Priority)
                    _team.Start(contributor.Work.Pop(), contributor);
                else
                {
                    _team.Start(unassigned, contributor);
                    _team.Unassigned.Pop();
                }
            }

            _team.NeedsWork.Remove(contributor);
        }
    }

    public void QueueWork(Backlog backlog)
    {
        var it = new BacklogIterator()
            .Skip(i => i.WorkState == WorkState.Completed);
        it.OnDescend(item =>
        {
            if (item.Parent?.Contributor != null && item.Contributor == null)
                item.Contributor = item.Parent.Contributor;
            
            if (item.Workable && item.WorkState == WorkState.Active)
            {
                throw new NotImplementedException();
            }

            return true;
        })
        .Iterate(backlog.Items);
        
        it.OnDescend((item) =>
            {
                if (item.Workable)
                {
                    _team.Queue(item);
                    return false;
                }

                return true;
            })
            .Iterate(backlog.Items);
    }

    public bool CompleteWork()
    {
        if (_team.ActiveWork.Size == 0)
            return false;

        var completedAt = _team.ActiveWork.Peek()!.CompletedAt;
        while (_team.ActiveWork.Size > 0 && 
               completedAt == _team.ActiveWork.Peek()!.CompletedAt)
        {
            var item = _team.ActiveWork.Pop();
            item.Contributor!.Active.Remove(item);
            item.WorkState = WorkState.Completed;
            _team.NeedsWork.Add(item.Contributor!);

            QueueNextItem(item);
            
            var it = item.Parent;
            while (it != null && it.WorkState < WorkState.Completed)
            {
                var allComplete = it.Children.All(c => c.WorkState >= WorkState.Completed);
                if (!allComplete)
                    break;
                it.WorkState = WorkState.Completed;
                it.CompletedAt = item.CompletedAt;
                it = it.Parent;
            }
        }

        _clock.Set(completedAt!.Value);

        return true;
    }

    private void QueueNextItem(WorkItem item)
    {
        if (item.Parent == null)
            return;
        for (var i = item.Index + 1; i < item.Parent.Children.Count; i++)
        {
            var next = item.Parent.Children[i];
            if (next.WorkState > WorkState.New)
                continue;
            _team.Queue(next);
            break;
        }
    }
}