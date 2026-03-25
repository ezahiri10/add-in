import { gql } from "./hasura";
import type {
  DocumentVariable,
  Program,
  ProgramExpression,
  ProgramConditionalExpression,
  CourseWithGrades,
} from "../types/variable";

const INSTITUTION_ID = 1;

// ── Programs ──────────────────────────────────────────────────────────────────

export async function fetchPrograms(): Promise<Program[]> {
  const data = await gql<{ program: Program[] }>(`
    query GetPrograms {
      program(
        where: { organizationId: { _eq: ${INSTITUTION_ID} }, deleted: { _eq: false } }
        order_by: { name: asc }
      ) {
        id
        name
      }
    }
  `);
  return data.program;
}

// ── Document variables (all, no program filter) ───────────────────────────────

export async function fetchDocumentVariables(): Promise<DocumentVariable[]> {
  const data = await gql<{ document_variable: DocumentVariable[] }>(`
    query GetDocumentVariables {
      document_variable(order_by: { id: asc }) {
        id
        name
        label_en
        type
      }
    }
  `);
  return data.document_variable;
}

// ── Program expressions (formulas) ───────────────────────────────────────────

export async function fetchProgramExpressions(programId: number): Promise<ProgramExpression[]> {
  const data = await gql<{ program_expression: ProgramExpression[] }>(
    `
    query GetProgramExpressions($programId: Int!) {
      program_expression(
        where: { programId: { _eq: $programId }, deleted: { _eq: false } }
        order_by: { name: asc }
      ) {
        id
        name
      }
    }
  `,
    { programId }
  );
  return data.program_expression;
}

// ── Conditional expressions ───────────────────────────────────────────────────

export async function fetchConditionalExpressions(
  programId: number
): Promise<ProgramConditionalExpression[]> {
  const data = await gql<{ program_conditional_expression: ProgramConditionalExpression[] }>(
    `
    query GetConditionalExpressions($programId: Int!) {
      program_conditional_expression(
        where: { programId: { _eq: $programId }, deleted: { _eq: false } }
        order_by: { name: asc }
      ) {
        id
        name
      }
    }
  `,
    { programId }
  );
  return data.program_conditional_expression;
}

// ── Courses with gradebook columns ───────────────────────────────────────────

export async function fetchProgramCourses(programId: number): Promise<CourseWithGrades[]> {
  const data = await gql<{
    program_page_course: {
      id: number;
      courseId: number;
      course: { id: number; title: string };
      program_page_course_gradebook_templates: {
        gradebookTemplateId: number;
        gradebook_template: {
          id: number;
          name: string;
          gradebook_template_columns: { id: number; name: string }[];
          gradebook_template_computed_columns: { id: number; name: string }[];
        };
      }[];
    }[];
  }>(
    `
    query GetProgramCourses($programId: Int!) {
      program_page_course(
        where: { programId: { _eq: $programId }, deleted: { _eq: false } }
        order_by: { course: { title: asc } }
      ) {
        id
        courseId
        course { id title }
        program_page_course_gradebook_templates {
          gradebookTemplateId
          gradebook_template {
            id
            name
            gradebook_template_columns(order_by: { name: asc }) { id name }
            gradebook_template_computed_columns(order_by: { name: asc }) { id name }
          }
        }
      }
    }
  `,
    { programId }
  );

  // Deduplicate by courseId, flatten columns
  const seen = new Set<number>();
  const result: CourseWithGrades[] = [];

  for (const ppc of data.program_page_course) {
    if (seen.has(ppc.courseId)) continue;
    seen.add(ppc.courseId);

    const columns = ppc.program_page_course_gradebook_templates.flatMap((tpl) => [
      ...tpl.gradebook_template.gradebook_template_columns.map((c) => ({
        id: c.id,
        name: c.name,
        isComputed: false,
      })),
      ...tpl.gradebook_template.gradebook_template_computed_columns.map((c) => ({
        id: c.id,
        name: c.name,
        isComputed: true,
      })),
    ]);

    result.push({
      id: ppc.id,
      courseId: ppc.courseId,
      courseTitle: ppc.course.title,
      gradebookTemplateId:
        ppc.program_page_course_gradebook_templates[0]?.gradebookTemplateId ?? null,
      columns,
    });
  }

  return result;
}
