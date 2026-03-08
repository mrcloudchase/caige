import React from 'react';
import type { Question, ExamAction } from './types';
import OptionItem from './OptionItem';

interface QuestionPanelProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedOptions: number[];
  isFlagged: boolean;
  dispatch: React.Dispatch<ExamAction>;
}

export default function QuestionPanel({
  question,
  questionIndex,
  totalQuestions,
  selectedOptions,
  isFlagged,
  dispatch,
}: QuestionPanelProps) {
  const isMulti = question.type === 'ms';

  const handleSelect = (optionIndex: number) => {
    dispatch({ type: 'SELECT_OPTION', questionIndex, optionIndex, isMulti });
  };

  const handleFlag = () => {
    dispatch({ type: 'TOGGLE_FLAG', index: questionIndex });
  };

  const handlePrev = () => {
    if (questionIndex > 0) {
      dispatch({ type: 'GO_TO_QUESTION', index: questionIndex - 1 });
    }
  };

  const handleNext = () => {
    if (questionIndex < totalQuestions - 1) {
      dispatch({ type: 'GO_TO_QUESTION', index: questionIndex + 1 });
    }
  };

  return (
    <div className="question-panel" id="question-panel">
      <div className="question-meta">
        <span className="question-number">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        <span className="domain-label">
          Domain {question.domain}: {question.domainName}
        </span>
      </div>
      <div className="question-text">{question.question}</div>
      <ul className="options-list">
        {question.options.map((opt, idx) => (
          <OptionItem
            key={idx}
            text={opt}
            index={idx}
            isMulti={isMulti}
            isSelected={selectedOptions.includes(idx)}
            onSelect={handleSelect}
          />
        ))}
      </ul>
      <div className="question-actions">
        <button
          className={`flag-btn${isFlagged ? ' flagged' : ''}`}
          onClick={handleFlag}
        >
          <span className="flag-icon"></span>
          <span>{isFlagged ? 'Flagged' : 'Flag for Review'}</span>
        </button>
        <div className="nav-buttons">
          <button
            className="btn btn-secondary"
            disabled={questionIndex === 0}
            onClick={handlePrev}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary"
            disabled={questionIndex === totalQuestions - 1}
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
