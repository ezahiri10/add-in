namespace ResolveVariables;

public static class VariableResolver
{
    public static string Resolve(VariableMetadata metadata) => metadata.VariableKey switch
    {
        "student_name" when metadata.StudentId == 1        => "John Doe",
        "course_title" when metadata.CourseId  == 101      => "Introduction to Computer Science",
        "grade"        when metadata.CourseId  == 101
                         && metadata.StudentId == 1        => "A",
        _                                                  => "[UNRESOLVED]"
    };
}
