'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import { formatMentions } from '@/lib/utils/mentions';

interface Comment {
  id: number;
  comment: string;
  userId: string;
  displayName: string;
  createdAt: Date;
}

interface FeedCommentsProps {
  feedItemId: number;
  currentUserId: string;
  onCommentAdded?: () => void;
  isExpanded?: boolean;
}

export function FeedComments({ feedItemId, currentUserId, onCommentAdded, isExpanded = true }: FeedCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) {
      fetchComments();
    }
  }, [isExpanded, feedItemId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/feed/${feedItemId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/feed/${feedItemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentText.trim() }),
      });

      if (!response.ok) {
        throw new Error('Error al comentar');
      }

      const data = await response.json();
      setCommentText('');
      
      // Add new comment to list
      if (data.comment) {
        setComments(prev => [data.comment, ...prev]);
      } else {
        // Refresh comments if comment not returned
        await fetchComments();
      }

      if (onCommentAdded) {
        onCommentAdded();
      }

      // Focus back on input
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return commentDate.toLocaleDateString('es-ES', { 
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="border-t border-gray-200 pt-3 mt-3">
      {/* Comments List - max ~10 visibles con scroll */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto mb-3">
        {loading ? (
          <div className="text-center py-6">
            <Spinner size="md" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No hay comentarios aún. ¡Sé el primero en comentar!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">
                <span className="text-primary font-semibold text-xs">
                  {comment.displayName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-2xl px-3 py-2">
                  <div className="flex items-baseline gap-2 mb-1">
                    <Link
                      href={`/profile/${comment.userId}`}
                      className="font-semibold text-sm hover:underline text-gray-900"
                    >
                      {comment.displayName}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {formatMentions(comment.comment).map((part, idx) => {
                      if (typeof part === 'string') {
                        return <span key={idx}>{part}</span>;
                      }
                      return (
                        <Link
                          key={idx}
                          href={`/profile/${part.username}`}
                          className="text-primary hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          @{part.username}
                        </Link>
                      );
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input solo cuando está desplegado */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Escribe un comentario..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-gray-50 border-gray-200 focus:bg-white"
            disabled={submitting}
            maxLength={500}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!commentText.trim() || submitting}
            className="px-4"
          >
            {submitting ? '...' : 'Publicar'}
          </Button>
        </form>
      )}
    </div>
  );
}
