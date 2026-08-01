import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { createServiceRoleClient } from '../lib/supabase/server';

const router = Router();

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Migrated from app/api/upload/route.ts
// POST /api/upload  (multipart/form-data, field name: "file")
router.post('/', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    if (!VALID_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Tipo de archivo no válido. Solo JPG, PNG o WEBP' });
    }

    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB' });
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.originalname.split('.').pop() || 'jpg';
    const filename = `${user.id}/${timestamp}-${randomString}.${extension}`;

    const serviceClient = createServiceRoleClient();
    const { data, error } = await serviceClient.storage
      .from('challenge-images')
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      if (error.message?.includes('Bucket not found') || (error as any).statusCode === '404') {
        return res.status(500).json({
          error:
            'El bucket de almacenamiento no existe. Por favor, crea el bucket "challenge-images" en Supabase Storage.',
          details: 'Consulta la documentación en docs/setup/CHALLENGE_IMAGES_SETUP.md',
        });
      }
      if (error.message?.includes('row-level security') || (error as any).statusCode === '403') {
        return res.status(500).json({
          error:
            'Error de permisos. Verifica que las políticas RLS estén configuradas correctamente en Supabase Storage.',
          details: error.message || 'Error desconocido',
        });
      }
      return res.status(500).json({ error: 'Error al subir la imagen', details: error.message || 'Error desconocido' });
    }

    const { data: { publicUrl } } = supabase.storage.from('challenge-images').getPublicUrl(data.path);

    return res.json({ url: publicUrl, path: data.path });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: 'Error al procesar la imagen',
      details: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

export default router;
