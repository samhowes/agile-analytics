using FluentAssertions;
using SamHowes.Analytics.Forecasting;

namespace SamHowes.Analytics.Tests.Forecasting;

public class BacklogQueueTests
{
    [Fact]
    public void It_Works()
    {
        var queue = new BacklogQueue();

        var a = new WorkItem()
        {
            Priority = 10
        };
        var b = new WorkItem()
        {
            Priority = 1
        };

        queue.Push(b);
        queue.Push(a);

        var result = queue.Pop();
        result.Should().Be(b);
    }   
}