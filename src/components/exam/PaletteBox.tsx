import React from 'react';

interface PaletteBoxProps {
  index: number;
  isCurrent: boolean;
  isAnswered: boolean;
  isFlagged: boolean;
  onClick: (index: number) => void;
}

export default function PaletteBox({ index, isCurrent, isAnswered, isFlagged, onClick }: PaletteBoxProps) {
  let className = 'palette-box';
  if (isCurrent) className += ' current';
  if (isAnswered) className += ' answered';
  if (isFlagged) className += ' flagged';

  return (
    <div className={className} onClick={() => onClick(index)}>
      {index + 1}
    </div>
  );
}
