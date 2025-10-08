'use client';

import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
  description?: string;
  loading?: boolean;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  description, 
  loading = false 
}: StatsCardProps) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Si es un porcentaje
      if (title.toLowerCase().includes('porcentaje')) {
        return `${val.toFixed(1)}%`;
      }
      // Si es un monto
      if (title.toLowerCase().includes('monto') || title.toLowerCase().includes('perdida')) {
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR'
        }).format(val);
      }
      // Si es un número entero grande
      if (val >= 1000) {
        return new Intl.NumberFormat('es-ES').format(val);
      }
      return val.toString();
    }
    return val;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'neutral':
        return '→';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {/* Valor Principal */}
      <div className="mb-2">
        <span className="text-2xl font-bold text-gray-900">
          {formatValue(value)}
        </span>
      </div>

      {/* Información adicional */}
      <div className="flex items-center justify-between">
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
        
        {change && (
          <div className={`flex items-center text-sm ${getTrendColor(change.trend)}`}>
            <span className="mr-1">{getTrendIcon(change.trend)}</span>
            <span>{change.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
