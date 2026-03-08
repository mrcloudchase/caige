import React, { useState } from 'react';
import type { ExamState, ExamAction } from './types';
import PaletteBox from './PaletteBox';

interface SidePanelProps {
  state: ExamState;
  dispatch: React.Dispatch<ExamAction>;
  onSubmitClick: () => void;
}

export default function SidePanel({ state, dispatch, onSubmitClick }: SidePanelProps) {
  const [expanded, setExpanded] = useState(false);

  const handleGoTo = (index: number) => {
    dispatch({ type: 'GO_TO_QUESTION', index });
    setExpanded(false);
  };

  return (
    <div className={`side-panel${expanded ? ' expanded' : ''}`} id="side-panel">
      <div
        className="side-panel-toggle"
        onClick={() => setExpanded(!expanded)}
      />
      <div className="palette-card">
        <h3>Question Palette</h3>
        <div className="palette-grid">
          {state.questions.map((_, idx) => (
            <PaletteBox
              key={idx}
              index={idx}
              isCurrent={idx === state.currentIndex}
              isAnswered={!!(state.answers[idx] && state.answers[idx].length > 0)}
              isFlagged={state.flags.has(idx)}
              onClick={handleGoTo}
            />
          ))}
        </div>
        <div className="palette-legend">
          <div className="legend-item"><span className="legend-dot ans"></span> Answered</div>
          <div className="legend-item"><span className="legend-dot flag"></span> Flagged</div>
          <div className="legend-item"><span className="legend-dot unans"></span> Unanswered</div>
        </div>
      </div>
      <div className="submit-section">
        <button className="btn btn-danger" onClick={onSubmitClick}>
          Submit Exam
        </button>
      </div>
    </div>
  );
}
