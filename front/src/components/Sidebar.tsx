"use client";
import { useState } from 'react';
import { FiHome, FiAlertTriangle, FiUsers, FiSettings, FiLogOut, FiBarChart, FiBarChart2 } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard-protected', icon: FiHome },
    { name: 'Siniestros', href: '/siniestros', icon: FiAlertTriangle },
    { name: 'Usuarios', href: '/usuarios', icon: FiUsers },
    { name: 'Reportes', href: '/reportes', icon: FiBarChart },
    { name: 'Power BI', href: '/powerbi', icon: FiBarChart2 },
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
              <item.icon className="w-5 h-5 text-orange-500" />
              {expanded && <span className="ml-3 text-base text-blue-600">{item.name}</span>}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
