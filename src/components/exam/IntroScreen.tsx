import React, { useState } from 'react';

interface IntroScreenProps {
  loading: boolean;
  onStart: (name: string) => void;
}

export default function IntroScreen({ loading, onStart }: IntroScreenProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState(false);

  const handleStart = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    setError(false);
    onStart(trimmed);
  };

  return (
    <div id="intro-screen">
      <div className="container">
        <div className="intro-card">
          <h1>Certified AI Guardrail Engineer</h1>
          <p className="subtitle">cAIge Certification Examination</p>

          <div className="exam-info">
            <div className="exam-info-item">
              <div className="value">75</div>
              <div className="label">Questions</div>
            </div>
            <div className="exam-info-item">
              <div className="value">120</div>
              <div className="label">Minutes</div>
            </div>
            <div className="exam-info-item">
              <div className="value">70%</div>
              <div className="label">Passing Score</div>
            </div>
            <div className="exam-info-item">
              <div className="value">53</div>
              <div className="label">To Pass</div>
            </div>
          </div>

          <div className="instructions">
            <h3>Exam Instructions</h3>
            <ul>
              <li>You will have 120 minutes to complete 75 questions.</li>
              <li>A score of 70% (53 out of 75) is required to pass.</li>
              <li>Questions are a mix of multiple choice and multiple select.</li>
              <li>Multiple-select questions will indicate how many answers to choose.</li>
              <li>Multiple-select questions receive credit only when ALL correct options are selected with NO incorrect options.</li>
              <li>You may flag questions and return to them before submitting.</li>
              <li>The exam will auto-submit when the timer reaches zero.</li>
              <li>Use Previous/Next buttons or the question palette to navigate.</li>
              <li>Once submitted, answers cannot be changed.</li>
            </ul>
          </div>

          <div className="name-input-group">
            <label htmlFor="candidate-name">Full Name (as it will appear on your certificate)</label>
            <input
              type="text"
              id="candidate-name"
              placeholder="Enter your full name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStart(); }}
            />
            {error && (
              <div className="name-error" style={{ display: 'block' }}>
                Please enter your name to begin the exam.
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Begin Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
