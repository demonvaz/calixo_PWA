'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';

interface ChallengeCompletionFormProps {
  challengeTitle: string;
  coinsEarned: number;
  onSubmit: (imageUrl: string, note: string) => Promise<void>;
  onSkip?: () => void;
}

export function ChallengeCompletionForm({
  challengeTitle,
  coinsEarned,
  onSubmit,
  onSkip,
}: ChallengeCompletionFormProps) {
  const [note, setNote] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Solo se permiten imágenes JPG, PNG o WEBP');
      return;
    }

    setError('');
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    // TODO: Implement Supabase Storage upload
    // For now, return a placeholder
    // In production, this would upload to Supabase Storage and return the URL
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al subir la imagen');
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      setError('Por favor selecciona una imagen');
      return;
    }

    if (!note.trim()) {
      setError('Por favor escribe una nota sobre tu experiencia');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Upload image
      const imageUrl = await uploadImage(imageFile);
      
      // Submit to parent
      await onSubmit(imageUrl, note);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 text-6xl">🎉</div>
        <CardTitle>¡Reto Completado!</CardTitle>
        <CardDescription>
          Has completado: {challengeTitle}
        </CardDescription>
        <div className="flex items-center justify-center gap-2 mt-4 text-yellow-600 font-semibold text-lg">
          <span className="text-2xl">🪙</span>
          <span>+{coinsEarned} monedas ganadas</span>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Foto de tu logro (1:1 cuadrada)
            </label>
            
            {imagePreview ? (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div
                className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-sm text-gray-600">
                    Click para seleccionar imagen
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG o WEBP • Máx 5MB
                  </p>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Cuéntanos tu experiencia
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="¿Cómo te sentiste durante el reto? ¿Qué aprendiste?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {note.length}/500 caracteres
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            type="submit"
            className="w-full"
            disabled={isUploading}
          >
            {isUploading ? 'Subiendo...' : 'Compartir en el Feed'}
          </Button>
          
          {onSkip && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleSkip}
            >
              Omitir y continuar
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}



