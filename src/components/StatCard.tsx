interface Props {
  label: string;
  value: string | number;
  sub?: string;
}

export default function StatCard({ label, value, sub }: Props) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <p
        className="text-xs uppercase tracking-wider font-medium"
        style={{ color: 'var(--navy-light)', letterSpacing: '0.08em' }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-bold mt-1"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}
