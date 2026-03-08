import React from 'react';
import type { ExamState } from './types';
import { downloadCertificate } from './certificate';

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

function computeResults(state: ExamState) {
  let totalCorrect = 0;
  const domainScores: Record<number, number> = {};
  const domainTotals: Record<number, number> = {};
  const domainNames: Record<number, string> = {};

  state.questions.forEach((q, idx) => {
    if (!domainScores[q.domain]) {
      domainScores[q.domain] = 0;
      domainTotals[q.domain] = 0;
      domainNames[q.domain] = q.domainName;
    }
    domainTotals[q.domain]++;

    const selected = [...(state.answers[idx] || [])].sort();
    const correct = [...q.correct].sort();

    if (selected.length === correct.length && selected.every((v, i) => v === correct[i])) {
      totalCorrect++;
      domainScores[q.domain]++;
    }
  });

  const total = state.questions.length;
  const pct = Math.round((totalCorrect / total) * 100);
  const passed = pct >= 70;

  const domains: DomainResult[] = [];
  for (let d = 1; d <= 6; d++) {
    if (!domainTotals[d]) continue;
    const dScore = domainScores[d];
    const dTotal = domainTotals[d];
    const dPct = Math.round((dScore / dTotal) * 100);
    domains.push({ domain: d, name: domainNames[d], correct: dScore, total: dTotal, pct: dPct });
  }

  return { totalCorrect, total, pct, passed, domains };
}

export default function ResultsScreen({ state }: ResultsScreenProps) {
  const { totalCorrect, total, pct, passed, domains } = computeResults(state);

  const handleDownload = () => {
    downloadCertificate(state.candidateName, totalCorrect, total, pct);
  };

  const handleHome = () => {
    window.location.href = '/';
  };

  return (
    <div id="results-screen" style={{ display: 'block' }}>
      <div className="container">
        <div className={`result-banner ${passed ? 'pass' : 'fail'}`}>
          <div className="result-status">{passed ? 'PASSED' : 'DID NOT PASS'}</div>
          <div className="result-score">Score: {totalCorrect} / {total}</div>
          <div className="result-percent">
            {pct}%{!passed && ' (70% required to pass)'}
          </div>
        </div>

        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '32px',
        }}>
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
                else if (d.pct < 70) colorClass = 'warn-color';

                return (
                  <tr key={d.domain}>
                    <td>Domain {d.domain}: {d.name}</td>
                    <td>{d.correct}/{d.total}</td>
                    <td>
                      <div className="score-bar-cell">
                        <div className="score-bar-track">
                          <div
                            className={`score-bar-fill ${colorClass}`}
                            style={{ width: `${d.pct}%` }}
                          />
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

        <div className="result-actions">
          {passed && (
            <button className="btn btn-success" onClick={handleDownload}>
              Download Certificate
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleHome}>
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
