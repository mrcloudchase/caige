import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Screen } from './types';
import { useExamState } from './useExamState';
import { loadQuestionBank, prepareQuestions } from './questionBank';
import IntroScreen from './IntroScreen';
import ExamScreen from './ExamScreen';
import ResultsScreen from './ResultsScreen';
import ConfirmModal from './ConfirmModal';
import Timer from './Timer';

export default function ExamApp() {
  const [state, dispatch] = useExamState();
  const [screen, setScreen] = useState<Screen>('intro');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  const doSubmit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setShowModal(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    dispatch({ type: 'SUBMIT' });
    setScreen('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch]);

  // Timer effect
  useEffect(() => {
    if (screen !== 'exam') return;

    timerRef.current = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [screen, dispatch]);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (screen === 'exam' && state.timeRemaining <= 0 && !submittedRef.current) {
      doSubmit();
    }
  }, [state.timeRemaining, screen, doSubmit]);

  const handleStart = async (name: string) => {
    dispatch({ type: 'SET_NAME', name });
    setLoading(true);
    try {
      const bank = await loadQuestionBank();
      const questions = prepareQuestions(bank);
      dispatch({ type: 'LOAD_QUESTIONS', questions });
      submittedRef.current = false;
      setScreen('exam');
    } catch {
      alert('Failed to load exam questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClick = () => {
    const unanswered = state.questions.length -
      Object.keys(state.answers).filter(k => state.answers[Number(k)]?.length > 0).length;
    const flagged = state.flags.size;
    let msg = 'Are you sure you want to submit your exam? This action cannot be undone.';
    if (unanswered > 0 || flagged > 0) {
      const parts: string[] = [];
      if (unanswered > 0) parts.push(unanswered + ' unanswered question' + (unanswered > 1 ? 's' : ''));
      if (flagged > 0) parts.push(flagged + ' flagged question' + (flagged > 1 ? 's' : ''));
      msg = 'You have ' + parts.join(' and ') + '. ' + msg;
    }
    setConfirmMsg(msg);
    setShowModal(true);
  };

  const [confirmMsg, setConfirmMsg] = useState('');

  return (
    <>
      {/* Timer overlay positioned in header area */}
      {screen === 'exam' && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          zIndex: 101,
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          paddingRight: '24px',
        }}>
          <Timer timeRemaining={state.timeRemaining} />
        </div>
      )}

      {screen === 'intro' && (
        <IntroScreen loading={loading} onStart={handleStart} />
      )}

      {screen === 'exam' && (
        <ExamScreen
          state={state}
          dispatch={dispatch}
          onSubmitClick={handleSubmitClick}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen state={state} />
      )}

      <ConfirmModal
        message={confirmMsg}
        isOpen={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={doSubmit}
      />
    </>
  );
}
