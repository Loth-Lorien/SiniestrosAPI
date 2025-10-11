"use client";
import { useState } from 'react';
import { FiHome, FiAlertTriangle, FiUsers, FiSettings, FiLogOut, FiBarChart } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard-protected', icon: FiHome },
    { name: 'Siniestros', href: '/siniestros', icon: FiAlertTriangle },
    { name: 'Usuarios', href: '/usuarios', icon: FiUsers },
    { name: 'Reportes', href: '/reportes', icon: FiBarChart },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 bg-white shadow-lg border-r border-gray-200 ${expanded ? 'w-56' : 'w-16'}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FiAlertTriangle className="h-6 w-6 text-white" />
          </div>
          {expanded && (
            <span className="ml-3 text-lg font-bold text-gray-900">SiniestrosAPI</span>
          )}
        </div>
        {/* Navigation */}
        <nav className="flex-1 mt-4">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {expanded && <span className="ml-3 text-base">{item.name}</span>}
            </button>
          ))}
        </nav>
        {/* User & Logout */}
        <div className="mt-auto mb-4 px-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user?.usuario?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            {expanded && (
              <span className="ml-2 text-sm font-medium text-gray-700">
                {user?.usuario || 'Usuario'}
              </span>
            )}
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full mt-4 px-2 py-2 text-gray-700 hover:bg-blue-50 rounded transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            {expanded && <span className="ml-2">Salir</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
