import React from 'react';

interface ConfirmModalProps {
  message: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({ message, isOpen, onCancel, onConfirm }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal-box">
        <h3>Submit Exam?</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}>Submit</button>
        </div>
      </div>
    </div>
  );
}
