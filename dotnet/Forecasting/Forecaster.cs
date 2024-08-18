using SamHowes.Analytics.Forecasting.Backlogging;
using SamHowes.Analytics.Forecasting.Teams;

namespace SamHowes.Analytics.Forecasting;

public class Forecaster
{
    private readonly Team _team;
    private BacklogHeap _queue = new();

    public Forecaster(Team team)
    {
        _team = team;
    }

    public void Forecast(Backlog backlog)
    {
        QueueWork(backlog);

        CompleteWork();
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

    private void CompleteWork()
    {
        while (_team.ActiveWork.Size > 0)
        {
            var item = _team.ActiveWork.Pop();

            item.WorkState = WorkState.Completed;
        }
    }

    private void FindWork()
    {
        while (_team.NeedsWork.Count > 0)
        {
            var contributor = _team.NeedsWork.PopFirst();
        }
    }
}