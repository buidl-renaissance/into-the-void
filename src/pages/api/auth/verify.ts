import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrCreateUserByFid, upsertFarcasterAccount } from '@/db/user';
import { NEYNAR_API_KEY } from '@/lib/framesConfig';

/**
 * Verify Quick Auth JWT from Farcaster Mini App SDK
 * This endpoint verifies JWTs obtained via Quick Auth or SIWF
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, message, signature, authMethod } = req.body as { 
      token?: string; 
      message?: string; 
      signature?: string; 
      authMethod?: string;
    };

    if (!NEYNAR_API_KEY || NEYNAR_API_KEY === 'replace-with-neynar-api-key') {
      console.log('⚠️ NEYNAR_API_KEY not set - cannot verify authentication');
      return res.status(500).json({ 
        error: 'Server configuration error: NEYNAR_API_KEY not set' 
      });
    }

    let fid: string;
    let username: string | undefined;
    let displayName: string | undefined;
    let pfpUrl: string | undefined;

    // Handle signIn method (message + signature)
    if (message && signature) {
      console.log('Verifying signIn message + signature...');
      console.log('Message:', message);
      console.log('Signature:', signature);
      console.log('Auth method:', authMethod);
      
      // The message from signIn() is typically in hex format
      // Try verifying using Neynar's frame validation endpoint (similar format)
      // or use the messageBytesInHex format
      const messageBytesInHex = typeof message === 'string' && !message.startsWith('0x') 
        ? message 
        : typeof message === 'string' && message.startsWith('0x')
        ? message.slice(2)
        : message;
      
      // Verify signed message using Neynar API
      // Try frame validation endpoint first (works for similar message formats)
      const verifyResponse = await fetch('https://api.neynar.com/v2/farcaster/frame/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': NEYNAR_API_KEY,
        },
        body: JSON.stringify({ 
          messageBytesInHex: messageBytesInHex,
        }),
      });

      // If frame validation doesn't work, try alternative endpoints
      if (!verifyResponse.ok) {
        console.log('Frame validation failed, trying alternative verification...');
        // Try using the signer endpoint or other verification methods
        // For now, we'll extract user info from the message if possible
        // In production, you'd want to use the proper SIWF verification endpoint
        const errorText = await verifyResponse.text();
        console.error('Neynar message verification failed:', errorText);
        
        // Fallback: Try to parse message if it contains user info
        // This is a temporary solution - proper verification should be implemented
        return res.status(501).json({ 
          error: 'SIWF message verification not fully implemented. Please use Quick Auth (token) instead.' 
        });
      }

      const verifiedData = await verifyResponse.json();
      
      // Extract user information from validated message
      if (verifiedData.valid && verifiedData.action?.interactor) {
        const interactor = verifiedData.action.interactor;
        fid = String(interactor.fid);
        username = interactor.username;
        displayName = interactor.display_name;
        pfpUrl = interactor.pfp_url;
      } else {
        return res.status(401).json({ error: 'Invalid message payload' });
      }
    } 
    // Handle Quick Auth JWT token
    else if (token) {
      console.log('Verifying Quick Auth JWT token...');
      
      // Verify the JWT with Neynar
      const verifyResponse = await fetch('https://api.neynar.com/v2/farcaster/quick-auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': NEYNAR_API_KEY,
        },
        body: JSON.stringify({ token }),
      });

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.error('Neynar JWT verification failed:', errorText);
        return res.status(401).json({ error: 'Invalid token' });
      }

      const verifiedData = await verifyResponse.json();
      
      // Extract user information from verified token
      if (!verifiedData.valid || !verifiedData.fid) {
        return res.status(401).json({ error: 'Invalid token payload' });
      }

      fid = String(verifiedData.fid);
      username = verifiedData.username;
      displayName = verifiedData.display_name;
      pfpUrl = verifiedData.pfp_url;
    } else {
      return res.status(400).json({ error: 'Either token or message+signature is required' });
    }

    // Get or create user in database
    const user = await getOrCreateUserByFid(fid, {
      fid,
      username,
      displayName,
      pfpUrl,
    });

    // Link/update Farcaster account
    if (username) {
      await upsertFarcasterAccount(user.id, {
        fid,
        username,
      });
    }

    // Set session cookie
    res.setHeader('Set-Cookie', `user_session=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`); // 24 hours

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        fid: user.fid,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
      },
    });
  } catch (error) {
    console.error('Error verifying Quick Auth token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
