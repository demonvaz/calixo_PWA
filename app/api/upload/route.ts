import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

/**
 * POST /api/upload
 * Upload an image to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario está autenticado correctamente
    console.log('Uploading for user:', user.id);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Solo JPG, PNG o WEBP' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    // Nota: Las imágenes ya deberían estar comprimidas en el cliente,
    // pero mantenemos esta validación como medida de seguridad
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    // IMPORTANTE: El formato debe ser {user_id}/filename.ext para que la política RLS funcione
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${user.id}/${timestamp}-${randomString}.${extension}`;
    
    console.log('Uploading file:', filename);

    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    // Usar service role client para bypass RLS (ya validamos autenticación arriba)
    // Esto es seguro porque ya verificamos que el usuario está autenticado
    const serviceClient = createServiceRoleClient();
    const { data, error } = await serviceClient.storage
      .from('challenge-images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Provide more specific error messages
      if (error.message?.includes('Bucket not found') || error.statusCode === '404') {
        return NextResponse.json(
          { 
            error: 'El bucket de almacenamiento no existe. Por favor, crea el bucket "challenge-images" en Supabase Storage.',
            details: 'Consulta la documentación en docs/setup/CHALLENGE_IMAGES_SETUP.md'
          },
          { status: 500 }
        );
      }
      
      if (error.message?.includes('row-level security') || error.statusCode === '403') {
        return NextResponse.json(
          { 
            error: 'Error de permisos. Verifica que las políticas RLS estén configuradas correctamente en Supabase Storage.',
            details: error.message || 'Error desconocido'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Error al subir la imagen',
          details: error.message || 'Error desconocido'
        },
        { status: 500 }
      );
    }

    // Get public URL usando el cliente normal (no necesita service role)
    const { data: { publicUrl } } = supabase.storage
      .from('challenge-images')
      .getPublicUrl(data.path);

    return NextResponse.json({
      url: publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Error al procesar la imagen',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}






