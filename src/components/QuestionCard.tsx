
import React, { useState } from 'react';

interface Option {
    label: string;
    text: string;
}

interface QuestionData {
    id: string;
    number: number;
    question: string;
    options: Option[];
    subQuestions?: Option[];
    answer: string | null;
    explanation?: string;
    type?: string;
}

interface QuestionProps {
    question: QuestionData;
    onAnswer: (isCorrect: boolean) => void;
    onNext: () => void;
}

const QuestionCard: React.FC<QuestionProps> = ({ question, onAnswer, onNext }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const isMultipleChoice = question.type === 'multiple-choice';
    const isMultiPart = question.type === 'multi-part';
    const isOpenEnded = question.type === 'open-ended' || question.type === 'true-false';

    const handleOptionClick = (label: string) => {
        if (revealed) return;
        setSelectedOption(label);

        if (question.answer && isMultipleChoice) {
            const correct = label.toLowerCase() === question.answer.toLowerCase();
            setIsCorrect(correct);
            setRevealed(true);
            onAnswer(correct);
        }
    };

    const handleReveal = () => {
        setRevealed(true);
    };

    const handleSelfAssess = (correct: boolean) => {
        setIsCorrect(correct);
        onAnswer(correct);
    };

    const getTypeLabel = () => {
        switch (question.type) {
            case 'multiple-choice': return 'MULTIPLE CHOICE';
            case 'multi-part': return 'MULTI-PART';
            case 'true-false': return 'TRUE/FALSE';
            default: return 'OPEN RESPONSE';
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--color-nebula-light)' }}>
                <span>MISSION DATA #{question.number}</span>
                <span>TYPE: {getTypeLabel()}</span>
            </div>

            <h2 style={{ fontSize: '1.4rem', lineHeight: '1.6', marginBottom: '2rem', whiteSpace: 'pre-wrap' }}>
                {question.question}
            </h2>

            {/* Sub-Questions for Multi-Part */}
            {isMultiPart && question.subQuestions && question.subQuestions.length > 0 && (
                <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(109, 40, 217, 0.1)', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-nebula-light)' }}>Answer Each Part:</h4>
                    {question.subQuestions.map((sq) => (
                        <div key={sq.label} style={{ marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid var(--color-nebula)' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>{sq.label.toUpperCase()}.</span> {sq.text}
                        </div>
                    ))}
                </div>
            )}

            {/* Multiple Choice Options */}
            {isMultipleChoice && question.options.length > 0 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {question.options.map((opt) => {
                        let bg = 'rgba(255,255,255,0.05)';
                        if (revealed) {
                            if (question.answer && opt.label.toLowerCase() === question.answer.toLowerCase()) {
                                bg = 'rgba(16, 185, 129, 0.3)';
                                if (selectedOption === opt.label) bg = 'rgba(16, 185, 129, 0.5)';
                            } else if (selectedOption === opt.label) {
                                bg = 'rgba(239, 68, 68, 0.3)';
                            }
                        } else if (selectedOption === opt.label) {
                            bg = 'var(--color-nebula)';
                        }

                        return (
                            <button
                                key={opt.label}
                                className="btn"
                                style={{
                                    background: bg,
                                    textAlign: 'left',
                                    border: '1px solid var(--color-glass-border)'
                                }}
                                onClick={() => handleOptionClick(opt.label)}
                                disabled={revealed}
                            >
                                <span style={{ fontWeight: 'bold', marginRight: '1rem', textTransform: 'uppercase' }}>{opt.label}.</span>
                                {opt.text}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Reveal Button for Open-Ended and Multi-Part */}
            {(isOpenEnded || isMultiPart) && !revealed && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button className="btn" onClick={handleReveal}>
                        {isMultiPart ? 'Show Answer Key' : 'Reveal Answer'}
                    </button>
                </div>
            )}

            {/* Explanation / Result */}
            {revealed && (
                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: '4px solid var(--color-nebula)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-nebula-light)' }}>
                        {isCorrect === true ? '✓ EXCELLENT WORK' : isCorrect === false ? '✗ MISSION FAILED' : '📋 ANSWER KEY'}
                    </h4>

                    <p style={{ fontStyle: 'italic', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                        {question.explanation || "Review your notes and compare your answer."}
                    </p>

                    {/* Self-Assessment for non-multiple-choice */}
                    {!isMultipleChoice && isCorrect === null && (
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
                            <button className="btn" style={{ background: 'var(--color-danger)' }} onClick={() => handleSelfAssess(false)}>I Missed It</button>
                            <button className="btn" style={{ background: 'var(--color-accent)' }} onClick={() => handleSelfAssess(true)}>I Got It</button>
                        </div>
                    )}

                    {isCorrect !== null && (
                        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                            <button className="btn" onClick={onNext} style={{ background: 'white', color: 'black' }}>Next Mission &rarr;</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuestionCard;
