# Configuración de Imágenes de Retos

Esta guía explica cómo configurar el almacenamiento de imágenes de retos en Supabase Storage.

## 1. Crear Bucket en Supabase Storage

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Storage** en el menú lateral
3. Haz clic en **New bucket**
4. Configura el bucket con los siguientes valores:
   - **Name**: `challenge-images`
   - **Public bucket**: ✅ Marcado (para que las imágenes sean accesibles públicamente)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

## 2. Configurar Políticas RLS (Row Level Security)

⚠️ **IMPORTANTE**: Las políticas RLS deben configurarse en la tabla `storage.objects`, no directamente en el bucket.

Ve a **Storage** → **Policies** en el dashboard de Supabase y crea las siguientes políticas:

### Política para INSERT (subir imágenes)

```sql
CREATE POLICY "Users can upload their own challenge images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'challenge-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Política para SELECT (ver imágenes)

```sql
CREATE POLICY "Anyone can view challenge images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'challenge-images');
```

### Política para DELETE (eliminar imágenes)

```sql
CREATE POLICY "Users can delete their own challenge images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'challenge-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## 3. Verificar la Configuración

Una vez completados los pasos anteriores:

1. ✅ El bucket `challenge-images` debe existir en Storage
2. ✅ Las políticas RLS deben estar configuradas en `storage.objects`
3. ✅ El bucket debe ser público

## 4. Solución de Problemas

### Error: "Bucket not found"
- Verifica que el bucket `challenge-images` existe en Storage
- Verifica que el nombre del bucket es exactamente `challenge-images` (sin espacios, con guión)

### Error: "new row violates row-level security policy"
- Verifica que las políticas RLS están configuradas en `storage.objects`
- Verifica que el usuario está autenticado
- Verifica que la estructura de carpetas coincide: `{user_id}/{timestamp}-{random}.{ext}`

### Error: "Permission denied"
- Verifica que el bucket es público o que las políticas RLS permiten acceso
- Verifica que el usuario tiene permisos para escribir en su carpeta

## Estructura de Archivos

Las imágenes se almacenan en Supabase Storage con la siguiente estructura:
```
challenge-images/
  └── {user_id}/
      ├── {timestamp}-{random}.jpg
      ├── {timestamp}-{random}.png
      └── {timestamp}-{random}.webp
```
