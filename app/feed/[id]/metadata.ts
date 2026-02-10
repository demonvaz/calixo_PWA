import { Metadata } from 'next';

/**
 * Generate metadata for a feed post page
 * This will be used by Next.js to generate Open Graph and Twitter Card tags
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  try {
    // Fetch post data for metadata
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calixo.app';
    const postUrl = `${baseUrl}/feed/${id}`;
    
    // Try to fetch post data (this might fail if not authenticated, so we provide defaults)
    let postTitle = 'Publicación en Calixo';
    let postDescription = 'Mira esta publicación en Calixo - Desconexión Digital';
    let postImage = `${baseUrl}/icons/icon-512x512.png`;

    try {
      // In a real implementation, you might want to create a public endpoint
      // or use server-side rendering to fetch this data
      // For now, we'll use default values
    } catch (error) {
      // Use defaults if fetch fails
    }

    return {
      title: postTitle,
      description: postDescription,
      openGraph: {
        title: postTitle,
        description: postDescription,
        url: postUrl,
        siteName: 'Calixo',
        images: [
          {
            url: postImage,
            width: 1200,
            height: 630,
            alt: postTitle,
          },
        ],
        locale: 'es_ES',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: postTitle,
        description: postDescription,
        images: [postImage],
      },
      alternates: {
        canonical: postUrl,
      },
    };
  } catch (error) {
    // Return basic metadata if generation fails
    return {
      title: 'Publicación en Calixo',
      description: 'Mira esta publicación en Calixo',
    };
  }
}
