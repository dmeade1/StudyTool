
import fs from 'fs';
import path from 'path';

const RAW_DIR = path.join(process.cwd(), 'src/data/raw');
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/questions.json');

function parseFile(filename) {
    const content = fs.readFileSync(path.join(RAW_DIR, filename), 'utf-8');
    
    // Split into Questions and Answers
    // Common delimiters seen: "Answers", "Answers are at the end"
    const splitRegex = /\nAnswers\s*\n|Answers are at the end/i;
    const parts = content.split(splitRegex);
    
    // If we have "Answers are at the end" at top, it might split there
    // We want the LAST split usually, or distinct sections.
    // The file seems to have "Answers are at the end..." at line 2 usually.
    // And actual "Answers" header later.
    
    // Let's look for the *last* occurrence of "Answers" on its own line if possible.
    // Or scan for lines starting with "1." after a significant gap.
    
    let questionSection = content;
    let answerSection = '';

    const answerHeaderMatch = content.match(/\nAnswers\s*\n/);
    if (answerHeaderMatch) {
        const idx = answerHeaderMatch.index;
        questionSection = content.substring(0, idx);
        answerSection = content.substring(idx + answerHeaderMatch[0].length);
    }

    // Normalize
    questionSection = questionSection.replace(/\r/g, '');
    answerSection = answerSection.replace(/\r/g, '');

    // Extract Modules if present
    // "Module 9: Exercises..."
    // We can try to tag questions with modules.
    
    // Strategy: Split by "Number." 
    const questions = [];
    
    // Regex for start of question: "1. ", "2. "
    // Note: Some files span modules.
    
    const qRegex = /^\s*(\d+)\.\s+(.*)$/gm;
    let match;
    const qMatches = [];
    while ((match = qRegex.exec(questionSection)) !== null) {
        qMatches.push({
            num: parseInt(match[1]),
            text: match[2], // Start of text
            index: match.index,
            fullMatch: match[0]
        });
    }

    for (let i = 0; i < qMatches.length; i++) {
        const start = qMatches[i].index;
        const end = (i < qMatches.length - 1) ? qMatches[i+1].index : questionSection.length;
        
        const fullBlock = questionSection.substring(start, end);
        // Remove the "1. " part from the parsing logic to get options
        
        // Extract options a. b. c. d.
        // Regex: /^\s*([a-e])\.\s+(.*)$/gm
        const options = [];
        const optRegex = /^\s*([a-e])\.\s+(.*)$/gm;
        let optMatch;
        // Text part is everything before the first option?
        // Or all text lines that don't match option regex?
        
        const lines = fullBlock.split('\n');
        let questionText = '';
        let currentOption = null;
        
        lines.forEach((line, idx) => {
            if (idx === 0) {
                 // First line is "1. Text..."
                 // qMatches[i].fullMatch handles the number removal if we want
                 // But fullBlock includes it.
                 // let's use the matched text from qMatch[i].text
                 questionText += qMatches[i].text;
                 return;
            }
            
            const optM = /^\s*([a-e])\.\s+(.*)$/i.exec(line);
            if (optM) {
                if (currentOption) options.push(currentOption);
                currentOption = { label: optM[1].toLowerCase(), text: optM[2] };
            } else if (currentOption) {
                currentOption.text += ' ' + line.trim();
            } else {
                questionText += ' ' + line.trim();
            }
        });
        if (currentOption) options.push(currentOption);
        
        questions.push({
            id: filename + '-' + qMatches[i].num,
            number: qMatches[i].num,
            question: questionText.trim(),
            options: options,
            answer: null // To be filled
        });
    }
    
    // Parse Answers
    // Format: "1. a" or "1. Explanation..."
    const aRegex = /^\s*(\d+)\.\s+(.*)$/gm;
    let aMatch;
    while ((aMatch = aRegex.exec(answerSection)) !== null) {
        const num = parseInt(aMatch[1]);
        const text = aMatch[2].trim();
        
        // Find corresponding question
        const q = questions.find(q => q.number === num);
        if (q) {
            // Try to extract just the letter if simple
            const letterMatch = text.match(/^([a-e])\b/i);
            
            // Or "False. Explanation"
            const trueFalseMatch = text.match(/^(True|False)/i);

            if (letterMatch) {
                q.answer = letterMatch[1].toLowerCase();
                q.explanation = text.substring(letterMatch[0].length).trim();
            } else if (trueFalseMatch) {
                q.answer = trueFalseMatch[1].toLowerCase(); // 'true' or 'false'
                q.explanation = text.substring(trueFalseMatch[0].length).trim();
                q.type = 'true-false';
            } else {
                q.explanation = text;
            }
        }
    }
    
    return questions;
}

const allQuestions = [];
const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.txt'));

files.forEach(f => {
    try {
        const qs = parseFile(f);
        // Identify Module from filename
        // "Independent Practice Questions for Modules 1 - 3 .txt"
        // Regex to extract "1 - 3" or "4-6"
        const modMatch = f.match(/Modules\s+([\d\s-]+)/i);
        let moduleRange = 'Unknown';
        if (modMatch) moduleRange = modMatch[1].replace(/\s/g, '');
        
        qs.forEach(q => q.module = moduleRange);
        allQuestions.push(...qs);
    } catch (e) {
        console.error("Error parsing " + f, e);
    }
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions, null, 2));
console.log(`Parsed ${allQuestions.length} questions.`);
