/** Structural checks only. Authoring context, never file age, selects required mode. */
export type HumanExperienceValidationMode = "required" | "if-present";

export interface DesignBodyFinding {
  code: "hx-section-missing" | "hx-section-count" | "hx-section-position"
    | "hx-impact" | "hx-fields" | "hx-empty-field" | "hx-placeholder";
  field: string;
  message: string;
}

const SECTION = "Human Experience Intent";
const FULL_FIELDS = ["Impact", "Affected humans", "Human goal or effect", "Experience promises", "Complexity kept out of the human path", "Evidence required"];
const NONE_FIELDS = ["Impact", "Reason", "Preserved experience", "Evidence required"];

/** Remove non-body examples while preserving line positions. */
function bodyLines(markdown: string): string[] {
  const lines = markdown.replace(/^\uFEFF/u, "").replace(/\r\n?/gu, "\n").split("\n");
  let fence: { character: string; length: number } | undefined;
  let frontmatter = lines[0] === "---";
  let comment = false;
  return lines.map((line, index) => {
    if (frontmatter) {
      if (index > 0 && /^(---|\.\.\.)\s*$/u.test(line)) frontmatter = false;
      return "";
    }
    if (fence) {
      const close = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/u);
      if (close && close[1][0] === fence.character && close[1].length >= fence.length) fence = undefined;
      return "";
    }
    // Comments are drafting instructions, not field values or section headings.
    let visible = "";
    let rest = line;
    while (rest) {
      if (comment) {
        const end = rest.indexOf("-->");
        if (end < 0) break;
        comment = false;
        rest = rest.slice(end + 3);
      } else {
        const start = rest.indexOf("<!--");
        if (start < 0) { visible += rest; break; }
        visible += rest.slice(0, start);
        comment = true;
        rest = rest.slice(start + 4);
      }
    }
    const open = visible.match(/^ {0,3}(`{3,}|~{3,})(.*)$/u);
    if (open && !(open[1][0] === "`" && open[2].includes("`"))) {
      fence = { character: open[1][0], length: open[1].length };
      return "";
    }
    return visible;
  });
}

export function validateDesignBody(
  markdown: string,
  mode: HumanExperienceValidationMode = "if-present",
): DesignBodyFinding[] {
  const lines = bodyLines(markdown);
  const headings = lines.flatMap((line, index) => {
    const match = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/u);
    return match ? [{ index, level: match[1].length, title: match[2] }] : [];
  });
  const sections = headings.filter((heading) => heading.title === SECTION);
  const findings: DesignBodyFinding[] = [];
  const add = (code: DesignBodyFinding["code"], field: string, message: string) => findings.push({ code, field, message });
  if (sections.length === 0) {
    if (mode === "required") add("hx-section-missing", SECTION, "Add one ## Human Experience Intent section after ## Context and before ## Decision. Use the form for the change's impact.");
    return findings;
  }
  if (sections.length !== 1) {
    add("hx-section-count", SECTION, "Keep exactly one Human Experience Intent section. Remove the duplicate sections.");
    return findings;
  }
  const section = sections[0];
  const context = headings.filter((heading) => heading.level === 2 && heading.title === "Context");
  const decision = headings.filter((heading) => heading.level === 2 && heading.title === "Decision");
  if (section.level !== 2 || context.length !== 1 || decision.length !== 1
    || context[0].index >= section.index || decision[0].index <= section.index) {
    add("hx-section-position", SECTION, "Place ## Human Experience Intent after one ## Context and before one ## Decision.");
  }
  const end = headings.find((heading) => heading.index > section.index && heading.level <= 2)?.index ?? lines.length;
  const content = lines.slice(section.index + 1, end);
  const fields = content.flatMap((line, index) => {
    const match = line.match(/^ {0,3}(?:[-*+]\s+)?(?:\*\*)?([A-Za-z][A-Za-z ]*?)(?:\*\*)?:(?:\*\*)?\s*(.*)$/u);
    return match && [...FULL_FIELDS, ...NONE_FIELDS].includes(match[1]) ? [{ name: match[1], index, value: match[2] }] : [];
  });
  const impacts = fields.filter((field) => field.name === "Impact");
  const impact = impacts.length === 1 ? impacts[0].value.trim().replace(/^`([^`]+)`$/u, "$1") : "";
  const validImpact = ["direct", "indirect", "none"].includes(impact);
  if (!validImpact) add("hx-impact", "Impact", "Set one Impact field to direct, indirect, or none. Choose one value, not a list.");
  const expected = impact === "none" ? NONE_FIELDS : FULL_FIELDS;
  if (validImpact && fields.map((field) => field.name).join("|") !== expected.join("|")) {
    add("hx-fields", SECTION, `Use these fields once, in order, for ${impact}: ${expected.join("; ")}. Remove fields from the other form.`);
  }
  for (const [index, field] of fields.entries()) {
    const value = [field.value, ...content.slice(field.index + 1, fields[index + 1]?.index ?? content.length)].join("\n");
    if (!value.replace(/[`*_\s>#+-]/gu, "")) add("hx-empty-field", field.name, `Fill ${field.name} with the change's actual intent or evidence plan.`);
  }
  if (/\{\{[^}]*\}\}|\b(?:TODO|TBD)\b|<[^>\n]*(?:placeholder|describe|insert)[^>\n]*>/iu.test(content.join("\n"))) {
    add("hx-placeholder", SECTION, "Replace template placeholders in Human Experience Intent with the change's actual intent or evidence plan.");
  }
  return findings;
}
