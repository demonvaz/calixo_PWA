import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/permissions';

const BANNERS_BUCKET = 'banners';
const DEFAULT_IMAGE = '/photos/back.PNG';

/**
 * POST /api/admin/banners/upload
 * Sube una imagen al bucket 'banners' de Supabase Storage.
 * Crear el bucket en Supabase Dashboard > Storage > New bucket > "banners" (public).
 */
export async function POST(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo no válido. Solo JPG, PNG o WEBP' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Máximo 5MB' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `banner-${timestamp}-${random}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BANNERS_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Banner upload error:', uploadError);
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('404')) {
        return NextResponse.json(
          { error: 'Crea el bucket "banners" en Supabase Storage (público)' },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: uploadError.message || 'Error al subir' },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BANNERS_BUCKET)
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      url: publicUrl,
      path: `${BANNERS_BUCKET}/${uploadData.path}`,
    });
  } catch (err) {
    console.error('Banner upload error:', err);
    return NextResponse.json({ error: 'Error al procesar la imagen' }, { status: 500 });
  }
}
