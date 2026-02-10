import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/feed/[id]/metadata
 * Public endpoint to get post metadata for social sharing
 * This endpoint doesn't require authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feedItemId = parseInt(id);

    if (isNaN(feedItemId)) {
      return NextResponse.json(
        { error: 'ID de publicación inválido' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS for public metadata
    const serviceClient = createServiceRoleClient();

    // Get the feed item
    const { data: feedItem, error: feedError } = await serviceClient
      .from('feed_items')
      .select('*')
      .eq('id', feedItemId)
      .single();

    if (feedError || !feedItem) {
      return NextResponse.json(
        { error: 'Publicación no encontrada' },
        { status: 404 }
      );
    }

    // Get user profile
    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .select('display_name, profile_photo_path')
      .eq('id', feedItem.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Get challenge info if exists
    let challengeTitle = '';
    if (feedItem.user_challenge_id) {
      const { data: userChallenge } = await serviceClient
        .from('user_challenges')
        .select('challenge_id')
        .eq('id', feedItem.user_challenge_id)
        .single();

      if (userChallenge?.challenge_id) {
        const { data: challenge } = await serviceClient
          .from('challenges')
          .select('title')
          .eq('id', userChallenge.challenge_id)
          .single();

        if (challenge) {
          challengeTitle = challenge.title;
        }
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calixo.app';
    const postUrl = `${baseUrl}/feed/${feedItemId}`;
    
    // Build title and description
    const title = challengeTitle 
      ? `${userData.display_name} completó: ${challengeTitle}`
      : `${userData.display_name} compartió una publicación`;
    
    const description = feedItem.note 
      ? feedItem.note.substring(0, 200)
      : `Mira esta publicación de ${userData.display_name} en Calixo`;

    // Get image URL
    let imageUrl = `${baseUrl}/icons/icon-512x512.png`;
    if (feedItem.image_url) {
      imageUrl = feedItem.image_url;
    }

    return NextResponse.json({
      title,
      description,
      image: imageUrl,
      url: postUrl,
      siteName: 'Calixo',
      type: 'article',
    });
  } catch (error: any) {
    console.error('Error fetching post metadata:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener metadata',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
