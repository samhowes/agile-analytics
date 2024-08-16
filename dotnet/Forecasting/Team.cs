namespace SamHowes.Analytics.Forecasting;

public class Team
{
    private Dictionary<string, Contributor> _contributors = [];
    
    public Contributor Add(string email) {
        if (!_contributors.TryGetValue(email, out var contributor))
        {
            contributor = new Contributor(email);
            _contributors.Add(email, contributor);
        }
        return contributor;
    }    
}