
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
                    Galactic Study System
                </h1>
                <p style={{ color: 'var(--color-starlight-dim)', marginBottom: '3rem', fontSize: '1.2rem' }}>
                    Select your training module, Cadet. The galaxy needs your knowledge.
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
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Modules {mod}</span>
                            <span style={{ marginTop: '0.5rem', color: 'var(--color-starlight-dim)' }}>
                                {questions.filter((q) => q.module === mod).length} Missions
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
