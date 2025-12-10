
import React, { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import questions from '../data/questions.json';

interface GameContainerProps {
    moduleId: string;
    onExit: () => void;
}

const GameContainer: React.FC<GameContainerProps> = ({ moduleId, onExit }) => {
    const [queue, setQueue] = useState<typeof questions>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        // Filter and Shuffle questions for the module
        const modQuestions = questions.filter(q => q.module === moduleId);
        // Fisher-Yates shuffle
        for (let i = modQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [modQuestions[i], modQuestions[j]] = [modQuestions[j], modQuestions[i]];
        }
        setQueue(modQuestions);
        setScore(0);
        setStreak(0);
        setCurrentIndex(0);
    }, [moduleId]);

    const handleAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            setScore(prev => prev + 100 + (streak * 10));
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }
    };

    const handleNext = () => {
        if (currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setGameOver(true);
        }
    };

    if (queue.length === 0) {
        return <div className="container" style={{ textAlign: 'center' }}>Loading Mission Data...</div>;
    }

    if (gameOver) {
        return (
            <div className="container animate-float">
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <h1 className="text-gradient">MISSION COMPLETE</h1>
                    <div style={{ fontSize: '4rem', margin: '2rem 0' }}>🏆</div>
                    <h2>Final Score: {score}</h2>
                    <p>Questions Completed: {queue.length}</p>

                    <button className="btn" onClick={onExit} style={{ marginTop: '2rem' }}>
                        Return to Base
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = queue[currentIndex];

    return (
        <div className="container">
            {/* HUD */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--color-starlight-dim)', cursor: 'pointer' }}>
                    &larr; ABORT
                </button>

                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '0.5rem 1rem' }}>
                        SCORE: <span style={{ color: 'var(--color-nebula-light)', fontWeight: 'bold' }}>{score}</span>
                    </div>
                    <div className="glass-panel" style={{ padding: '0.5rem 1rem' }}>
                        STREAK: <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>x{streak}</span>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--color-starlight-dim)' }}>
                Question {currentIndex + 1} of {queue.length}
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', marginBottom: '2rem', borderRadius: '2px' }}>
                <div style={{
                    width: `${((currentIndex) / queue.length) * 100}%`,
                    height: '100%',
                    background: 'var(--color-nebula-light)',
                    transition: 'width 0.3s ease'
                }}></div>
            </div>

            <QuestionCard
                // Key forces remount on new question to reset internal state
                key={currentQ.id}
                question={currentQ}
                onAnswer={handleAnswer}
                onNext={handleNext}
            />
        </div>
    );
};

export default GameContainer;
