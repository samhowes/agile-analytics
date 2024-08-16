using SamHowes.Extensions.Collections;

namespace SamHowes.Analytics.Forecasting;

public class BacklogQueue()
    : MinHeap<WorkItem>((a, b) => a.Priority - b.Priority) 
{}

public class Contributor(string email)
{
    public string Email { get; } = email;
    public string Ldap { get; } = email.Split('@')[0];
}