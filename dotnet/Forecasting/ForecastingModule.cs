using SamHowes.Extensions.DependencyInjection.Modules;

namespace SamHowes.Analytics.Forecasting;

public class ForecastingModule : InjectionModule
{
    public override void Configure(InjectorBuilder builder)
    {
        builder.Add<Forecaster>();
    }
}