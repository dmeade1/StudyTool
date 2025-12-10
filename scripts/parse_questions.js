
import fs from 'fs';
import path from 'path';

const RAW_DIR = path.join(process.cwd(), 'src/data/raw');
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/questions.json');

// Expected counts per module for validation
const EXPECTED_COUNTS = {
    '1-3': 20,
    '4-6': 16,
    '7-8': 21,
    '9-11': 34
};

function parseModules7_8(content) {
    const questions = [];

    // Split into Questions and Answers
    const answerHeaderMatch = content.match(/\nAnswers\s*\n/);
    let questionSection = content;
    let answerSection = '';

    if (answerHeaderMatch) {
        questionSection = content.substring(0, answerHeaderMatch.index);
        answerSection = content.substring(answerHeaderMatch.index + answerHeaderMatch[0].length);
    }

    // Question 1 uses bullet point format at line 5
    // Lines 5: "• Why do economists..."
    const bulletMatch = questionSection.match(/•\s+(Why do economists[^\n]+)/);
    if (bulletMatch) {
        questions.push({
            id: 'mod7-8-1',
            number: 1,
            question: bulletMatch[1].trim(),
            options: [],
            answer: null,
            explanation: 'See class notes/discussion.'
        });
    }

    // Questions 2-21 use standard numbering
    const qRegex = /^\s*(\d+)\.\s*(.+)/gm;
    let match;
    const qMatches = [];

    while ((match = qRegex.exec(questionSection)) !== null) {
        const num = parseInt(match[1]);
        if (num >= 2 && num <= 21) {
            qMatches.push({
                num,
                text: match[2].trim(),
                index: match.index
            });
        }
    }

    // Deduplicate
    const seen = new Set([1]); // already have Q1
    for (const q of qMatches) {
        if (seen.has(q.num)) continue;
        seen.add(q.num);

        // Find options for this question if they exist
        const nextQ = qMatches.find(x => x.num === q.num + 1);
        const endIdx = nextQ ? nextQ.index : questionSection.length;
        const block = questionSection.substring(q.index, endIdx);

        const options = [];
        const optRegex = /^\s*([a-e])[\.\)]\s*(.+)/gm;
        let optMatch;
        while ((optMatch = optRegex.exec(block)) !== null) {
            options.push({ label: optMatch[1].toLowerCase(), text: optMatch[2].trim() });
        }

        questions.push({
            id: 'mod7-8-' + q.num,
            number: q.num,
            question: q.text,
            options,
            answer: null,
            explanation: ''
        });
    }

    // Parse answers
    const aRegex = /^\s*(\d+)\.\s*(.+)/gm;
    let aMatch;
    while ((aMatch = aRegex.exec(answerSection)) !== null) {
        const num = parseInt(aMatch[1]);
        const text = aMatch[2].trim();
        const q = questions.find(x => x.number === num);
        if (q) {
            const letterMatch = text.match(/^([a-e])\b/i);
            if (letterMatch) {
                q.answer = letterMatch[1].toLowerCase();
                q.explanation = text.substring(letterMatch[0].length).trim();
            } else {
                q.explanation = text;
            }
        }
    }

    return questions;
}

function parseModules9_11(content) {
    const questions = [];

    // Split into Questions and Answers
    const answerHeaderMatch = content.match(/\nAnswers\s*\n/);
    let questionSection = content;
    let answerSection = '';

    if (answerHeaderMatch) {
        questionSection = content.substring(0, answerHeaderMatch.index);
        answerSection = content.substring(answerHeaderMatch.index + answerHeaderMatch[0].length);
    }

    // Questions 1-20 are standard
    const qRegex = /^\s*(\d+)\.\s+(.+)/gm;
    let match;
    const seen = new Set();

    while ((match = qRegex.exec(questionSection)) !== null) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 20 && !seen.has(num)) {
            seen.add(num);

            // Find block end
            const nextMatch = new RegExp(`^\\s*${num + 1}\\.\\s+`, 'm');
            const restContent = questionSection.substring(match.index + match[0].length);
            const nextIdx = restContent.search(nextMatch);
            const block = nextIdx > 0 ? restContent.substring(0, nextIdx) : restContent.substring(0, 500);

            // Extract options
            const options = [];
            const optRegex = /^([a-e])[\.\)]\s+(.+)/gm;
            let optMatch;
            while ((optMatch = optRegex.exec(block)) !== null) {
                options.push({ label: optMatch[1].toLowerCase(), text: optMatch[2].trim() });
            }

            questions.push({
                id: 'mod9-11-' + num,
                number: num,
                question: match[2].trim(),
                options,
                answer: null,
                explanation: ''
            });
        }
    }

    // Questions 21-26 are grouped as "21-26. The following tables..."
    const q21_26Match = questionSection.match(/21-26\.\s+(.+?)(?=27-33|$)/s);
    if (q21_26Match) {
        for (let i = 21; i <= 26; i++) {
            questions.push({
                id: 'mod9-11-' + i,
                number: i,
                question: `Exercise ${i}: Triangular arbitrage analysis - Identify quoted cross rate bank, solve implied cross rate, and determine buy/sell currency.`,
                options: [],
                answer: null,
                explanation: ''
            });
        }
    }

    // Questions 27-33 
    const q27_33Match = questionSection.match(/27-33\.\s+(.+?)(?=34\.|$)/s);
    if (q27_33Match) {
        for (let i = 27; i <= 33; i++) {
            questions.push({
                id: 'mod9-11-' + i,
                number: i,
                question: `Exercise ${i}: Calculate triangular arbitrage profit starting with $5,750,000, showing each step.`,
                options: [],
                answer: null,
                explanation: ''
            });
        }
    }

    // Question 34 is standalone
    const q34Match = questionSection.match(/34\.\s+(.+?)(?=Answers|$)/s);
    if (q34Match) {
        questions.push({
            id: 'mod9-11-34',
            number: 34,
            question: q34Match[1].trim().split('\n')[0],
            options: [],
            answer: null,
            explanation: ''
        });
    }

    // Parse answers
    const aRegex = /^\s*(\d+)\.\s*(.+)/gm;
    let aMatch;
    while ((aMatch = aRegex.exec(answerSection)) !== null) {
        const num = parseInt(aMatch[1]);
        const text = aMatch[2].trim();
        const q = questions.find(x => x.number === num);
        if (q) {
            const letterMatch = text.match(/^([a-e])\b/i);
            if (letterMatch) {
                q.answer = letterMatch[1].toLowerCase();
                q.explanation = text.substring(letterMatch[0].length).trim();
            } else {
                q.explanation = text;
            }
        }
    }

    return questions;
}

