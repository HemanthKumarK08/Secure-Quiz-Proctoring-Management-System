import mammoth from "mammoth";
import fs from "fs";
import path from "path";

async function test() {
  const docxPath = "/Users/hemanthkumark/Desktop/questions_template.docx";
  if (!fs.existsSync(docxPath)) {
    console.log(`DOCX file not found at: ${docxPath}`);
    return;
  }
  const buffer = fs.readFileSync(docxPath);
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;

  const lines = text.split(/\r?\n/).map(l => l.replace(/[\u200B-\u200D\uFEFF]/g, '').trim());

  let currentQuestion = null;
  let parsedQuestions = [];
  let errors = [];
  let seenQuestions = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Robust question match
    const qMatch = line.match(/^\s*(?:Question\s*(?:\d+)?\s*[:\-]\s*|\d+[\.\)\:\-]\s*)(.*)$/i);
    
    if (qMatch) {
      if (currentQuestion) {
        parseAndAddDocxQuestion(currentQuestion, seenQuestions, parsedQuestions, errors);
      }
      currentQuestion = {
        text: qMatch[1].trim(),
        lines: [],
        lineNum: i + 1
      };
    } else if (currentQuestion) {
      currentQuestion.lines.push(line);
    }
  }

  if (currentQuestion) {
    parseAndAddDocxQuestion(currentQuestion, seenQuestions, parsedQuestions, errors);
  }

  console.log(`PARSED ${parsedQuestions.length} QUESTIONS.`);
  console.log("ERRORS:", errors.length);
}

function parseAndAddDocxQuestion(q, seenQuestions, parsedQuestions, errors) {
  const rowNum = q.lineNum;
  
  // Combine all text under this question block
  const fullText = (q.text + "\n" + q.lines.join("\n")).trim();

  // Regexes for markers
  const regexA = /A\s*[\)\]\.\:\-\]]|\(A\)/i;
  const regexB = /B\s*[\)\]\.\:\-\]]|\(B\)/i;
  const regexC = /C\s*[\)\]\.\:\-\]]|\(C\)/i;
  const regexD = /D\s*[\)\]\.\:\-\]]|\(D\)/i;
  const regexAns = /(?:Correct\s+)?Ans(?:wer)?\s*[\:\-]/i;

  const matchA = fullText.match(regexA);
  const matchB = fullText.match(regexB);
  const matchC = fullText.match(regexC);
  const matchD = fullText.match(regexD);
  const matchAns = fullText.match(regexAns);

  if (!matchA || !matchB || !matchC || !matchD || !matchAns) {
    return;
  }

  const idxA = matchA.index;
  const idxB = matchB.index;
  const idxC = matchC.index;
  const idxD = matchD.index;
  const idxAns = matchAns.index;

  if (!(idxA < idxB && idxB < idxC && idxC < idxD && idxD < idxAns)) {
    return;
  }

  const questionText = fullText.substring(0, idxA).trim();
  const optionAText = fullText.substring(idxA + matchA[0].length, idxB).trim();
  const optionBText = fullText.substring(idxB + matchB[0].length, idxC).trim();
  const optionCText = fullText.substring(idxC + matchC[0].length, idxD).trim();
  const optionDText = fullText.substring(idxD + matchD[0].length, idxAns).trim();
  const answerText = fullText.substring(idxAns + matchAns[0].length).trim();

  if (!questionText || !optionAText || !optionBText || !optionCText || !optionDText || !answerText) {
    return;
  }

  // Get only the first line of the answer text
  let cleanAns = answerText.split(/\r?\n/)[0].trim().replace(/[\)\]\.\s]/g, "").toUpperCase();
  const validAnswers = ["A", "B", "C", "D"];

  if (!validAnswers.includes(cleanAns)) {
    const matchOptA = cleanAns.toLowerCase() === optionAText.toLowerCase();
    const matchOptB = cleanAns.toLowerCase() === optionBText.toLowerCase();
    const matchOptC = cleanAns.toLowerCase() === optionCText.toLowerCase();
    const matchOptD = cleanAns.toLowerCase() === optionDText.toLowerCase();

    if (matchOptA) cleanAns = "A";
    else if (matchOptB) cleanAns = "B";
    else if (matchOptC) cleanAns = "C";
    else if (matchOptD) cleanAns = "D";
    else {
      errors.push(`Row ${rowNum}: Correct Answer does not match any option`);
      return;
    }
  }

  const normQuestion = questionText.toLowerCase();
  if (seenQuestions.has(normQuestion)) {
    errors.push(`Row ${rowNum}: Duplicate Question`);
    return;
  }
  seenQuestions.add(normQuestion);

  parsedQuestions.push({
    question_text: questionText,
    option_a: optionAText,
    option_b: optionBText,
    option_c: optionCText,
    option_d: optionDText,
    correct_option: cleanAns
  });
}

test().catch(console.error);
