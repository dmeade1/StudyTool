
import React from 'react';
import questions from '../data/questions.json';

interface DashboardProps {
    onSelectModule: (moduleId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectModule }) => {
    // Extract unique modules
    const modules = Array.from(new Set(questions.map((q) => q.module))).sort();

    return (
        <div className="container animate-float">
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    FIN 475 StudyTool
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                    Exam 1 Practice Questions
                </p>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '3rem', fontSize: '1rem' }}>
                    Select a module to begin practicing.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    {modules.map((mod) => (
                        <button
                            key={mod}
                            className="glass-panel btn"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                height: '200px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                border: '1px solid var(--color-nebula)',
                            }}
                            onClick={() => onSelectModule(mod)}
                        >
                            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '1rem' }}>📦</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {mod.includes('-') ? 'Modules' : 'Module'} {mod}
                            </span>
                            <span style={{ marginTop: '0.5rem', color: 'var(--color-starlight-dim)' }}>
                                {questions.filter((q) => q.module === mod).length} Questions
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
