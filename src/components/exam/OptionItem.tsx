import React from 'react';

interface OptionItemProps {
  text: string;
  index: number;
  isMulti: boolean;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

export default function OptionItem({ text, index, isMulti, isSelected, onSelect }: OptionItemProps) {
  const inputType = isMulti ? 'checkbox' : 'radio';

  return (
    <li
      className={`option-item${isSelected ? ' selected' : ''}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        onSelect(index);
      }}
    >
      <input
        type={inputType}
        checked={isSelected}
        onChange={() => onSelect(index)}
      />
      <span className="option-text">{text}</span>
    </li>
  );
}
