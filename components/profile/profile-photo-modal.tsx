'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { ImageCropper } from './image-cropper';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  currentPhotoUrl: string | null;
  onClose: () => void;
  onPhotoUpdated: (photoUrl?: string) => void;
}

type ModalStep = 'select' | 'crop' | 'preview';

export function ProfilePhotoModal({
  isOpen,
  currentPhotoUrl,
  onClose,
  onPhotoUpdated,
}: ProfilePhotoModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [croppedImage, setCroppedImage] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<ModalStep>('select');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { showToast } = useToast();

  // Reset state when modal closes and prevent body scroll
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal closes
      document.body.style.overflow = '';
      setImageFile(null);
      setImagePreview('');
      setCroppedImage('');
      setCurrentStep('select');
      setError('');
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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

    // Create preview for cropping
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setCurrentStep('crop');
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImageDataUrl: string) => {
    setCroppedImage(croppedImageDataUrl);
    setCurrentStep('preview');
  };

  const handleBackToCrop = () => {
    setCurrentStep('crop');
  };

  const handleUpload = async () => {
    if (!croppedImage && !imageFile) {
      setError('Por favor selecciona una imagen');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      
      // If we have a cropped image, convert it to a File
      if (croppedImage) {
        // Convert data URL to blob
        const response = await fetch(croppedImage);
        const blob = await response.blob();
        const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
        formData.append('file', file);
      } else if (imageFile) {
        formData.append('file', imageFile);
      }

      const uploadResponse = await fetch('/api/profile/photo', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.error || 'Error al subir la foto');
      }

      const uploadData = await uploadResponse.json();
      const photoUrl = uploadData.url || null;

      showToast('Foto de perfil actualizada exitosamente', 'success');
      onPhotoUpdated(photoUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPhotoUrl) return;

    setIsUploading(true);
    setError('');

    try {
      const response = await fetch('/api/profile/photo', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar la foto');
      }

      showToast('Foto de perfil eliminada exitosamente', 'success');
      onPhotoUpdated(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la foto');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const displayImage = croppedImage || currentPhotoUrl;

  const renderContent = () => {
    if (currentStep === 'crop' && imagePreview) {
      return (
        <>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Recortar foto de perfil
            </CardTitle>
            <CardDescription>
              Ajusta la posición y el zoom de tu foto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageCropper
              image={imagePreview}
              aspect={1}
              onCropComplete={handleCropComplete}
              onCancel={() => {
                setCurrentStep('select');
                setImagePreview('');
                setImageFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            />
          </CardContent>
        </>
      );
    }

    if (currentStep === 'preview' && croppedImage) {
      return (
        <>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Vista previa
            </CardTitle>
            <CardDescription>
              Revisa tu foto antes de guardarla
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Preview */}
            <div className="flex justify-center">
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
                <Image
                  src={croppedImage}
                  alt="Foto de perfil recortada"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Subiendo...
                  </>
                ) : (
                  'Guardar foto'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleBackToCrop}
                disabled={isUploading}
                className="w-full"
              >
                Volver a recortar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep('select');
                  setCroppedImage('');
                  setImagePreview('');
                  setImageFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={isUploading}
                className="w-full"
              >
                Seleccionar otra imagen
              </Button>
            </div>
          </CardContent>
        </>
      );
    }

    // Default step: select image
    return (
      <>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Cambiar foto de perfil
          </CardTitle>
          <CardDescription>
            Selecciona una nueva imagen o elimina la actual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Preview */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
              {currentPhotoUrl ? (
                <Image
                  src={currentPhotoUrl}
                  alt="Foto de perfil"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Seleccionar imagen
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              JPG, PNG o WEBP • Máximo 5MB
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {currentPhotoUrl && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar foto'
                )}
              </Button>
            )}

            <Button
              ref={closeButtonRef}
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </>
    );
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain',
        'bg-black/70 backdrop-blur-md',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
        {renderContent()}
      </Card>
    </div>
  );
}
