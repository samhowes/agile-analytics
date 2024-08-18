using SamHowes.Analytics.Forecasting;
using SamHowes.Extensions.DependencyInjection.Modules.Web;

var builder = new WebInjectorBuilder(WebApplication.CreateBuilder(args));

builder.AddModule(new ForecastingModule());

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
