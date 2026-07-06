import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialog({ ...options, resolve });
    });
  }, []);

  const handle = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="dialog-backdrop" onClick={() => handle(false)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-icon">
              <AlertTriangle size={22} />
            </div>
            <div className="dialog-title">{dialog.title || 'Are you sure?'}</div>
            <div className="dialog-message">{dialog.message}</div>
            <div className="dialog-actions">
              <button className="btn btn-outline btn-full" onClick={() => handle(false)}>Cancel</button>
              <button className="btn btn-primary btn-full" onClick={() => handle(true)}>{dialog.confirmLabel || 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
