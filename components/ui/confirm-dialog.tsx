'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmDialogOptions) => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmDialogOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    setDialog(options);
    setIsOpen(true);
  }, []);

  const handleConfirm = () => {
    if (dialog) {
      dialog.onConfirm();
      setIsOpen(false);
      setTimeout(() => setDialog(null), 300); // Wait for animation
    }
  };

  const handleCancel = useCallback(() => {
    if (dialog?.onCancel) {
      dialog.onCancel();
    }
    setIsOpen(false);
    setTimeout(() => setDialog(null), 300); // Wait for animation
  }, [dialog]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleCancel]);

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <div
          className={cn(
            'fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain',
            'bg-black/50 backdrop-blur-sm',
            'transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={handleBackdropClick}
        >
          <Card
            className={cn(
              'w-full max-w-md max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto my-auto shadow-2xl',
              'transform transition-all duration-300',
              isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 font-sans">
                {dialog.title}
              </CardTitle>
              {dialog.message && (
                <CardDescription className="text-base text-gray-600 font-sans mt-2">
                  {dialog.message}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full sm:w-auto font-sans"
                >
                  {dialog.cancelText || 'Cancelar'}
                </Button>
                <Button
                  ref={confirmButtonRef}
                  variant={dialog.confirmVariant || 'default'}
                  onClick={handleConfirm}
                  className="w-full sm:w-auto font-sans"
                  autoFocus
                >
                  {dialog.confirmText || 'Confirmar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}
