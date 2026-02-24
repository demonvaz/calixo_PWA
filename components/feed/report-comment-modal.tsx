'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Contenido inapropiado' },
  { value: 'harassment', label: 'Acoso' },
  { value: 'other', label: 'Otro' },
];

interface ReportCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedCommentId: number;
  onReported?: () => void;
}

export function ReportCommentModal({
  isOpen,
  onClose,
  feedCommentId,
  onReported,
}: ReportCommentModalProps) {
  const [reason, setReason] = useState('spam');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedCommentId, reason }),
      });
      if (response.ok) {
        setDone(true);
        onReported?.();
        setTimeout(onClose, 1500);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Error al reportar');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al reportar');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg p-4 w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <p className="text-center text-complementary-emerald py-4">
            ✓ Reporte enviado
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm font-medium text-text-dark">
              Reportar comentario
            </p>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
