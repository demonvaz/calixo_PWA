import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for updating profile
const updateProfileSchema = z.object({
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre no puede exceder 50 caracteres').optional(),
  isPrivate: z.boolean().optional(),
  gender: z.enum(['femenino', 'masculino', 'no_responder']).optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD').optional().nullable(),
  email: z.string().email('El email no es válido').optional(),
});

/**
 * GET /api/profile
 * Get the current user's profile
 * Creates profile automatically if it doesn't exist
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Get user from database using Supabase
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // If user doesn't exist, create it automatically
    if (userError || !userData) {
      // Get display name from user metadata or use email prefix as fallback
      const displayName = 
        (user.user_metadata?.display_name as string) ||
        user.email?.split('@')[0] ||
        'Usuario';

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          display_name: displayName,
          avatar_energy: 100,
          is_private: false,
          is_premium: false,
          coins: 0,
          streak: 0,
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Error al crear el usuario' },
          { status: 500 }
        );
      }

      userData = newUser;
    }

    // Get profile photo URL if exists
    let profilePhotoUrl: string | null = null;
    if (userData.profile_photo_path) {
      const pathParts = userData.profile_photo_path.split('/');
      if (pathParts.length > 1) {
        const bucket = pathParts[0];
        const filePath = pathParts.slice(1).join('/');
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        profilePhotoUrl = publicUrl;
      }
    }

    // Get stats
    const { count: challengesCompleted } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const { count: followersCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    const { count: followingCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    return NextResponse.json({
      profile: {
        userId: userData.id,
        displayName: userData.display_name,
        avatarEnergy: userData.avatar_energy,
        isPrivate: userData.is_private,
        isPremium: userData.is_premium,
        coins: userData.coins,
        streak: userData.streak,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        profilePhotoUrl: profilePhotoUrl,
        profilePhotoPath: userData.profile_photo_path || null,
        email: user.email || null,
        gender: userData.gender || null,
        birthDate: userData.birth_date || null,
      },
      stats: {
        challengesCompleted: challengesCompleted || 0,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Error al obtener el perfil' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update the current user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedFields = updateProfileSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: validatedFields.error.errors[0].message },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (validatedFields.data.displayName !== undefined) {
      const newDisplayName = validatedFields.data.displayName.trim();
      
      // Check if display name is being changed
      const { data: currentUser } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .single();

      if (currentUser?.display_name !== newDisplayName) {
        // Check if new display name is already taken
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('display_name', newDisplayName)
          .neq('id', user.id)
          .single();

        if (existingUser) {
          return NextResponse.json(
            { error: 'Este nombre de usuario ya está en uso' },
            { status: 400 }
          );
        }
      }

      updateData.display_name = newDisplayName;
    }
    if (validatedFields.data.isPrivate !== undefined) {
      updateData.is_private = validatedFields.data.isPrivate;
    }
    if (validatedFields.data.gender !== undefined) {
      updateData.gender = validatedFields.data.gender;
    }
    if (validatedFields.data.birthDate !== undefined) {
      updateData.birth_date = validatedFields.data.birthDate || null;
    }
    updateData.updated_at = new Date().toISOString();

    // Si se quiere cambiar el email, actualizar en Supabase Auth
    if (validatedFields.data.email && validatedFields.data.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: validatedFields.data.email,
      });
      
      if (emailError) {
        return NextResponse.json(
          { error: 'Error al actualizar el email: ' + emailError.message },
          { status: 400 }
        );
      }
    }

    // Update user using Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      return NextResponse.json(
        { error: 'Error al actualizar el perfil' },
        { status: 500 }
      );
    }

    // Update display_name in auth metadata to keep it in sync
    if (validatedFields.data.displayName !== undefined) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          display_name: validatedFields.data.displayName.trim(),
        },
      });

      if (authUpdateError) {
        console.error('Error updating auth metadata:', authUpdateError);
        // Don't fail the request if auth metadata update fails, but log it
        // The users table update was successful, which is the most important
      }
    }

    // Get profile photo URL if exists
    let profilePhotoUrl: string | null = null;
    if (updatedUser.profile_photo_path) {
      const pathParts = updatedUser.profile_photo_path.split('/');
      if (pathParts.length > 1) {
        const bucket = pathParts[0];
        const filePath = pathParts.slice(1).join('/');
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        profilePhotoUrl = publicUrl;
      }
    }

    // Get updated user from auth to get latest email
    const { data: { user: updatedAuthUser } } = await supabase.auth.getUser();

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      profile: {
        userId: updatedUser.id,
        displayName: updatedUser.display_name,
        avatarEnergy: updatedUser.avatar_energy,
        isPrivate: updatedUser.is_private,
        isPremium: updatedUser.is_premium,
        coins: updatedUser.coins,
        streak: updatedUser.streak,
        updatedAt: updatedUser.updated_at,
        profilePhotoUrl: profilePhotoUrl,
        profilePhotoPath: updatedUser.profile_photo_path || null,
        email: updatedAuthUser?.email || user.email || null,
        gender: updatedUser.gender || null,
        birthDate: updatedUser.birth_date || null,
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el perfil' },
      { status: 500 }
    );
  }
}

