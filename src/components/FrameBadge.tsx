import { useState } from 'react';
import { FRAME_COLORS, FRAME_LABELS, FRAME_DESCRIPTIONS } from '../types';

interface Props {
  frame: string;
  size?: 'sm' | 'md';
}

export default function FrameBadge({ frame, size = 'sm' }: Props) {
  const [show, setShow] = useState(false);
  const color = FRAME_COLORS[frame] || '#6b7280';
  const label = FRAME_LABELS[frame] || frame;
  const description = FRAME_DESCRIPTIONS[frame] || '';
  const cls = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`relative inline-flex items-center rounded font-medium cursor-help ${cls}`}
      style={{
        backgroundColor: `${color}14`,
        color,
        borderLeft: `3px solid ${color}`,
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {label}
      {show && description && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-lg text-xs font-normal leading-relaxed p-3 shadow-xl z-50 pointer-events-none"
          style={{ background: 'var(--ink)', color: 'var(--cream-light)' }}
        >
          {description}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
            style={{ borderTopColor: 'var(--ink)' }}
          />
        </span>
      )}
    </span>
  );
}
