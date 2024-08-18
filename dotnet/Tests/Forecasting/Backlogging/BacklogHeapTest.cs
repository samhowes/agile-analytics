using FluentAssertions;
using SamHowes.Analytics.Forecasting;
using SamHowes.Analytics.Forecasting.Backlogging;

namespace SamHowes.Analytics.Tests.Forecasting;

public class BacklogHeapTest
{
    [Fact]
    public void It_Works()
    {
        var queue = new BacklogHeap();

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