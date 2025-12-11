
import fs from 'fs';
import path from 'path';

const RAW_DIR = path.join(process.cwd(), 'src/data/raw');
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/questions.json');

const EXPECTED_COUNTS = {
    '1-3': 20,
    '4-6': 16,
    '7-8': 21,
    '9-11': 34
};

function areSubQuestions(items) {
    if (items.length === 0) return false;
    const questionIndicators = ['what', 'how', 'by what', 'by how', 'calculate', 'which', 'why', 'explain'];
    let questionCount = 0;
    let totalLength = 0;
    for (const item of items) {
        const textLower = item.text.toLowerCase();
        totalLength += item.text.length;
        if (questionIndicators.some(q => textLower.includes(q)) || item.text.includes('?')) {
            questionCount++;
        }
    }
    const avgLength = totalLength / items.length;
    return questionCount >= items.length * 0.5 || avgLength > 80;
}

/**
 * Parse answer section into blocks - each block is all content from one numbered answer to the next
 */
function parseAnswerBlocks(answerSection) {
    const blocks = {};
    const aRegex = /^\s*(\d+)\.\s*/gm;
    const matches = [];
    let match;

    while ((match = aRegex.exec(answerSection)) !== null) {
        matches.push({ num: parseInt(match[1]), index: match.index, length: match[0].length });
    }

    // Deduplicate by number (keep first occurrence)
    const seen = new Set();
    const uniqueMatches = matches.filter(m => {
        if (seen.has(m.num)) return false;
        seen.add(m.num);
        return true;
    });

    for (let i = 0; i < uniqueMatches.length; i++) {
        const m = uniqueMatches[i];
        const startIdx = m.index + m.length;
        const endIdx = (i < uniqueMatches.length - 1) ? uniqueMatches[i + 1].index : answerSection.length;
        const block = answerSection.substring(startIdx, endIdx).trim();
        blocks[m.num] = block;
    }

    return blocks;
}

/**
 * Format an answer block that may contain multiple sub-parts
 */
function formatAnswerBlock(block, questionType) {
    // For multiple choice, extract just the letter answer
    if (questionType === 'multiple-choice') {
        const letterMatch = block.match(/^([a-e])\b/i);
        if (letterMatch) {
            return {
                answer: letterMatch[1].toLowerCase(),
                explanation: block.substring(letterMatch[0].length).trim()
            };
        }
    }

    // For true-false
    const tfMatch = block.match(/^(True|False)/i);
    if (tfMatch) {
        return {
            answer: tfMatch[1].toLowerCase(),
            explanation: block.substring(tfMatch[0].length).trim(),
            type: 'true-false'
        };
    }

    // For multi-part or open-ended, format the whole block
    // Replace tabs and multiple spaces with single space, but preserve line structure
    let formatted = block
        .replace(/\t+/g, ' ')
        .replace(/  +/g, ' ')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');

    return { explanation: formatted };
}

