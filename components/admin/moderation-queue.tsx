'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import Image from 'next/image';

type ReportPreview =
  | { note: string | null; imageUrl: string | null; userName: string }
  | { userName: string }
  | { comment: string; userName: string }
  | null;

interface Report {
  id: number;
  reporterId: string;
  reportedUserId: string | null;
  feedItemId: number | null;
  feedCommentId: number | null;
  reason: string;
  description: string | null;
  status: string;
  createdAt: Date;
  reporterEmail: string | null;
  reportType: 'post' | 'user' | 'comment';
  preview: ReportPreview;
}

interface HiddenPost {
  id: number;
  userId: string;
  userName: string;
  note: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export function ModerationQueue() {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [hiddenPosts, setHiddenPosts] = useState<HiddenPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHidden, setLoadingHidden] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [modalReport, setModalReport] = useState<Report | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    fetchHiddenPosts();
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

  const fetchHiddenPosts = async () => {
    try {
      const response = await fetch('/api/admin/moderation/hidden');
      if (response.ok) {
        const data = await response.json();
        setHiddenPosts(data);
      }
    } catch (err) {
      console.error('Error fetching hidden posts:', err);
    } finally {
      setLoadingHidden(false);
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
      fetchHiddenPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resolver');
    } finally {
      setResolvingId(null);
    }
  };

  const handleRestore = async (feedItemId: number) => {
    setRestoringId(feedItemId);
    try {
      const response = await fetch('/api/admin/moderation/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedItemId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al restaurar');
      }

      toast.success('Publicación restaurada');
      fetchHiddenPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al restaurar');
    } finally {
      setRestoringId(null);
    }
  };

  const getModalDescription = () => {
    if (!modalReport || !modalAction) return '';
    const action = modalAction === 'approve';
    switch (modalReport.reportType) {
      case 'post':
        return action
          ? 'Ocultarás la publicación del feed. Escribe la descripción de la moderación:'
          : 'La publicación permanecerá visible. Escribe la descripción de la moderación:';
      case 'comment':
        return action
          ? 'Ocultarás el comentario. Escribe la descripción de la moderación:'
          : 'El comentario permanecerá visible. Escribe la descripción de la moderación:';
      case 'user':
        return action
          ? 'Marcarás el reporte como resuelto (no hay acción sobre el usuario). Escribe la descripción:'
          : 'El reporte será rechazado. Escribe la descripción de la moderación:';
      default:
        return 'Escribe la descripción de la moderación:';
    }
  };

  const renderPreview = (report: Report) => {
    if (!report.preview) return null;

    if (report.reportType === 'post' && 'note' in report.preview) {
      const { note, imageUrl, userName } = report.preview;
      return (
        <div className="mt-2 p-3 bg-neutral/5 rounded-lg border border-neutral/10">
          <p className="text-xs text-neutral mb-1 font-medium">Vista previa del post</p>
          <p className="text-sm text-text-dark mb-1">Por: {userName}</p>
          {note && <p className="text-sm text-neutral line-clamp-2">{note}</p>}
          {imageUrl && (
            <div className="mt-2 relative w-full h-24 rounded overflow-hidden bg-neutral/10">
              <Image src={imageUrl} alt="Preview" fill className="object-cover" sizes="200px" />
            </div>
          )}
        </div>
      );
    }

    if (report.reportType === 'comment' && 'comment' in report.preview) {
      const { comment, userName } = report.preview;
      return (
        <div className="mt-2 p-3 bg-neutral/5 rounded-lg border border-neutral/10">
          <p className="text-xs text-neutral mb-1 font-medium">Vista previa del comentario</p>
          <p className="text-sm text-text-dark mb-1">Por: {userName}</p>
          <p className="text-sm text-neutral line-clamp-3">{comment}</p>
        </div>
      );
    }

    if (report.reportType === 'user' && 'userName' in report.preview && !('comment' in report.preview) && !('note' in report.preview)) {
      return (
        <div className="mt-2 p-3 bg-neutral/5 rounded-lg border border-neutral/10">
          <p className="text-xs text-neutral mb-1 font-medium">Usuario reportado</p>
          <p className="text-sm text-text-dark">{report.preview.userName}</p>
        </div>
      );
    }

    return null;
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
      <div className="space-y-8">
        {/* Reportes pendientes */}
        <div className="rounded-2xl border border-neutral/10 bg-white shadow-sm p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-text-dark font-serif mb-4">Reportes pendientes</h3>
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
                  <div className="flex items-start gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {report.reportType === 'post' ? 'Post' : report.reportType === 'comment' ? 'Comentario' : 'Usuario'}
                    </span>
                  </div>
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
                    {renderPreview(report)}
                    <div className="mt-2 text-sm text-neutral">
                      {report.feedItemId && <span>Post ID: {report.feedItemId}</span>}
                      {report.feedCommentId && (
                        <span className="ml-2">Comentario ID: {report.feedCommentId}</span>
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

        {/* Posts ocultos - Restaurar */}
        <div className="rounded-2xl border border-neutral/10 bg-white shadow-sm p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-text-dark font-serif mb-4">Publicaciones ocultas</h3>
          {loadingHidden ? (
            <div className="text-center py-6">
              <Spinner size="md" />
            </div>
          ) : hiddenPosts.length === 0 ? (
            <div className="text-center py-8 text-neutral">
              No hay publicaciones ocultas
            </div>
          ) : (
            <div className="space-y-4">
              {hiddenPosts.map((post) => (
                <div
                  key={post.id}
                  className="border border-neutral/10 rounded-xl p-4 space-y-3 hover:bg-neutral/5 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm text-neutral mb-1">Por: {post.userName}</p>
                    {post.note && <p className="text-sm text-text-dark line-clamp-2">{post.note}</p>}
                    {post.imageUrl && (
                      <div className="mt-2 relative w-full h-24 rounded overflow-hidden bg-neutral/10">
                        <Image src={post.imageUrl} alt="Preview" fill className="object-cover" sizes="200px" />
                      </div>
                    )}
                    <p className="text-xs text-neutral mt-2">ID: {post.id}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(post.id)}
                    disabled={restoringId !== null}
                  >
                    {restoringId === post.id ? (
                      <Spinner size="sm" />
                    ) : (
                      'Restaurar publicación'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para descripción de moderación */}
      {modalReport && modalAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-text-dark font-serif mb-2">
              {modalAction === 'approve' ? 'Aprobar reporte' : 'Rechazar reporte'}
            </h3>
            <p className="text-sm text-neutral mb-3">{getModalDescription()}</p>
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
