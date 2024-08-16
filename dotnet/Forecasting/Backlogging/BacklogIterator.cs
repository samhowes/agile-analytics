namespace SamHowes.Analytics.Forecasting.Backlogging;

public class BacklogIterator
{
    private Action<WorkItem>? _descend;
    private Action<WorkItem>? _ascend;

    public BacklogIterator OnDescend(Action<WorkItem> descend)
    {
        _descend = descend;
        return this;
    }

    public BacklogIterator OnAscend(Action<WorkItem> ascend)
    {
        _ascend = ascend;
        return this;
    }

    public void Iterate(List<WorkItem> workItems)
    {
        foreach (var workItem in workItems)
        {
            _descend?.Invoke(workItem);
            if (workItem.Children.Count != 0)
                Iterate(workItem.Children);
            _ascend?.Invoke(workItem);
        }
    }
}