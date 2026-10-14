export type Category = 'safety' | 'security' | 'containment' | 'cross-cutting';

export interface Question {
  id: string;
  domain: number;
  domainName: string;
  objective: string;
  category: Category;
  type: 'mc' | 'ms';
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
  originalId?: string;
  displayIndex?: number;
  optionMap?: number[];
}

export interface QuestionBankDomain {
  domain: number;
  name: string;
  slug: string;
  count: number;
  questions: Question[];
}

export interface QuestionBank {
  version: string;
  examSize: number;
  timeLimitMinutes: number;
  passPercent: number;
  domainDistribution: Record<string, number>;
  domains: QuestionBankDomain[];
}

export type Screen = 'intro' | 'exam' | 'results';

export interface ExamState {
  candidateName: string;
  questions: Question[];
  answers: Record<number, number[]>;
  flags: Set<number>;
  currentIndex: number;
  timeRemaining: number;
  submitted: boolean;
}

export type ExamAction =
  | { type: 'SET_NAME'; name: string }
  | { type: 'LOAD_QUESTIONS'; questions: Question[] }
  | { type: 'SELECT_OPTION'; questionIndex: number; optionIndex: number; isMulti: boolean }
  | { type: 'TOGGLE_FLAG'; index: number }
  | { type: 'GO_TO_QUESTION'; index: number }
  | { type: 'TICK_TIMER' }
  | { type: 'SUBMIT' }
  | { type: 'RESET' };
