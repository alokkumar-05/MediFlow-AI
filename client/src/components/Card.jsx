import React from 'react';

export default function Card({ children, title, subtitle, footer, className = '', headerAction }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-slate-800 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-sm text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
}
