using SamHowes.Analytics.Forecasting;
using SamHowes.Extensions.DependencyInjection.Modules;

var injector = new InjectorBuilder()
    .AddModule(new ForecastingModule())
    .Build();
    
var forecaster = injector.Get<Forecaster>();