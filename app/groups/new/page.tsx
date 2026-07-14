'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function NewGroupPage() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success('Grupo creado');
      router.push(`/groups/${data.group.id}/chat`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-20 md:pb-8 pt-4 md:pt-20 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Crear grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre del grupo</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mi grupo de detox"
                maxLength={100}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción (opcional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del grupo"
                maxLength={500}
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={loading || !name.trim()} className="w-full">
              {loading ? 'Creando...' : 'Crear grupo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