function parseStandardFile(filename, content, moduleRange) {
    const questions = [];

    // Split into Questions and Answers
    const answerHeaderMatch = content.match(/\nAnswers\s*\n/);
    let questionSection = content;
    let answerSection = '';

    if (answerHeaderMatch) {
        questionSection = content.substring(0, answerHeaderMatch.index);
        answerSection = content.substring(answerHeaderMatch.index + answerHeaderMatch[0].length);
    }

    const qRegex = /^\s*(\d+)\.\s+(.+)/gm;
    let match;
    const seen = new Set();
    const qMatches = [];

    while ((match = qRegex.exec(questionSection)) !== null) {
        const num = parseInt(match[1]);
        if (!seen.has(num)) {
            seen.add(num);
            qMatches.push({
                num,
                text: match[2].trim(),
                index: match.index,
                length: match[0].length
            });
        }
    }

    for (let i = 0; i < qMatches.length; i++) {
        const q = qMatches[i];
        const nextQ = qMatches[i + 1];
        const endIdx = nextQ ? nextQ.index : questionSection.length;
        const block = questionSection.substring(q.index + q.length, endIdx);

        const options = [];
        const optRegex = /^\s*([a-e])[\.\)]\s+(.+)/gm;
        let optMatch;
        while ((optMatch = optRegex.exec(block)) !== null) {
            options.push({ label: optMatch[1].toLowerCase(), text: optMatch[2].trim() });
        }

        questions.push({
            id: `${moduleRange}-${q.num}`,
            number: q.num,
            question: q.text,
            options,
            answer: null,
            explanation: ''
        });
    }

    // Parse answers
    const aRegex = /^\s*(\d+)\.\s*(.+)/gm;
    let aMatch;
    while ((aMatch = aRegex.exec(answerSection)) !== null) {
        const num = parseInt(aMatch[1]);
        const text = aMatch[2].trim();
        const q = questions.find(x => x.number === num);
        if (q) {
            const letterMatch = text.match(/^([a-e])\b/i);
            const tfMatch = text.match(/^(True|False)/i);
            if (letterMatch) {
                q.answer = letterMatch[1].toLowerCase();
                q.explanation = text.substring(letterMatch[0].length).trim();
            } else if (tfMatch) {
                q.answer = tfMatch[1].toLowerCase();
                q.explanation = text.substring(tfMatch[0].length).trim();
                q.type = 'true-false';
            } else {
                q.explanation = text;
            }
        }
    }

    return questions;
}

const allQuestions = [];

// Process each file with appropriate parser
const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.txt'));

for (const f of files) {
    const content = fs.readFileSync(path.join(RAW_DIR, f), 'utf-8');
    const modMatch = f.match(/Modules\s+([\d\s-]+)/i);
    const moduleRange = modMatch ? modMatch[1].replace(/\s/g, '') : 'Unknown';

    let qs;
    if (moduleRange === '7-8') {
        qs = parseModules7_8(content);
    } else if (moduleRange === '9-11') {
        qs = parseModules9_11(content);
    } else {
        qs = parseStandardFile(f, content, moduleRange);
    }

    qs.forEach(q => q.module = moduleRange);

    console.log(`${f}: Parsed ${qs.length} questions (Expected: ${EXPECTED_COUNTS[moduleRange] || 'N/A'})`);
    allQuestions.push(...qs);
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions, null, 2));
console.log(`\nTotal: ${allQuestions.length} questions parsed.`);
console.log(`Expected Total: ${Object.values(EXPECTED_COUNTS).reduce((a, b) => a + b, 0)}`);
