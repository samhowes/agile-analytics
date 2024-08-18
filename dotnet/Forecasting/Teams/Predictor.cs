namespace SamHowes.Analytics.Forecasting.Teams;

public class PredictorConfig
{
    public double DefaultVelocity { get; set; } = 1;
}

public class Predictor(IClock clock, PredictorConfig config)
{
    public IClock Clock { get; } = clock;
    public void Predict(WorkItem item)
    {
        WorkItem? i = item;
        while (i != null)
        {
            i.StartedAt ??= clock.Now;
            i = i.Parent;
        }

        item.DaysRemaining = item.PointsRemaining / GetVelocity(item);
        item.CompletedAt = item.StartedAt!.Value.AddDays(item.DaysRemaining!.Value);
    }

    private double GetVelocity(WorkItem item)
    {
        return config.DefaultVelocity;
    }
}