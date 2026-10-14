import React, { useState } from 'react';
import { EXAM, PASS_COUNT } from './config';

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
          <p className="subtitle">cAIge Associate Practice Exam</p>

          <p className="practice-notice">
            This is a free practice exam built on the same blueprint as the cAIge Associate exam.
            It runs entirely in your browser, is not proctored, and does not award a certification.
            Use it to find gaps in your preparation. See <a href="/certifications/associate">cAIge Associate</a> for
            the certification itself.
          </p>

          <div className="exam-info">
            <div className="exam-info-item">
              <div className="value">{EXAM.examSize}</div>
              <div className="label">Questions</div>
            </div>
            <div className="exam-info-item">
              <div className="value">{EXAM.timeLimitMinutes}</div>
              <div className="label">Minutes</div>
            </div>
            <div className="exam-info-item">
              <div className="value">{EXAM.passPercent}%</div>
              <div className="label">Passing Score</div>
            </div>
            <div className="exam-info-item">
              <div className="value">{PASS_COUNT}</div>
              <div className="label">To Pass</div>
            </div>
          </div>

          <div className="instructions">
            <h3>Exam Instructions</h3>
            <ul>
              <li>You will have {EXAM.timeLimitMinutes} minutes to complete {EXAM.examSize} questions.</li>
              <li>A score of {EXAM.passPercent}% ({PASS_COUNT} out of {EXAM.examSize}) is the passing standard.</li>
              <li>Questions are a mix of multiple choice and multiple select.</li>
              <li>Multiple-select questions will indicate how many answers to choose.</li>
              <li>Multiple-select questions receive credit only when ALL correct options are selected with NO incorrect options.</li>
              <li>You may flag questions and return to them before submitting.</li>
              <li>The exam will auto-submit when the timer reaches zero.</li>
              <li>Use Previous/Next buttons or the question palette to navigate.</li>
              <li>Once submitted, answers cannot be changed. You can then review every question with explanations.</li>
            </ul>
          </div>

          <div className="name-input-group">
            <label htmlFor="candidate-name">Name (shown on your score report)</label>
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
                Please enter a name to begin the practice exam.
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Begin Practice Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
