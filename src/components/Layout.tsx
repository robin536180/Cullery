import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Sparkles, Camera, Mic, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export const Layout = () => {
  const { t } = useTranslation();
  
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.spaceAnalysis') },
    { to: '/cleanup', icon: Sparkles, label: t('nav.smartCleanup') },
    { to: '/selection', icon: Camera, label: t('nav.proSelection') },
    { to: '/voice', icon: Mic, label: t('nav.voiceCommand') },
    { to: '/settings', icon: SettingsIcon, label: t('nav.settings') },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-white/10 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Camera className="w-5 h-5 text-background" />
          </div>
          <span className="text-xl font-bold tracking-tight">Cullery</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Storage Used</div>
            <div className="text-lg font-bold mb-2">45.2 GB / 128 GB</div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[35%]" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      
      {/* Mobile Bottom Nav (Visible only on small screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-white/10 flex justify-around p-4 z-50">
        {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          ))}
      </nav>
    </div>
  );
};
