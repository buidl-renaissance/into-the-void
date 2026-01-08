import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById } from '@/db/user';
import { NEYNAR_API_KEY } from '@/lib/framesConfig';
import { getOrCreateUserByFid, upsertFarcasterAccount } from '@/db/user';

type ResponseData = {
  user: {
    id: string;
    fid: string;
    username: string | null;
    displayName: string | null;
    pfpUrl: string | null;
  } | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ user: null });
  }

  try {
    // For GET requests, try to get user from Quick Auth token, URL query parameter, or cookie
    let user: Awaited<ReturnType<typeof getUserById>> = null;
    let source: string | null = null;

    // First, try Quick Auth token from Authorization header (from sdk.quickAuth.fetch)
    const authHeader = req.headers.authorization;
    if (!user && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Attempting to verify Quick Auth token...');
      
      if (NEYNAR_API_KEY && NEYNAR_API_KEY !== 'replace-with-neynar-api-key') {
        try {
          const verifyResponse = await fetch('https://api.neynar.com/v2/farcaster/quick-auth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api_key': NEYNAR_API_KEY,
            },
            body: JSON.stringify({ token }),
          });

          if (verifyResponse.ok) {
            const verifiedData = await verifyResponse.json();
            if (verifiedData.valid && verifiedData.fid) {
              const fid = String(verifiedData.fid);
              user = await getOrCreateUserByFid(fid, {
                fid,
                username: verifiedData.username,
                displayName: verifiedData.display_name,
                pfpUrl: verifiedData.pfp_url,
              });
              
              if (verifiedData.username) {
                await upsertFarcasterAccount(user.id, {
                  fid,
                  username: verifiedData.username,
                });
              }
              
              source = 'quick_auth';
              console.log('✅ User authenticated via Quick Auth:', { fid, username: verifiedData.username });
            }
          }
        } catch (verifyError) {
          console.error('Quick Auth verification failed:', verifyError);
        }
      }
    }

    // Try to get from URL query parameter
    if (!user && req.query.userId && typeof req.query.userId === 'string') {
      console.log('Attempting to get user from query param:', req.query.userId);
      user = await getUserById(req.query.userId);
      source = user ? 'query_param' : null;
    }

    // If still not available, try to get from session cookie
    if (!user) {
      const cookies = req.headers.cookie || '';
      console.log('Cookies received:', cookies ? 'present' : 'none');
      const sessionMatch = cookies.match(/user_session=([^;]+)/);
      
      if (sessionMatch && sessionMatch[1]) {
        const userId = sessionMatch[1];
        console.log('Attempting to get user from cookie:', userId);
        user = await getUserById(userId);
        source = user ? 'cookie' : null;
        if (!user) {
          console.log('User not found in database for cookie userId:', userId);
        }
      } else {
        console.log('No user_session cookie found');
      }
    }

    if (user) {
      console.log(`✅ User found via ${source}:`, { id: user.id, fid: user.fid, username: user.username });
    } else {
      console.log('❌ No user found in /api/user/me');
      console.log('  - Query params:', req.query);
      console.log('  - This is expected if user hasn\'t authenticated via frame yet');
    }

    if (!user) {
      return res.status(200).json({ user: null });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        fid: user.fid,
        username: user.username ?? null,
        displayName: user.displayName ?? null,
        pfpUrl: user.pfpUrl ?? null,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ user: null });
  }
}
