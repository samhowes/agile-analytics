namespace SamHowes.Analytics.Forecasting;

public class ForecastingClock(DateTimeOffset now) : IClock
{
    public DateTimeOffset Now { get; private set; } = now;

    public void Set(DateTimeOffset currentTime)
    {
        Now = currentTime;
    }
}