namespace SamHowes.Analytics.Forecasting.Backlogging;

public class BacklogNavigator(List<WorkItem> items)
{
    public WorkItem Current { get; private set; } = items[0];
    public bool Finished { get; private set; } = false;

    private int _topIndex = 0;

    public void Down()
    {
        if (Current.Children.Count == 0)
            throw new InvalidOperationException($"Work Item {Current.Id} has no children.");
        Current = Current.Children[0];
        Finished = false;
    }

    public void Up()
    {
        if (Current.Parent == null)
            throw new InvalidOperationException($"Work Item {Current.Id} has no parent.");
        Current = Current.Parent;
    }

    public void Next()
    {
        if (Current.Parent == null)
        {
            if (_topIndex == items.Count - 1)
            {
                Finished = true;
                return;
            }

            _topIndex++;
            Finished = false;
            Current = items[_topIndex];
            return;
        }

        if (Current.Index == Current.Parent.Children.Count - 1)
        {
            Finished = true;
            return;
        }
        Current = Current.Parent.Children[Current.Index + 1];
        Finished = false;
    }

    public void Advance(Func<WorkItem, bool> until)
    {
        
    }
}