/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Toast } from '../../types';
import { useScheduleStore } from '../../store/useScheduleStore';

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.durationMs ?? 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.durationMs, isHovered, onDismiss]);

  const renderIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 strokeWidth={1.5} className="h-4 w-4 text-ok shrink-0" />;
      case 'warning':
        return <AlertTriangle strokeWidth={1.5} className="h-4 w-4 text-warn shrink-0" />;
      case 'error':
        return <AlertCircle strokeWidth={1.5} className="h-4 w-4 text-bad shrink-0" />;
      default:
        return <Info strokeWidth={1.5} className="h-4 w-4 text-fg-3 shrink-0" />;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-line text-fg shadow-float text-xs transition-colors animate-enter duration-200"
    >
      <div className="flex items-center space-x-3 min-w-0">
        {renderIcon()}
        <span className="font-medium truncate">{toast.message}</span>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="px-3 py-1 font-medium text-xs rounded-lg bg-raised hover:bg-line-strong text-fg-2 border border-line transition-colors cursor-pointer"
          >
            {toast.action.label}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className="p-1 rounded-lg text-fg-3 hover:text-fg-2 transition-colors cursor-pointer"
        >
          <X strokeWidth={1.5} className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useScheduleStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="System notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};