function parseModules7_8(content) {
    const questions = [];

    const answerHeaderMatch = content.match(/\nAnswers\s*\n/);
    let questionSection = content;
    let answerSection = '';

    if (answerHeaderMatch) {
        questionSection = content.substring(0, answerHeaderMatch.index);
        answerSection = content.substring(answerHeaderMatch.index + answerHeaderMatch[0].length);
    }

    const answerBlocks = parseAnswerBlocks(answerSection);

    // Question 1 uses bullet point format
    const bulletMatch = questionSection.match(/•\s+(Why do economists[^\n]+)/);
    if (bulletMatch) {
        questions.push({
            id: 'mod7-8-1',
            number: 1,
            question: bulletMatch[1].trim(),
            options: [],
            subQuestions: [],
            answer: null,
            explanation: answerBlocks[1] || 'See class notes/discussion.',
            type: 'open-ended'
        });
    }

    // Questions 2-21
    const qRegex = /^\s*(\d+)\.\s*(.+)/gm;
    let match;
    const seen = new Set([1]);

    while ((match = qRegex.exec(questionSection)) !== null) {
        const num = parseInt(match[1]);
        if (num >= 2 && num <= 21 && !seen.has(num)) {
            seen.add(num);

            const nextMatch = new RegExp(`^\\s*${num + 1}\\.`, 'm');
            const restContent = questionSection.substring(match.index + match[0].length);
            const nextIdx = restContent.search(nextMatch);
            const block = nextIdx > 0 ? restContent.substring(0, nextIdx) : restContent.substring(0, 500);

            const items = [];
            const optRegex = /^\s*([a-e])[\.\\)]\s*(.+)/gm;
            let optMatch;
            while ((optMatch = optRegex.exec(block)) !== null) {
                items.push({ label: optMatch[1].toLowerCase(), text: optMatch[2].trim() });
            }

            const isSubQ = areSubQuestions(items);
            const qType = items.length > 0 ? (isSubQ ? 'multi-part' : 'multiple-choice') : 'open-ended';

            const answerData = answerBlocks[num] ? formatAnswerBlock(answerBlocks[num], qType) : {};

            questions.push({
                id: 'mod7-8-' + num,
                number: num,
                question: match[2].trim(),
                options: isSubQ ? [] : items,
                subQuestions: isSubQ ? items : [],
                answer: answerData.answer || null,
                explanation: answerData.explanation || '',
                type: answerData.type || qType
            });
        }
    }

    return questions;
}

function parseModules9_11(content) {
    const questions = [];

    const answerHeaderMatch = content.match(/\nAnswers\s*\n/);
    let questionSection = content;
    let answerSection = '';

    if (answerHeaderMatch) {
        questionSection = content.substring(0, answerHeaderMatch.index);
        answerSection = content.substring(answerHeaderMatch.index + answerHeaderMatch[0].length);
    }

    const answerBlocks = parseAnswerBlocks(answerSection);

    // Questions 1-20
    const qRegex = /(?:^|\s)(\d+)\.\s+(.+)/gm;
    let match;
    const seen = new Set();

    while ((match = qRegex.exec(questionSection)) !== null) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 20 && !seen.has(num)) {
            seen.add(num);

            const nextMatch = new RegExp(`^\\s*${num + 1}\\.\\s+`, 'm');
            const restContent = questionSection.substring(match.index + match[0].length);
            const nextIdx = restContent.search(nextMatch);
            const block = nextIdx > 0 ? restContent.substring(0, nextIdx) : restContent.substring(0, 500);

            const items = [];
            const optRegex = /^([a-e])[\.\\)]\s+(.+)/gm;
            let optMatch;
            while ((optMatch = optRegex.exec(block)) !== null) {
                items.push({ label: optMatch[1].toLowerCase(), text: optMatch[2].trim() });
            }

            const isSubQ = areSubQuestions(items);
            const qType = items.length > 0 ? (isSubQ ? 'multi-part' : 'multiple-choice') : 'open-ended';

            const answerData = answerBlocks[num] ? formatAnswerBlock(answerBlocks[num], qType) : {};

            questions.push({
                id: 'mod9-11-' + num,
                number: num,
                question: match[2].trim(),
                options: isSubQ ? [] : items,
                subQuestions: isSubQ ? items : [],
                answer: answerData.answer || null,
                explanation: answerData.explanation || '',
                type: answerData.type || qType
            });
        }
    }

    // Questions 21-26 (grouped)
    for (let i = 21; i <= 26; i++) {
        questions.push({
            id: 'mod9-11-' + i,
            number: i,
            question: `Exercise ${i}: Triangular arbitrage analysis - Identify quoted cross rate bank, solve implied cross rate, and determine buy/sell currency.`,
            options: [],
            subQuestions: [
                { label: 'a', text: 'Which bank offers the "Quoted Cross Rate?"' },
                { label: 'b', text: 'Solve for the implied cross rate using the quotes provided.' },
                { label: 'c', text: 'Comparing the quoted and implied cross rates, which currency do you want to buy/sell?' }
            ],
            answer: null,
            explanation: answerBlocks[i] || '',
            type: 'multi-part'
        });
    }

    // Questions 27-33 (grouped)
    for (let i = 27; i <= 33; i++) {
        questions.push({
            id: 'mod9-11-' + i,
            number: i,
            question: `Exercise ${i}: Calculate triangular arbitrage profit starting with $5,750,000, showing each step in the arbitrage process.`,
            options: [],
            subQuestions: [],
            answer: null,
            explanation: answerBlocks[i] || '',
            type: 'open-ended'
        });
    }

    // Question 34
    questions.push({
        id: 'mod9-11-34',
        number: 34,
        question: 'Doug Bernard specializes in cross-rate arbitrage. Given the quotes: Bank A: CHF/USD = CHF 1.5971/USD, Bank B: AUD/USD = AUD 1.8215/USD, Bank C: AUD/CHF = AUD 1.1440/CHF. Does Doug have an arbitrage opportunity? If so, what steps would he take, and how much would he profit with $1,000,000?',
        options: [],
        subQuestions: [],
        answer: null,
        explanation: answerBlocks[34] || '',
        type: 'open-ended'
    });

    return questions;
}

