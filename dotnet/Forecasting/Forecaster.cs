using SamHowes.Analytics.Forecasting.Backlogging;
using SamHowes.Analytics.Forecasting.Teams;

namespace SamHowes.Analytics.Forecasting;

public class Forecaster(ForecastingClock clock)
{
    public ForecastingClock Clock { get; } = clock;
    public void Forecast(Backlog backlog)
    {
        QueueWork(backlog);

        var completedWork = false;
        do
        {
            StartWork(backlog.Team);
        
            completedWork = CompleteWork(backlog.Team);    
        } while (completedWork);
        
    }

    public void StartWork(Team team)
    {
        if (team.NeedsWork.Count == 0)
        {
            // assign work to those without work specifically assigned to them first
            // that way, someone who has work assigned will have a better chance of
            // starting the work assigned to them first
            foreach (var work in team.Contributors.Values
                         .Where(c => c.Active.Count == 0)
                         .OrderBy(c => c.Work.Size))
            {
                team.NeedsWork.Add(work);
            }
        }
        
        var needsWork = team.NeedsWork.ToList();
        team.NeedsWork.Clear();
        foreach (var contributor in needsWork)
        {
            var unassigned = team.Unassigned.Peek();
            if (contributor.Work.Size == 0)
            {
                if (unassigned == null)
                {
                    team.NeedsWork.Add(contributor);
                    continue;
                }
                    
                team.Start(unassigned, contributor);
                team.Unassigned.Pop();
            }
            else
            {
                if (unassigned == null || contributor.Work.Peek()!.Priority < unassigned.Priority)
                    team.Start(contributor.Work.Pop(), contributor);
                else
                {
                    team.Start(unassigned, contributor);
                    team.Unassigned.Pop();
                }
            }

            team.NeedsWork.Remove(contributor);
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
                backlog.Team.Start(item);
            }

            return true;
        })
        .Iterate(backlog.Items);
        
        it.OnDescend((item) =>
            {
                if (item.Workable)
                {
                    backlog.Team.Queue(item);
                    return false;
                }

                return true;
            })
            .Iterate(backlog.Items);
    }

    public bool CompleteWork(Team team)
    {
        if (team.ActiveWork.Size == 0)
            return false;

        var completedAt = team.ActiveWork.Peek()!.CompletedAt;
        while (team.ActiveWork.Size > 0 && 
               completedAt == team.ActiveWork.Peek()!.CompletedAt)
        {
            var item = team.ActiveWork.Pop();
            item.Contributor!.Active.Remove(item);
            item.WorkState = WorkState.Completed;
            team.NeedsWork.Add(item.Contributor!);

            QueueNextItem(team, item);
            
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

        Clock.Set(completedAt!.Value);

        return true;
    }

    private void QueueNextItem(Team team, WorkItem item)
    {
        if (item.Parent == null)
            return;
        if (item.Index > 0 && item.Parent.Children[item.Index - 1].WorkState < WorkState.Completed)
            return; // this item was executed out of order
        
        for (var i = item.Index + 1; i < item.Parent.Children.Count; i++)
        {
            var next = item.Parent.Children[i];
            if (next.WorkState > WorkState.New)
                continue;
            team.Queue(next);
            break;
        }
    }
}