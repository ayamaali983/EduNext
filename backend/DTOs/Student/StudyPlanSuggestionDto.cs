namespace backend.DTOs.Student;

public class StudyPlanSuggestionDto
{
    public string RecommendationText { get; set; } = "";
    public List<string> FocusSubjects { get; set; } = new();
    public int WeeklyStudyHours { get; set; }
    public List<string> LessonOrder { get; set; } = new();
    public Guid? SubjectId { get; set; }
    public List<Guid> LessonIds { get; set; } = new();
}
