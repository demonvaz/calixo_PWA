import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';

// --- Helpers from app/api/newsletter/subscribe/route.ts ---
const subscribeSchema = z.object({
  email: z.string().email('Email inválido'),
});

const router = Router();

// Migrated from app/api/newsletter/subscribe/route.ts
router.post('/subscribe', async (req: Request, res: Response) => {
  const supabase = req.supabase!;

  try {
    const body = req.body;
    const { email } = subscribeSchema.parse(body);

    // Verificar si el email ya existe
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (existingContact) {
      // Si ya existe pero no está suscrito, actualizar
      if (!existingContact.subscribed) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ subscribed: true, updated_at: new Date().toISOString() })
          .eq('email', email.toLowerCase());

        if (updateError) {
          throw updateError;
        }

        return res.status(200).json({ message: 'Te has vuelto a suscribir correctamente' });
      }

      return res.status(400).json({ error: 'Este email ya está suscrito a nuestra newsletter' });
    }

    // Crear nuevo contacto
    const { error: insertError } = await supabase
      .from('contacts')
      .insert({
        email: email.toLowerCase(),
        subscribed: true,
        source: 'newsletter',
      });

    if (insertError) {
      throw insertError;
    }

    return res.status(201).json({ message: 'Te has suscrito correctamente a nuestra newsletter' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }

    console.error('Error al suscribirse a newsletter:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;