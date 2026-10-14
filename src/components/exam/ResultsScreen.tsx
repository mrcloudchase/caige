import React, { useState } from 'react';
import type { ExamState, Question } from './types';
import { downloadScoreReport } from './scoreReport';
import { DOMAINS, EXAM, SECTIONS } from './config';

interface ResultsScreenProps {
  state: ExamState;
}

interface DomainResult {
  domain: number;
  name: string;
  correct: number;
  total: number;
  pct: number;
}

interface Missed {
  index: number;
  question: Question;
  selected: number[];
}

function isCorrect(q: Question, selected: number[]): boolean {
  const a = [...selected].sort();
  const b = [...q.correct].sort();
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function computeResults(state: ExamState) {
  const domainScores: Record<number, number> = {};
  const domainTotals: Record<number, number> = {};
  const missed: Missed[] = [];
  let totalCorrect = 0;

  state.questions.forEach((q, idx) => {
    domainTotals[q.domain] = (domainTotals[q.domain] ?? 0) + 1;
    const selected = state.answers[idx] || [];
    if (isCorrect(q, selected)) {
      totalCorrect++;
      domainScores[q.domain] = (domainScores[q.domain] ?? 0) + 1;
    } else {
      missed.push({ index: idx, question: q, selected });
    }
  });

  const total = state.questions.length;
  const exactPct = total > 0 ? (totalCorrect / total) * 100 : 0;
  const passed = exactPct >= EXAM.passPercent;

  const domains: DomainResult[] = DOMAINS.filter(d => domainTotals[d.domain]).map(d => {
    const correct = domainScores[d.domain] ?? 0;
    const dTotal = domainTotals[d.domain];
    return { domain: d.domain, name: d.title, correct, total: dTotal, pct: Math.round((correct / dTotal) * 100) };
  });

  // Sections to review, ordered by number of misses
  const missCounts: Record<string, number> = {};
  missed.forEach(m => { missCounts[m.question.objective] = (missCounts[m.question.objective] ?? 0) + 1; });
  const reviewSections = Object.entries(missCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => ({ ...SECTIONS[id], count }))
    .filter(s => s.href);

  return { totalCorrect, total, pct: Math.round(exactPct), passed, domains, missed, reviewSections };
}

export default function ResultsScreen({ state }: ResultsScreenProps) {
  const { totalCorrect, total, pct, passed, domains, missed, reviewSections } = computeResults(state);
  const [showReview, setShowReview] = useState(false);

  return (
    <div id="results-screen" style={{ display: 'block' }}>
      <div className="container">
        <div className={`result-banner ${passed ? 'pass' : 'fail'}`}>
          <div className="result-status">{passed ? 'MET THE PASSING STANDARD' : 'BELOW THE PASSING STANDARD'}</div>
          <div className="result-score">Score: {totalCorrect} / {total}</div>
          <div className="result-percent">
            {pct}% ({EXAM.passPercent}% passing standard)
          </div>
          <p className="practice-notice">Practice result only. This is not a cAIge certification.</p>
        </div>

        <div className="results-card">
          <table className="domain-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Score</th>
                <th style={{ width: '40%' }}>Performance</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => {
                let colorClass = 'pass-color';
                if (d.pct < 50) colorClass = 'fail-color';
                else if (d.pct < EXAM.passPercent) colorClass = 'warn-color';

                return (
                  <tr key={d.domain}>
                    <td>Domain {d.domain}: {d.name}</td>
                    <td>{d.correct}/{d.total}</td>
                    <td>
                      <div className="score-bar-cell">
                        <div className="score-bar-track">
                          <div className={`score-bar-fill ${colorClass}`} style={{ width: `${d.pct}%` }} />
                        </div>
                        <span className="score-label">{d.pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {reviewSections.length > 0 && (
          <div className="results-card review-sections">
            <h3>Sections to review</h3>
            <ul>
              {reviewSections.map(s => (
                <li key={s.id}>
                  <a href={s.href}>{s.id} {s.title}</a>
                  <span className="miss-count">{s.count} missed</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="result-actions">
          {missed.length > 0 && (
            <button className="btn btn-primary" onClick={() => setShowReview(v => !v)}>
              {showReview ? 'Hide' : 'Review'} missed questions ({missed.length})
            </button>
          )}
          {passed && (
            <button
              className="btn btn-success"
              onClick={() => downloadScoreReport(state.candidateName, totalCorrect, total, pct)}
            >
              Download Score Report
            </button>
          )}
          <a className="btn btn-secondary" href="/">Return Home</a>
        </div>

        {showReview && (
          <div className="review-list">
            {missed.map(({ index, question, selected }) => {
              const section = SECTIONS[question.objective];
              return (
                <div className="review-item" key={question.id}>
                  <div className="review-meta">
                    Question {index + 1} · Domain {question.domain} ·{' '}
                    {section ? <a href={section.href}>{section.id} {section.title}</a> : question.objective}
                  </div>
                  <p className="review-question">{question.question}</p>
                  <ul className="review-options">
                    {question.options.map((opt, i) => {
                      const isAnswer = question.correct.includes(i);
                      const wasSelected = selected.includes(i);
                      const cls = isAnswer ? 'correct' : wasSelected ? 'incorrect' : '';
                      return (
                        <li key={i} className={cls}>
                          {opt}
                          {isAnswer && <span className="tag">correct</span>}
                          {wasSelected && !isAnswer && <span className="tag">your answer</span>}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="review-explanation">{question.explanation}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
