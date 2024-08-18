using SamHowes.Analytics.Forecasting.Backlogging;
using SamHowes.Extensions.Collections;

namespace SamHowes.Analytics.Forecasting.Teams;

public class Team(Predictor predictor)
{
    public Dictionary<string, Contributor> Contributors { get; } = [];

    public BacklogHeap Unassigned { get; set; } = new();
    public MinHeap<WorkItem> ActiveWork { get; } = new((a,b) => a.CompletedAt!.Value.CompareTo(b.CompletedAt!.Value));
    public OrderedSet<Contributor> NeedsWork { get; } = [];

    public Contributor Contributor(string email) {
        if (!Contributors.TryGetValue(email, out var contributor))
        {
            contributor = new Contributor(email);
            Contributors.Add(email, contributor);
        }
        return contributor;
    }

    public void Start(WorkItem item)
    {
        Start(item, Contributor(item.AssignedTo!.UserEmail!));
    }

    public void Start(WorkItem item, Contributor contributor)
    {
        if (!item.Workable)
            throw new Exception("Can't start an unworkable item.");
        
        item.Contributor = contributor;
        contributor.Active.Add(item);
        
        predictor.Predict(item);
        
        ActiveWork.Push(item);

        var it = item;
        while (it != null)
        {
            it.WorkState = WorkState.Active;
            if (it.WorkState < WorkState.Active)
            {
                it.StartedAt = predictor.Clock.Now;
            }
            it = it.Parent;
        }
    }

    public void Queue(WorkItem item)
    {
        var queue = item.Contributor?.Work ?? Unassigned;
        queue.Push(item);
    }
}