import { useReducer } from 'react';
import type { ExamState, ExamAction } from './types';

const initialState: ExamState = {
  candidateName: '',
  questions: [],
  answers: {},
  flags: new Set(),
  currentIndex: 0,
  timeRemaining: 120 * 60,
  submitted: false,
};

function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, candidateName: action.name };

    case 'LOAD_QUESTIONS':
      return {
        ...state,
        questions: action.questions,
        answers: {},
        flags: new Set(),
        currentIndex: 0,
        timeRemaining: 120 * 60,
        submitted: false,
      };

    case 'SELECT_OPTION': {
      const selected = state.answers[action.questionIndex] || [];
      let newSelected: number[];

      if (action.isMulti) {
        if (selected.includes(action.optionIndex)) {
          newSelected = selected.filter(i => i !== action.optionIndex);
        } else {
          newSelected = [...selected, action.optionIndex];
        }
      } else {
        newSelected = [action.optionIndex];
      }

      return {
        ...state,
        answers: { ...state.answers, [action.questionIndex]: newSelected },
      };
    }

    case 'TOGGLE_FLAG': {
      const newFlags = new Set(state.flags);
      if (newFlags.has(action.index)) {
        newFlags.delete(action.index);
      } else {
        newFlags.add(action.index);
      }
      return { ...state, flags: newFlags };
    }

    case 'GO_TO_QUESTION':
      return { ...state, currentIndex: action.index };

    case 'TICK_TIMER':
      return { ...state, timeRemaining: state.timeRemaining - 1 };

    case 'SUBMIT':
      return { ...state, submitted: true };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

export function useExamState() {
  return useReducer(examReducer, initialState);
}
