using SamHowes.Analytics.Forecasting.Backlogging;

namespace SamHowes.Analytics.Forecasting.Teams;

public class Contributor(string email)
{
    public string Email { get; } = email;
    public string Ldap { get; } = email.Split('@')[0];
    public bool IsPrimary { get; set; }
    public HashSet<WorkItem> Active { get; } = [];
    public BacklogHeap Work { get; } = new();
}