'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

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
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveReport = async (reportId: number, action: 'approve' | 'reject' | 'delete') => {
    try {
      const response = await fetch(`/api/admin/moderation/${reportId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'approve' ? 'resolved' : 'reviewed',
          action,
        }),
      });

      if (response.ok) {
        fetchReports();
      }
    } catch (error) {
      console.error('Error resolving report:', error);
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
    <Card className="p-6">
      {reports.length === 0 ? (
        <div className="text-center py-8 text-neutral">
          No hay reportes pendientes
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="border border-neutral/20 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
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
                      <span>Usuario ID: {report.reportedUserId}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolveReport(report.id, 'approve')}
                >
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolveReport(report.id, 'reject')}
                >
                  Rechazar
                </Button>
                {report.feedItemId && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => resolveReport(report.id, 'delete')}
                  >
                    Eliminar Contenido
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

