/* global Word */

import type { PlaceholderVariable } from "../types/variable";

export async function insertVariableIntoWord(variable: PlaceholderVariable): Promise<void> {
  await Word.run(async (context) => {
    const selection = context.document.getSelection();

    // Step 1: Create content control at cursor and attach metadata
    const contentControl = selection.insertContentControl();
    contentControl.title = variable.label;
    contentControl.tag = JSON.stringify(variable.metadata);
    contentControl.appearance = Word.ContentControlAppearance.boundingBox;

    // Sync to commit the content control before inserting text into it
    await context.sync();

    // Step 2: Insert placeholder text inside the content control
    contentControl.insertText(variable.placeholder, Word.InsertLocation.replace);

    await context.sync();
  });
}