using SamHowes.Analytics.Forecasting.Backlogging;

namespace SamHowes.Analytics.Forecasting;

public class Forecaster
{
    public void Forecast(Team team, Backlog backlog)
    {
        backlog.Initialize(DateTimeOffset.Now);
    }
}