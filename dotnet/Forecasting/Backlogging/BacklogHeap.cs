using SamHowes.Extensions.Collections;

namespace SamHowes.Analytics.Forecasting.Backlogging;

public class BacklogHeap() : MinHeap<WorkItem>((a, b) => a.Priority.CompareTo(b.Priority));