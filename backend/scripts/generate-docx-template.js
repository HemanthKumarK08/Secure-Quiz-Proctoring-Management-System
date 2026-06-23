import { Document, Packer, Paragraph, TextRun } from "docx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: "Question: What is DBMS?", bold: true }),
          ],
        }),
        new Paragraph("A) Software"),
        new Paragraph("B) Hardware"),
        new Paragraph("C) Network"),
        new Paragraph("D) Operating System"),
        new Paragraph("Answer: A"),
        new Paragraph(""), // empty line separator
        new Paragraph({
          children: [
            new TextRun({ text: "Question: Java is a ?", bold: true }),
          ],
        }),
        new Paragraph("A) Language"),
        new Paragraph("B) Browser"),
        new Paragraph("C) Operating System"),
        new Paragraph("D) Database"),
        new Paragraph("Answer: A"),
      ],
    },
  ],
});

const outputDir = path.join(__dirname, "../templates");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, "question_template.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Successfully generated DOCX template at: ${outputPath}`);
}).catch((err) => {
  console.error("Error generating DOCX template:", err);
  process.exit(1);
});
