export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

export function formatNumber(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function frameLabel(frame: string): string {
  return frame
    .split('_')
    .map(w => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}
