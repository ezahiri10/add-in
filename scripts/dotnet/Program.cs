/**
 * Standalone script: resolves transcript content controls in a .docx file.
 *
 * Usage:
 *   dotnet run -- <input.docx>
 *
 * Opens input.docx, finds all content controls whose tag contains
 * VariableMetadata JSON, replaces their text with resolved values,
 * and writes <input>_resolved.docx next to the input file.
 */

using System.Text.Json;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using ResolveVariables;

if (args.Length == 0)
{
    Console.Error.WriteLine("Usage: dotnet run -- <input.docx>");
    return 1;
}

// Resolve input path — try as-is, then relative to this script's directory
string inputPath = args[0];
if (!File.Exists(inputPath))
{
    string scriptDir = AppContext.BaseDirectory;
    inputPath = Path.Combine(scriptDir, args[0]);
}

if (!File.Exists(inputPath))
{
    Console.Error.WriteLine($"Input file not found: {args[0]}");
    return 1;
}

inputPath = Path.GetFullPath(inputPath);
string dir = Path.GetDirectoryName(inputPath)!;
string baseName = Path.GetFileNameWithoutExtension(inputPath);
string outputPath = Path.Combine(dir, $"{baseName}_resolved.docx");

Console.WriteLine($"Input:  {inputPath}");
Console.WriteLine($"Output: {outputPath}");
Console.WriteLine("Resolving content controls...");

// Copy input → output, then modify the copy (preserves original)
File.Copy(inputPath, outputPath, overwrite: true);

using WordprocessingDocument doc = WordprocessingDocument.Open(outputPath, isEditable: true);

Body body = doc.MainDocumentPart!.Document.Body!;

foreach (SdtElement sdt in body.Descendants<SdtElement>())
{
    // Read tag value from w:sdtPr/w:tag
    SdtProperties? sdtPr = sdt.GetFirstChild<SdtProperties>();
    Tag? tagEl = sdtPr?.GetFirstChild<Tag>();
    string? tagVal = tagEl?.Val?.Value;

    if (string.IsNullOrEmpty(tagVal)) continue;

    // Parse metadata JSON
    VariableMetadata? metadata;
    try
    {
        metadata = JsonSerializer.Deserialize<VariableMetadata>(tagVal);
    }
    catch (JsonException)
    {
        Console.WriteLine($"  Skipping control — tag is not valid JSON: {tagVal}");
        continue;
    }

    if (metadata is null || string.IsNullOrEmpty(metadata.VariableKey)) continue;

    string resolved = VariableResolver.Resolve(metadata);

    // Replace all w:t text nodes inside w:sdtContent
    // w:sdt can be block-level (SdtContentBlock) or inline (SdtContentRun)
    OpenXmlElement? sdtContent =
        sdt.GetFirstChild<SdtContentBlock>() ??
        (OpenXmlElement?)sdt.GetFirstChild<SdtContentRun>();
    if (sdtContent is null) continue;

    var textNodes = sdtContent.Descendants<Text>().ToList();
    for (int i = 0; i < textNodes.Count; i++)
    {
        if (i == 0)
        {
            textNodes[i].Text = resolved;
            // Preserve leading/trailing spaces
            if (resolved.StartsWith(' ') || resolved.EndsWith(' '))
                textNodes[i].Space = SpaceProcessingModeValues.Preserve;
        }
        else
        {
            textNodes[i].Text = "";
        }
    }

    Console.WriteLine($"  [{metadata.VariableKey}] → \"{resolved}\"");
}

doc.Save();
Console.WriteLine($"Done. Saved to: {outputPath}");
return 0;
