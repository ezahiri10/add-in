import type { VariableMetadata } from "../types/variable";

export function resolveVariableValue(metadata: VariableMetadata): string {
  if (metadata.variableKey === "student_name" && metadata.studentId === 1) {
    return "John Doe";
  }

  if (metadata.variableKey === "course_title" && metadata.courseId === 101) {
    return "Introduction to Computer Science";
  }

  if (metadata.variableKey === "grade" && metadata.courseId === 101 && metadata.studentId === 1) {
    return "A";
  }

  return "[UNRESOLVED]";
}
