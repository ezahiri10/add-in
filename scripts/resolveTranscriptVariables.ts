/**
 * Standalone script: resolves transcript content controls in a .docx file.
 *
 * Usage:
 *   npx ts-node scripts/resolveTranscriptVariables.ts <input.docx>
 *   npm run resolve -- <input.docx>
 *
 * Opens input.docx, finds all content controls whose tag contains
 * VariableMetadata JSON, replaces their text with resolved values,
 * and writes <input>_resolved.docx next to the input file.
 */

import * as fs from "fs";
import * as path from "path";
import PizZip from "pizzip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { resolveVariableValue } from "../src/taskpane/services/variableResolver";
import type { VariableMetadata } from "../src/taskpane/types/variable";

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------


function findFirst(node: Element, tagName: string): Element | null {
  if (node.tagName === tagName) return node;
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === 1) {
      const found = findFirst(child as Element, tagName);
      if (found) return found;
    }
  }
  return null;
}

function findAll(node: Element, tagName: string): Element[] {
  const results: Element[] = [];
  if (node.tagName === tagName) results.push(node);
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === 1) {
      results.push(...findAll(child as Element, tagName));
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Core transform
// ---------------------------------------------------------------------------

function resolveContentControls(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const serializer = new XMLSerializer();

  const sdtElements = findAll(doc.documentElement, "w:sdt");

  for (const sdt of sdtElements) {
    // Read tag value
    const sdtPr = findFirst(sdt, "w:sdtPr");
    if (!sdtPr) continue;

    const tagEl = findFirst(sdtPr, "w:tag");
    if (!tagEl) continue;

    const tagVal = tagEl.getAttribute("w:val");
    if (!tagVal) continue;

    // Parse metadata
    let metadata: VariableMetadata;
    try {
      metadata = JSON.parse(tagVal) as VariableMetadata;
    } catch {
      console.warn("  Skipping control — tag is not valid JSON:", tagVal);
      continue;
    }

    const resolved = resolveVariableValue(metadata);

    // Find sdtContent and all w:t nodes inside it
    const sdtContent = findFirst(sdt, "w:sdtContent");
    if (!sdtContent) continue;

    const textNodes = findAll(sdtContent, "w:t");

    // Replace first w:t with resolved value, clear the rest
    for (let i = 0; i < textNodes.length; i++) {
      const wt = textNodes[i];
      // Remove all child nodes
      while (wt.firstChild) wt.removeChild(wt.firstChild);

      if (i === 0) {
        wt.appendChild(doc.createTextNode(resolved));
        if (resolved.startsWith(" ") || resolved.endsWith(" ")) {
          wt.setAttribute("xml:space", "preserve");
        }
      }
    }

    console.log(`  [${metadata.variableKey}] → "${resolved}"`);
  }

  return serializer.serializeToString(doc);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const [, , inputPath] = process.argv;

  if (!inputPath) {
    console.error("Usage: npx ts-node scripts/resolveTranscriptVariables.ts <input.docx>");
    process.exit(1);
  }

  const resolvedInput = fs.existsSync(inputPath)
    ? inputPath
    : path.resolve(__dirname, inputPath);

  if (!fs.existsSync(resolvedInput)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const dir = path.dirname(resolvedInput);
  const base = path.basename(resolvedInput, ".docx");
  const resolvedOutput = path.join(dir, `${base}_resolved.docx`);

  console.log(`Input:  ${resolvedInput}`);
  console.log(`Output: ${resolvedOutput}`);
  console.log("Resolving content controls...");

  const data = fs.readFileSync(resolvedInput);
  const zip = new PizZip(data);

  const docEntry = zip.file("word/document.xml");
  if (!docEntry) {
    console.error("Not a valid .docx — word/document.xml not found.");
    process.exit(1);
  }

  const originalXml = docEntry.asText();
  const resolvedXml = resolveContentControls(originalXml);

  zip.file("word/document.xml", resolvedXml);

  const output = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(resolvedOutput, output);
  console.log(`Done. Saved to: ${resolvedOutput}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
