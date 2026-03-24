export type VariableType = "user" | "student" | "organization" | "program" | "other";

// ── Hasura row types ──────────────────────────────────────────────────────────

export type DocumentVariable = {
  id: number;
  name: string;
  label_en: string;
};

export type Program = {
  id: number;
  name: string;
};

export type ProgramExpression = {
  id: number;
  name: string;
};

export type ProgramConditionalExpression = {
  id: number;
  name: string;
};

export type GradebookColumn = {
  id: number;
  name: string;
  isComputed: boolean;
};

export type CourseWithGrades = {
  id: number;           // program_page_course.id
  courseId: number;
  courseTitle: string;
  gradebookTemplateId: number | null;
  columns: GradebookColumn[];
};

// ── Variable subcategory (for UI grouping) ────────────────────────────────────

export type DocVarSubcategory =
  | "user"
  | "student"
  | "institution"
  | "program"
  | "cohort"
  | "class"
  | "other";

export function getDocVarSubcategory(name: string): DocVarSubcategory {
  if (name.startsWith("program_")) return "program";
  if (name.startsWith("cohort_")) return "cohort";
  if (name.startsWith("recent_class_") || name.startsWith("module_")) return "class";
  if (name === "today_date") return "other";
  const studentNames = [
    "id_student", "id_registration", "registration_date",
    "latest_attended_school", "latest_attended_program", "latest_obtained_diploma",
  ];
  if (studentNames.includes(name)) return "student";
  const userNames = [
    "first_name", "last_name", "birth_date", "place_birth", "phone", "email",
    "address", "city", "country", "picture", "gender", "id_number",
  ];
  if (userNames.includes(name)) return "user";
  return "institution";
}

export function subcategoryToVariableType(sub: DocVarSubcategory): VariableType {
  if (sub === "user") return "user";
  if (sub === "student") return "student";
  if (sub === "institution") return "organization";
  if (sub === "other") return "other";
  return "program"; // program, cohort, class
}

// ── Content Control tag JSON shapes ──────────────────────────────────────────

export type DocumentVariableTag = {
  type: "document_variable";
  variableId: number;
  variableName: string;
  variableType: VariableType;
  metadata: Record<string, unknown>;
};

export type ExpressionTag = {
  type: "expression";
  expressionId: number;
  expressionName: string;
};

export type ConditionalExpressionTag = {
  type: "conditional_expression";
  expressionId: number;
  expressionName: string;
};

export type GradeValueTag = {
  type: "grade_value";
  gradeName: string;
  gradebookTemplateId: number;
  gradebookTemplateColumnId: number;
  programPageCourseId: number;
  isComputed: boolean;
};

export type VariableTag =
  | DocumentVariableTag
  | ExpressionTag
  | ConditionalExpressionTag
  | GradeValueTag;

// ── PlaceholderVariable (passed to wordService) ───────────────────────────────

export type PlaceholderVariable = {
  id: string;
  label: string;
  placeholder: string;
  tag: VariableTag;
};
