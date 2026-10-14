import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Rocket, Activity, Sliders, Database, BookOpen, GitCompare, Gauge, RadioTower } from 'lucide-react';
import { checkBackendHealth } from '../services/api';

export const Navbar: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkBackendHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
    const interval = setInterval(() => {
      checkBackendHealth()
        .then(() => setBackendStatus('online'))
        .catch(() => setBackendStatus('offline'));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/mission-3d', label: '3D Mission', icon: RadioTower },
    { to: '/live', label: 'Illustrative Demo', icon: Rocket },
    { to: '/dashboard', label: 'Dashboard', icon: Gauge, RadioTower },
    { to: '/configure', label: 'Configure', icon: Sliders },
    { to: '/simulation', label: 'Simulation', icon: Rocket },
    { to: '/optimization', label: 'Optimization', icon: Activity },
    { to: '/compare', label: 'Compare', icon: GitCompare },
    { to: '/saved', label: 'Saved Missions', icon: Database },
    { to: '/docs', label: 'Physics & Docs', icon: BookOpen },
  ];

  return (
    <header className="mission-nav-header sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg group-hover:border-sky-400 transition-colors">
            <Rocket className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wider text-slate-100 flex items-center gap-2">
              ROCKET MISSION PLATFORM
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-mono">
                v1.0
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Scientific Flight Simulation & Optimization
            </div>
          </div>
        </NavLink>

        <nav className="flex items-center gap-1 flex-wrap">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : backendStatus === 'offline'
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-slate-400 text-[11px]">
              {backendStatus === 'online' ? 'FASTAPI READY' : backendStatus === 'offline' ? 'DISCONNECTED' : 'CHECKING'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

