/* global Word */

import type { PlaceholderVariable } from "../types/variable";

export async function updateContentControlTag(controlId: number, newTag: object): Promise<void> {
  await Word.run(async (context) => {
    const control = context.document.contentControls.getById(controlId);
    control.tag = JSON.stringify(newTag);
    await context.sync();
  });
}

export async function insertVariableIntoWord(variable: PlaceholderVariable): Promise<void> {
  await Word.run(async (context) => {
    const selection = context.document.getSelection();

    const contentControl = selection.insertContentControl();
    contentControl.title = variable.label;
    contentControl.tag = JSON.stringify(variable.tag);
    contentControl.appearance = Word.ContentControlAppearance.boundingBox;

    await context.sync();

    contentControl.insertText(variable.placeholder, Word.InsertLocation.replace);

    await context.sync();
  });
}
