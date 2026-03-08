import React from 'react';
import type { ExamState, ExamAction } from './types';
import QuestionPanel from './QuestionPanel';
import SidePanel from './SidePanel';

interface ExamScreenProps {
  state: ExamState;
  dispatch: React.Dispatch<ExamAction>;
  onSubmitClick: () => void;
}

export default function ExamScreen({ state, dispatch, onSubmitClick }: ExamScreenProps) {
  const question = state.questions[state.currentIndex];
  if (!question) return null;

  return (
    <div id="exam-screen" style={{ display: 'block' }}>
      <div className="container">
        <div className="exam-layout">
          <QuestionPanel
            question={question}
            questionIndex={state.currentIndex}
            totalQuestions={state.questions.length}
            selectedOptions={state.answers[state.currentIndex] || []}
            isFlagged={state.flags.has(state.currentIndex)}
            dispatch={dispatch}
          />
          <SidePanel
            state={state}
            dispatch={dispatch}
            onSubmitClick={onSubmitClick}
          />
        </div>
      </div>
    </div>
  );
}
