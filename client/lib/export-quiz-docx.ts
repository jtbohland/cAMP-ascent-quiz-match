import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

export interface QuizQuestion {
  question_index: number;
  question_type: string;
  question_text: string;
  options?: unknown;
  correct_answer?: unknown;
  explanation: string | null;
  pairs?: unknown;
}

const TYPE_LABELS: Record<string, string> = {
  mc: "Multiple Choice",
  tf: "True or False",
  fill: "Fill in the Blank",
  match: "Matching",
};

const BORDER = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "999999",
};
const CELL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function getCorrectAnswerText(q: QuizQuestion): string {
  const options = Array.isArray(q.options) ? q.options as string[] : [];
  const pairs = Array.isArray(q.pairs) ? q.pairs as Array<{ term: string; match: string }> : [];

  if (q.question_type === "fill") {
    const arr = q.correct_answer;
    return Array.isArray(arr) ? arr.join(" / ") : String(q.correct_answer ?? "");
  }
  if (q.question_type === "match") {
    return pairs.map((p) => `${p.term} → ${p.match}`).join("\n");
  }
  const idx = typeof q.correct_answer === "string" ? parseInt(q.correct_answer, 10) : Number(q.correct_answer);
  if (options.length > 0 && !isNaN(idx) && idx >= 0 && idx < options.length) {
    return options[idx];
  }
  return String(q.correct_answer ?? "");
}

function buildQuestionSection(q: QuizQuestion): Paragraph[] {
  const elements: Paragraph[] = [];
  const typeLabel = TYPE_LABELS[q.question_type] ?? q.question_type;
  const options = Array.isArray(q.options) ? q.options as string[] : [];
  const pairs = Array.isArray(q.pairs) ? q.pairs as Array<{ term: string; match: string }> : [];

  // Question header
  elements.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Question ${q.question_index}`, bold: true, size: 24 }),
        new TextRun({ text: `  (${typeLabel})`, italics: true, size: 20, color: "666666" }),
      ],
      spacing: { before: 400, after: 100 },
    })
  );

  // Question text
  elements.push(
    new Paragraph({
      children: [new TextRun({ text: q.question_text, size: 22 })],
      spacing: { after: 150 },
    })
  );

  // Answer choices / pairs
  if (q.question_type === "mc" || q.question_type === "tf") {
    const correctIdx = typeof q.correct_answer === "string" ? parseInt(q.correct_answer, 10) : Number(q.correct_answer);
    options.forEach((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      const isCorrect = i === correctIdx;
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${letter}) ${opt}`,
              bold: isCorrect,
              size: 20,
              color: isCorrect ? "1a7f37" : "333333",
            }),
            ...(isCorrect ? [new TextRun({ text: "  ✓ Correct", bold: true, size: 18, color: "1a7f37" })] : []),
          ],
          indent: { left: 360 },
          spacing: { after: 60 },
        })
      );
    });
  } else if (q.question_type === "fill") {
    const answers = Array.isArray(q.correct_answer) ? (q.correct_answer as string[]) : [String(q.correct_answer)];
    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Accepted answers: ", bold: true, size: 20 }),
          new TextRun({ text: answers.join("  /  "), size: 20, color: "1a7f37" }),
        ],
        indent: { left: 360 },
        spacing: { after: 60 },
      })
    );
  } else if (q.question_type === "match" && pairs.length > 0) {
    elements.push(
      new Paragraph({
        children: [new TextRun({ text: "Match pairs:", bold: true, size: 20 })],
        indent: { left: 360 },
        spacing: { after: 80 },
      })
    );
    pairs.forEach((p) => {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({ text: p.term, bold: true, size: 20 }),
            new TextRun({ text: "  →  ", size: 20, color: "999999" }),
            new TextRun({ text: p.match, size: 20, color: "1a7f37" }),
          ],
          indent: { left: 720 },
          spacing: { after: 40 },
        })
      );
    });
  }

  // Explanation
  if (q.explanation) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Explanation: ", bold: true, size: 18, color: "666666" }),
          new TextRun({ text: q.explanation, italics: true, size: 18, color: "666666" }),
        ],
        spacing: { before: 100, after: 100 },
        indent: { left: 360 },
      })
    );
  }

  // Separator
  elements.push(new Paragraph({ text: "", spacing: { after: 100 } }));

  return elements;
}

export async function exportQuizToDocx(
  quizId: string,
  quizTopic: string,
  dayLabel: string,
  questions: QuizQuestion[]
): Promise<void> {
  const sorted = [...questions].sort((a, b) => a.question_index - b.question_index);

  const doc = new Document({
    sections: [
      {
        children: [
          // Title
          new Paragraph({
            children: [new TextRun({ text: `${dayLabel}: ${quizTopic}`, bold: true, size: 32 })],
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 100 },
          }),
          // Subtitle
          new Paragraph({
            children: [
              new TextRun({ text: "cAMP Ascent Quiz — SME Audit Document", size: 22, color: "666666" }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `${sorted.length} questions  •  Quiz ID: ${quizId}`, size: 18, color: "999999" }),
            ],
            spacing: { after: 100 },
          }),
          // Instructions
          new Paragraph({
            children: [
              new TextRun({
                text: "Review each question below. To submit edits, copy your changes back into the audit app.",
                size: 20,
                italics: true,
                color: "996600",
              }),
            ],
            spacing: { after: 300 },
          }),
          // Questions
          ...sorted.flatMap((q) => buildQuestionSection(q)),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${quizId}-${quizTopic.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.docx`;
  saveAs(blob, filename);
}
