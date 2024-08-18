using Microsoft.AspNetCore.Mvc;
using SamHowes.Analytics.Forecasting;
using SamHowes.Analytics.Forecasting.Backlogging;
using SamHowes.Analytics.Forecasting.Teams;

namespace SamHowes.Analytics.Api.Gantt;

[ApiController]
[Route("api/gantt")]
public class GanttController(Forecaster forecaster) : ControllerBase
{
    [HttpGet("forecast")]
    public List<GanttItem> Forecast()
    {
        var predictor = new Predictor(forecaster.Clock, new PredictorConfig());
        var team = new Team(predictor);
        var jim = team.Contributor("jim@samhowes.com");
        var dwight = team.Contributor("dwight@samhowes.com");
        var mike = team.Contributor("mike@samhowes.com");
        var backlogConfig = BacklogConfig.DefaultAzure();
        var backlog = new Backlog(backlogConfig, team);
        
        new BacklogBuilder(backlog)
            .Epic("Close a very large client")
            .Feature("Client outreach")
            .Story("Cold call from the phonebook")
            .Story("Follow up calls")
            .Feature("Propose costs")
            .Story("Research paper thickness needs")
            .Story("Call suppliers to provide costs")
            .Story("Present costs to client")
            .Build();
        
        forecaster.Forecast(backlog);
        
        var gantt = backlog.Items.Select(i => new GanttItem(i)).ToList();
        return gantt;
    }
}

public class GanttItem(WorkItem item)
{
    public string Id { get; } = item.Id;
    public string Type { get; } = item.Type;
    public string Title { get; } = item.Title;
    public double? Points { get; } = item.StoryPoints;
    public string? Contributor { get; } = item.Contributor?.Email;
    public DateTimeOffset StartedAt { get; } = item.StartedAt!.Value;
    public DateTimeOffset CompletedAt { get; } = item.CompletedAt!.Value;
    public List<GanttItem> Children { get; } = item.Children.Select(c => new GanttItem(c)).ToList();
}