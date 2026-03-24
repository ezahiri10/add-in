/* global Word */

import type { PlaceholderVariable } from "../types/variable";

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
