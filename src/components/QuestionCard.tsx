
import React, { useState } from 'react';

interface Option {
    label: string;
    text: string;
}

interface QuestionProps {
    question: {
        id: string;
        number: number;
        question: string;
        options: Option[];
        answer: string | null;
        explanation?: string;
        type?: string;
    };
    onAnswer: (isCorrect: boolean) => void;
    onNext: () => void;
}

const QuestionCard: React.FC<QuestionProps> = ({ question, onAnswer, onNext }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const handleOptionClick = (label: string) => {
        if (revealed) return;
        setSelectedOption(label);

        // Check answer logic if it's multiple choice
        if (question.answer) {
            const correct = label.toLowerCase() === question.answer.toLowerCase();
            setIsCorrect(correct);
            setRevealed(true);
            onAnswer(correct);
        } else {
            // For open ended, just select it? No, if answer is null, we can't auto-grade.
            // Wait, parser puts null if not found.
        }
    };

    const handeReveal = () => {
        setRevealed(true);
        // For self-assessment questions
    };

    const handleSelfAssess = (correct: boolean) => {
        setIsCorrect(correct);
        onAnswer(correct);
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--color-nebula-light)' }}>
                <span>MISSION DATA #{question.number}</span>
                <span>TYPE: {question.options.length > 0 ? 'MULTIPLE CHOICE' : 'OPEN RESPONSE'}</span>
            </div>

            <h2 style={{ fontSize: '1.4rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                {question.question}
            </h2>

            {/* Options */}
            {question.options.length > 0 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {question.options.map((opt) => {
                        let bg = 'rgba(255,255,255,0.05)';
                        if (revealed) {
                            if (question.answer && opt.label.toLowerCase() === question.answer.toLowerCase()) {
                                bg = 'rgba(16, 185, 129, 0.3)'; // Green correct
                                if (selectedOption === opt.label) bg = 'rgba(16, 185, 129, 0.5)';
                            } else if (selectedOption === opt.label) {
                                bg = 'rgba(239, 68, 68, 0.3)'; // Red wrong
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
                                disabled={revealed && !!question.answer}
                            >
                                <span style={{ fontWeight: 'bold', marginRight: '1rem', textTransform: 'uppercase' }}>{opt.label}.</span>
                                {opt.text}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Open Ended / No Options Handling */}
            {question.options.length === 0 && !revealed && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button className="btn" onClick={handeReveal}>Reveal Answer</button>
                </div>
            )}

            {/* Explanation / Result */}
            {revealed && (
                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: '4px solid var(--color-nebula)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-nebula-light)' }}>
                        {isCorrect === true ? 'EXCELLENT WORK' : isCorrect === false ? 'MISSION FAILED' : 'ANALYSIS'}
                    </h4>

                    <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>
                        {question.explanation || "No additional data provided."}
                    </p>

                    {!question.answer && question.options.length === 0 && isCorrect === null && (
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn" style={{ background: 'var(--color-danger)' }} onClick={() => handleSelfAssess(false)}>I Missed It</button>
                            <button className="btn" style={{ background: 'var(--color-accent)' }} onClick={() => handleSelfAssess(true)}>I Got It</button>
                        </div>
                    )}

                    {(isCorrect !== null || question.answer) && (
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
