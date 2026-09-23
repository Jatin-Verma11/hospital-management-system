import React from 'react';

export default function StatCard({ title, value, sub, icon: Icon, color = '', formatCurrency = false }) {
  const displayVal = formatCurrency && typeof value === 'number' 
    ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    : value;

  return (
    <div className={`glass-panel kpi-card ${color}`}>
      <div>
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{displayVal}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      {Icon && (
        <div className="kpi-icon">
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
