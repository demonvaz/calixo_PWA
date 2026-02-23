'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';

interface Report {
  id: number;
  reporterId: string;
  reportedUserId: string | null;
  feedItemId: number | null;
  reason: string;
  description: string | null;
  status: string;
  createdAt: Date;
  reporterEmail: string | null;
}

export function ModerationQueue() {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [modalReport, setModalReport] = useState<Report | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/moderation/queue');
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (report: Report, action: 'approve' | 'reject') => {
    setModalReport(report);
    setModalAction(action);
    setModerationNote('');
    setError(null);
  };

  const closeModal = () => {
    setModalReport(null);
    setModalAction(null);
    setModerationNote('');
    setError(null);
  };

  const handleResolve = async () => {
    if (!modalReport || !modalAction || !moderationNote.trim()) {
      setError('La descripción de moderación es obligatoria');
      return;
    }

    setResolvingId(modalReport.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/moderation/${modalReport.id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modalAction,
          moderationNote: moderationNote.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al resolver');
      }

      toast.success(modalAction === 'approve' ? 'Reporte aprobado' : 'Reporte rechazado');
      closeModal();
      fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resolver');
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-neutral/10 bg-white shadow-sm p-4 sm:p-6">
        {reports.length === 0 ? (
          <div className="text-center py-8 text-neutral">
            No hay reportes pendientes
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border border-neutral/10 rounded-xl p-4 space-y-3 hover:bg-neutral/5 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-neutral">
                      Reportado por: {report.reporterEmail || report.reporterId}
                    </span>
                    <span className="text-xs text-neutral">
                      {new Date(report.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <p className="font-medium text-text-dark font-serif mb-1">
                    Razón: {report.reason}
                  </p>
                  {report.description && (
                    <p className="text-sm text-neutral">{report.description}</p>
                  )}
                  <div className="mt-2 text-sm text-neutral">
                    {report.feedItemId && (
                      <span>Post ID: {report.feedItemId}</span>
                    )}
                    {report.reportedUserId && (
                      <span className="ml-2">Usuario ID: {report.reportedUserId}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openModal(report, 'approve')}
                  >
                    Aprobar reporte
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openModal(report, 'reject')}
                  >
                    Rechazar reporte
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para descripción de moderación */}
      {modalReport && modalAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-text-dark font-serif mb-2">
              {modalAction === 'approve' ? 'Aprobar reporte' : 'Rechazar reporte'}
            </h3>
            <p className="text-sm text-neutral mb-3">
              {modalAction === 'approve'
                ? 'Ocultarás la publicación del feed. Escribe la descripción de la moderación:'
                : 'La publicación permanecerá visible. Escribe la descripción de la moderación:'}
            </p>
            <textarea
              value={moderationNote}
              onChange={(e) => setModerationNote(e.target.value)}
              placeholder="Descripción de la decisión de moderación..."
              className="w-full px-4 py-2.5 text-sm border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark placeholder:text-neutral resize-none"
              rows={4}
            />
            {error && (
              <p className="text-sm text-accent-red mt-2">{error}</p>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" size="sm" onClick={closeModal}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleResolve}
                disabled={resolvingId !== null || !moderationNote.trim()}
              >
                {resolvingId !== null ? (
                  'Enviando...'
                ) : modalAction === 'approve' ? (
                  'Aprobar'
                ) : (
                  'Rechazar'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
