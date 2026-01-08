import type { NextApiRequest, NextApiResponse } from 'next';
import { APP_URL } from '@/lib/framesConfig';

/**
 * Farcaster Mini App Manifest
 * Served at /.well-known/farcaster.json via rewrite in next.config.ts
 * This allows Farcaster to properly identify the application details
 * 
 * Format per Farcaster Mini App specification:
 * https://miniapps.farcaster.xyz/docs/specification
 * 
 * IMPORTANT: To generate the accountAssociation object:
 * 1. Open Farcaster Mobile App
 * 2. Go to Settings > Developer > Domains
 * 3. Enter your domain
 * 4. Select "Generate Domain Manifest"
 * 5. Copy the generated accountAssociation object
 * 6. Set these environment variables:
 *    - FARCASTER_ACCOUNT_ASSOCIATION_HEADER
 *    - FARCASTER_ACCOUNT_ASSOCIATION_PAYLOAD
 *    - FARCASTER_ACCOUNT_ASSOCIATION_SIGNATURE
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract domain from APP_URL
  const domain = new URL(APP_URL).hostname;

  const manifest: {
    accountAssociation: {
      header: string;
      payload: string;
      signature: string;
    };
    miniapp: {
      version: string;
      name: string;
      description: string;
      iconUrl: string;
      homeUrl: string;
      canonicalDomain: string;
      imageUrl?: string;
      buttonTitle?: string;
      splashImageUrl?: string;
      splashBackgroundColor?: string;
      subtitle?: string;
      screenshotUrls?: string[];
      primaryCategory?: string;
      tags?: string[];
      heroImageUrl?: string;
      tagline?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImageUrl?: string;
      castShareUrl?: string;
    };
  } = {
    // accountAssociation is REQUIRED - Generated via Farcaster Mobile App
    // Settings > Developer > Domains > Generate Domain Manifest
    // For now, using placeholder values - MUST be replaced with actual values
    accountAssociation: {
      header: process.env.FARCASTER_ACCOUNT_ASSOCIATION_HEADER || '',
      payload: process.env.FARCASTER_ACCOUNT_ASSOCIATION_PAYLOAD || '',
      signature: process.env.FARCASTER_ACCOUNT_ASSOCIATION_SIGNATURE || '',
    },
    miniapp: {
      version: '1',
      name: 'Into The Void',
      description: 'Into The Void - January 17th event',
      iconUrl: `${APP_URL}/void-icon.png`,
      homeUrl: APP_URL,
      canonicalDomain: domain,
      // Recommended fields for better discovery and presentation
      imageUrl: `${APP_URL}/void-icon.png`,
      buttonTitle: 'Enter The Void',
      splashImageUrl: `${APP_URL}/void-icon.png`,
      splashBackgroundColor: '#000000',
      subtitle: 'Into The Void', // Max 30 chars
      tagline: 'January 17th', // Max 30 chars
      ogTitle: 'Into The Void', // Max 30 chars
      ogDescription: 'Into The Void - January 17th event', // Max 100 chars
      ogImageUrl: `${APP_URL}/void-icon.png`,
      // Optional categorization
      primaryCategory: 'social',
      tags: ['event', 'detroit', 'farcaster', 'miniapp'],
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json(manifest);
}
