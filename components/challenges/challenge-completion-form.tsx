'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';

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
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Solo se permiten imágenes JPG, PNG o WEBP');
      return;
    }

    setError('');
    setIsUploadingImage(true); // Mostrar "Subiendo" desde el inicio
    setImageUrl(''); // Reset URL cuando se cambia la imagen
    
    try {
      // Comprimir la imagen automáticamente
      // Intentamos mantenerla por debajo de 2MB (mucho menos que 5MB)
      // pero con buena calidad
      const options = {
        maxSizeMB: 2, // Máximo 2MB (mucho menos que 5MB)
        maxWidthOrHeight: 1920, // Máximo 1920px para mantener buena calidad
        useWebWorker: true,
        fileType: file.type,
      };

      const compressedFile = await imageCompression(file, options);
      
      // Verificar que la compresión fue exitosa y el archivo es razonable
      let finalFile = compressedFile;
      if (compressedFile.size > 5 * 1024 * 1024) {
        // Si aún es muy grande después de comprimir, intentar más compresión
        const moreCompressedOptions = {
          maxSizeMB: 1, // Intentar 1MB
          maxWidthOrHeight: 1280,
          useWebWorker: true,
          fileType: file.type,
        };
        finalFile = await imageCompression(file, moreCompressedOptions);
      }
      
      setImageFile(finalFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        
        // Subir la imagen automáticamente después de comprimir
        uploadImage(finalFile);
      };
      reader.readAsDataURL(finalFile);
    } catch (error) {
      console.error('Error procesando imagen:', error);
      setError('Error al procesar la imagen. Por favor, intenta con otra.');
      setIsUploadingImage(false);
      setIsCompressing(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    setIsUploadingImage(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || 'Error al subir la imagen';
        console.error('Upload error:', errorData);
        setImageFile(null);
        setImagePreview('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setImageUrl(data.url);
      return data.url;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al subir la imagen');
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // La nota es opcional si hay imagen, pero requerida si no hay imagen
    if (!note.trim() && !imageFile) {
      setError('Por favor escribe una nota sobre tu experiencia o sube una imagen');
      return;
    }

    // No permitir enviar si la imagen aún se está subiendo
    if (imageFile && isUploadingImage) {
      setError('Por favor espera a que termine de subir la imagen');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Usar la URL ya subida o subirla ahora si no se subió automáticamente
      let finalImageUrl = imageUrl;
      if (imageFile && !imageUrl) {
        finalImageUrl = await uploadImage(imageFile);
      }
      
      // Submit to parent
      await onSubmit(finalImageUrl, note);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image Upload */}
      <div>
            <label className="block text-sm font-medium mb-2">
              Foto de tu logro (opcional)
            </label>
            
            {imagePreview ? (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                {/* Loading overlay cuando se está subiendo */}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                      </div>
                      <p className="text-white text-sm font-medium">Subiendo imagen...</p>
                    </div>
                  </div>
                )}
                {/* Indicador de éxito cuando ya se subió */}
                {imageUrl && !isUploadingImage && (
                  <div className="absolute top-2 left-2 bg-complementary-emerald text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Subida
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                    setImageUrl('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isUploadingImage}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div
                className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
                onClick={() => !isUploadingImage && fileInputRef.current?.click()}
              >
                <div className="text-center px-4">
                  <p className="text-sm text-gray-600 font-medium">
                    Toca para tomar o seleccionar foto
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    En móvil puedes usar la cámara
                  </p>
                  <p className="text-xs text-gray-400">
                    JPG, PNG o WEBP • Se comprimirá automáticamente
                  </p>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
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

      {/* Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
            type="submit"
            className="w-full"
            disabled={isUploading || isUploadingImage}
          >
          {isUploadingImage ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Subiendo...
            </span>
          ) : isUploading ? (
            'Enviando...'
          ) : (
            'Compartir en el Feed'
          )}
        </Button>
        
        {onSkip && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleSkip}
            disabled={isUploading || isUploadingImage}
          >
            Omitir y continuar
          </Button>
        )}
      </div>
    </form>
  );
}






