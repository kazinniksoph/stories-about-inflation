import { NavLink, Link, Outlet } from 'react-router-dom';
import { Radio, Search, BarChart3, Map, FlaskConical, Microscope, Layers } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Overview', icon: Radio },
  { to: '/methodology', label: 'Methodology', icon: Microscope },
  { to: '/frames', label: 'Frames', icon: Layers },
  { to: '/explorer', label: 'Explorer', icon: Search },
  { to: '/staircase', label: 'Narrative Shares', icon: BarChart3 },
  { to: '/geography', label: 'Geography', icon: Map },
  { to: '/results', label: 'Results', icon: FlaskConical },
];

export default function Layout() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <header style={{ background: 'var(--cream-light)', borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <h1
              className="text-lg font-semibold tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
            >
              Stories People Hear About Inflation
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
              Companion data &middot; Kazinnik (2026)
            </p>
          </Link>
          <nav className="flex gap-0.5">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    isActive ? '' : ''
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: 'var(--ink)', color: 'var(--cream-light)' }
                    : { color: 'var(--text-light)' }
                }
              >
                <Icon size={13} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Accent line */}
      <div className="h-px" style={{ background: 'linear-gradient(to right, var(--gold), var(--gold-light), var(--border))' }} />

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)' }} className="mt-16">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--text-light)' }}>
            Data: 3,157 guest appearances from 351,554 podcast episodes (2017 &ndash; 2026).
          </p>
          <p className="text-xs" style={{ color: 'var(--text-light)' }}>
            Paper: <em>"Stories People Hear About Inflation"</em>, Kazinnik (2026)
          </p>
        </div>
      </footer>
    </div>
  );
}
