namespace SamHowes.Analytics.Forecasting.Backlogging;

public class BacklogIterator
{
    private Func<WorkItem, bool>? _shouldSkip;
    private Func<WorkItem, bool>? _descend;
    private Action<WorkItem>? _ascend;
    
    public BacklogIterator Skip(Func<WorkItem, bool> shouldSkip)
    {
        _shouldSkip = shouldSkip;
        return this;
    }
    
    public BacklogIterator OnDescend(Func<WorkItem, bool> descend)
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
            if (_shouldSkip != null && _shouldSkip(workItem))
                continue;
            
            if (_descend != null)
            {
                var result = _descend(workItem);
                if (!result)
                    break;
            }
            
            if (workItem.Children.Count != 0)
                Iterate(workItem.Children);
            
            _ascend?.Invoke(workItem);
        }
    }
}