import multer from 'multer';

/**
 * In-memory storage: we forward the buffer straight to Supabase Storage,
 * same as the Next.js routes did with `request.formData()`.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, same limit as the original routes
});
