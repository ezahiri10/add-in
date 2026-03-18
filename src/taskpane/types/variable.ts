export type VariableMetadata = {
  variableKey: string;
  courseId?: number | null;
  programId?: number | null;
  studentId?: number | null;
};

export type PlaceholderVariable = {
  id: string;
  label: string;
  placeholder: string;
  metadata: VariableMetadata;
};
