/**
 * Flattens Plate's nested JSON document into plain text for search and AI
 * prompts. Every leaf node carries a `text` string; everything else nests
 * through `children`.
 */
export function extractPlainText(content: unknown): string {
  if (!Array.isArray(content)) return "";

  const extractText = (node: unknown): string => {
    if (!node || typeof node !== "object") return "";

    const record = node as { text?: unknown; children?: unknown };
    if (typeof record.text === "string") return record.text;
    if (Array.isArray(record.children)) {
      return record.children.map(extractText).join("");
    }
    return "";
  };

  return content.map(extractText).join("\n").trim();
}
