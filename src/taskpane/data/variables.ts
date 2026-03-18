import type { PlaceholderVariable } from "../types/variable";

export const VARIABLES: PlaceholderVariable[] = [
  {
    id: "student-name",
    label: "Student Name",
    placeholder: "Student Name",
    metadata: {
      variableKey: "student_name",
      studentId: 1,
      courseId: null,
      programId: 10,
    },
  },
  {
    id: "course-title",
    label: "Course Title",
    placeholder: "Course Title",
    metadata: {
      variableKey: "course_title",
      studentId: null,
      courseId: 101,
      programId: 10,
    },
  },
  {
    id: "grade",
    label: "Grade",
    placeholder: "Grade",
    metadata: {
      variableKey: "grade",
      studentId: 1,
      courseId: 101,
      programId: 10,
    },
  },
];
