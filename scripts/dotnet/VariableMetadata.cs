using System.Text.Json.Serialization;

namespace ResolveVariables;

public class VariableMetadata
{
    [JsonPropertyName("variableKey")]
    public string VariableKey { get; set; } = "";

    [JsonPropertyName("courseId")]
    public int? CourseId { get; set; }

    [JsonPropertyName("programId")]
    public int? ProgramId { get; set; }

    [JsonPropertyName("studentId")]
    public int? StudentId { get; set; }
}