function parseStandardFile(filename, content, moduleRange) {
    const questions = [];

    const answerHeaderMatch = content.match(/\nAnswers\s*\n/i);
    let questionSection = content;
    let answerSection = '';

    if (answerHeaderMatch) {
        questionSection = content.substring(0, answerHeaderMatch.index);
        answerSection = content.substring(answerHeaderMatch.index + answerHeaderMatch[0].length);
    }

    const answerBlocks = parseAnswerBlocks(answerSection);

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

        // Check for uppercase items (A), B), C)) which are part of the question, not options
        const uppercaseItems = [];
        const uppercaseRegex = /^\s*([A-C])\)\s*(.+)/gm;
        let upperMatch;
        while ((upperMatch = uppercaseRegex.exec(block)) !== null) {
            uppercaseItems.push({ label: upperMatch[1], text: upperMatch[2].trim() });
        }

        // Check for lowercase options (a., b., c., d., e.)
        const items = [];
        const optRegex = /^\s*([a-e])[\.\\)]\s+(.+)/gm;
        let optMatch;
        while ((optMatch = optRegex.exec(block)) !== null) {
            items.push({ label: optMatch[1].toLowerCase(), text: optMatch[2].trim() });
        }

        // If we have uppercase items, append them to the question text
        let fullQuestionText = q.text;
        if (uppercaseItems.length > 0) {
            fullQuestionText += '\n' + uppercaseItems.map(item => `${item.label}) ${item.text}`).join('\n');
        }

        const isSubQ = areSubQuestions(items);
        const qType = items.length > 0 ? (isSubQ ? 'multi-part' : 'multiple-choice') : 'open-ended';

        const answerData = answerBlocks[q.num] ? formatAnswerBlock(answerBlocks[q.num], qType) : {};

        questions.push({
            id: `${moduleRange}-${q.num}`,
            number: q.num,
            question: fullQuestionText,
            options: isSubQ ? [] : items,
            subQuestions: isSubQ ? items : [],
            answer: answerData.answer || null,
            explanation: answerData.explanation || '',
            type: answerData.type || qType
        });
    }

    return questions;
}

const allQuestions = [];
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

    const multiPart = qs.filter(q => q.type === 'multi-part').length;
    const mc = qs.filter(q => q.type === 'multiple-choice').length;
    const open = qs.filter(q => q.type === 'open-ended' || q.type === 'true-false').length;

    console.log(`${f}: ${qs.length} questions (MC: ${mc}, Multi-Part: ${multiPart}, Open: ${open})`);
    allQuestions.push(...qs);
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions, null, 2));
console.log(`\nTotal: ${allQuestions.length} questions parsed.`);
