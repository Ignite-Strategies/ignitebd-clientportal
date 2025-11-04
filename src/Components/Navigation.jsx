import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Welcome', key: 'welcome' },
    { path: '/proposal', label: 'Proposal Overview', key: 'proposal' },
    { path: '/timeline', label: 'Timeline & Execution', key: 'timeline' },
    { path: '/how-we-work', label: "How We'll Work Together", key: 'how-we-work' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-lg font-bold text-red-600 hover:text-red-700 transition-colors"
            >
              <span className="text-2xl">🔥</span>
              <span>Ignite</span>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <select
              value={location.pathname}
              onChange={(e) => navigate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white"
            >
              {navItems.map((item) => (
                <option key={item.key} value={item.path}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

