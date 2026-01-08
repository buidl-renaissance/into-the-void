import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/db/user';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface SDKUser {
  fid: number | string;
  username?: string;
  displayName?: string;
  display_name?: string; // Farcaster SDK might use snake_case
  pfpUrl?: string;
  pfp_url?: string; // Farcaster SDK might use snake_case
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to authenticate user from SDK context
  const authenticateFromSDK = async (sdkUser: SDKUser) => {
    try {
      console.log('🔐 Authenticating with SDK user:', sdkUser);
      
      // Normalize user data - use pfpUrl or pfp_url, displayName or display_name
      const normalizedData = {
        fid: String(sdkUser.fid),
        username: sdkUser.username,
        displayName: sdkUser.displayName || sdkUser.display_name,
        pfpUrl: sdkUser.pfpUrl || sdkUser.pfp_url,
      };
      
      // Send user data to backend to create/verify user and get session
      const authResponse = await fetch('/api/auth/miniapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedData),
      });
      
      console.log('Auth response status:', authResponse.status);
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('Auth response data:', authData);
        if (authData.user) {
          console.log('✅ User authenticated successfully:', authData.user);
          setUser(authData.user);
          setError(null);
          return true;
        } else {
          console.warn('⚠️ Auth response OK but no user in response');
        }
      } else {
        const errorText = await authResponse.text();
        console.error('❌ Failed to authenticate with SDK user:', authResponse.status, errorText);
        return false;
      }
    } catch (err) {
      console.error('❌ Error authenticating from SDK:', err);
      return false;
    }
    return false;
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // First, try to get user from Farcaster Mini App SDK context
        // The SDK provides user context when the mini app is opened in Warpcast
        if (typeof window !== 'undefined') {
          try {
            // Method 1: Use the imported SDK from @farcaster/miniapp-sdk
            try {
              const sdkModule = await import('@farcaster/miniapp-sdk');
              const sdk = sdkModule.sdk;
              
              // Try to get user from SDK context
              if (sdk && sdk.context) {
                try {
                  // Context might be a promise or direct object
                  let context: unknown;
                  if (typeof sdk.context.then === 'function') {
                    context = await sdk.context;
                  } else {
                    context = sdk.context;
                  }
                  
                  // Type guard to check if context has user property
                  if (context && typeof context === 'object' && 'user' in context) {
                    const contextWithUser = context as { user?: SDKUser | Record<string, unknown> };
                    if (contextWithUser.user) {
                      // Normalize user object - handle both camelCase and snake_case
                      const rawUser = contextWithUser.user as Record<string, unknown>;
                      const normalizedUser: SDKUser = {
                        fid: rawUser.fid as number | string,
                        username: rawUser.username as string | undefined,
                        displayName: (rawUser.displayName || rawUser.display_name) as string | undefined,
                        pfpUrl: (rawUser.pfpUrl || rawUser.pfp_url) as string | undefined,
                      };
                      
                      if (normalizedUser.fid) {
                        console.log('✅ Found user in SDK context:', normalizedUser);
                        const authenticated = await authenticateFromSDK(normalizedUser);
                        if (authenticated) {
                          setIsLoading(false);
                          return;
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.log('⚠️ Error accessing SDK context:', e);
                }
              }
            } catch (importError) {
              console.log('⚠️ Could not import SDK:', importError);
            }
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = window as any;
            
            // Check for SDK stored by early detection script
            if (win.__FARCASTER_USER__) {
              console.log('✅ Found user from early detection:', win.__FARCASTER_USER__);
              const authenticated = await authenticateFromSDK(win.__FARCASTER_USER__);
              if (authenticated) {
                setIsLoading(false);
                return;
              }
            }
            
            // Listen for custom event from early detection
            const userEventHandler = (event: Event) => {
              const customEvent = event as CustomEvent<SDKUser>;
              console.log('📨 Received farcaster:user event:', customEvent.detail);
              if (customEvent.detail) {
                authenticateFromSDK(customEvent.detail);
              }
            };
            window.addEventListener('farcaster:user', userEventHandler);
            
            // Log all possible SDK locations for debugging
            console.log('🔍 Checking for SDK on window:', {
              hasFarcaster: !!win.farcaster,
              hasRenaissanceAuthContext: !!win.__renaissanceAuthContext,
              hasGetRenaissanceAuth: typeof win.getRenaissanceAuth === 'function',
              hasFarcasterSDK: !!win.FarcasterSDK,
              hasSDK: !!win.sdk,
              hasEarlySDK: !!win.__FARCASTER_SDK__,
              hasEarlyUser: !!win.__FARCASTER_USER__,
              allWindowKeys: Object.keys(win).filter((k: string) => 
                k.toLowerCase().includes('farcaster') || 
                k.toLowerCase().includes('sdk') ||
                k.toLowerCase().includes('renaissance') ||
                k.startsWith('__FARCASTER')
              ),
            });
            
            // Method 2: Use RPC - window.farcaster?.context (Fallback)
            if (win.farcaster && win.farcaster.context) {
              try {
                console.log('🔍 Trying window.farcaster.context (RPC method)...');
                const context = await win.farcaster.context;
                if (context && context.user && context.user.fid > 0) {
                  console.log('✅ User found via window.farcaster.context:', context.user);
                  const authenticated = await authenticateFromSDK(context.user);
                  if (authenticated) {
                    setIsLoading(false);
                    return;
                  }
                }
              } catch (e) {
                console.log('⚠️ Error accessing window.farcaster.context:', e);
              }
            }
            
            // Method 2: Check window.__renaissanceAuthContext (direct access)
            if (win.__renaissanceAuthContext) {
              try {
                console.log('🔍 Trying window.__renaissanceAuthContext...');
                const context = win.__renaissanceAuthContext;
                if (context && context.user && context.user.fid > 0) {
                  console.log('✅ User found via __renaissanceAuthContext:', context.user);
                  const authenticated = await authenticateFromSDK(context.user);
                  if (authenticated) {
                    setIsLoading(false);
                    return;
                  }
                }
              } catch (e) {
                console.log('⚠️ Error accessing __renaissanceAuthContext:', e);
              }
            }
            
            // Method 3: Check window.getRenaissanceAuth() function
            if (typeof win.getRenaissanceAuth === 'function') {
              try {
                console.log('🔍 Trying window.getRenaissanceAuth()...');
                const context = win.getRenaissanceAuth();
                if (context && context.user && context.user.fid > 0) {
                  console.log('✅ User found via getRenaissanceAuth():', context.user);
                  const authenticated = await authenticateFromSDK(context.user);
                  if (authenticated) {
                    setIsLoading(false);
                    return;
                  }
                }
              } catch (e) {
                console.log('⚠️ Error calling getRenaissanceAuth():', e);
              }
            }
            
            // Listen for farcaster:context:ready event (Option 2)
            const contextReadyHandler = ((event: CustomEvent) => {
              console.log('📨 Received farcaster:context:ready event:', event.detail);
              if (event.detail && event.detail.user && event.detail.user.fid > 0) {
                authenticateFromSDK(event.detail.user);
              }
            }) as EventListener;
            window.addEventListener('farcaster:context:ready', contextReadyHandler);
            
            // Skip signIn verification - we're using context instead
            
            // Fallback: Try multiple ways to access the SDK
            // SDK is dynamically injected, so we need to use any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let sdk: any = win.__FARCASTER_SDK__ || win.farcaster || win.FarcasterSDK || win.sdk;
            
            // Also check if SDK is nested
            if (!sdk && win.window) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              sdk = (win.window as any).farcaster || (win.window as any).FarcasterSDK || (win.window as any).sdk;
            }
            
            // Try accessing context as a promise (some SDKs expose it this way)
            if (sdk) {
              console.log('✅ SDK found!', {
                sdkType: typeof sdk,
                hasContext: 'context' in sdk,
                hasContextUser: sdk.context?.user ? 'yes' : 'no',
                contextType: typeof sdk.context,
                hasQuickAuth: 'quickAuth' in sdk,
                hasIsInMiniApp: typeof sdk.isInMiniApp === 'function',
                sdkMethods: Object.keys(sdk).filter((k: string) => typeof sdk[k] === 'function'),
              });
              
              // First, check if we're in a mini app environment
              if (typeof sdk.isInMiniApp === 'function') {
                try {
                  const isMiniApp = await sdk.isInMiniApp();
                  console.log('Is in mini app:', isMiniApp);
                  if (!isMiniApp) {
                    console.log('Not in mini app environment, skipping SDK auth');
                  }
                } catch (e) {
                  console.log('isInMiniApp() failed:', e);
                }
              }
              
              // Skip Quick Auth verification - we're using context instead
              
              // Try accessing context as a property (already tried above, but keep as fallback)
              if (sdk.context && !sdk.context.user) {
                // Context might be a promise or direct object
                const context = typeof sdk.context.then === 'function' 
                  ? await sdk.context 
                  : sdk.context;
                
                if (context && context.user) {
                  console.log('✅ Found user in SDK context (fallback):', context.user);
                  const authenticated = await authenticateFromSDK(context.user);
                  if (authenticated) {
                    setIsLoading(false);
                    return;
                  }
                }
              }
              
              // Try accessing context as a method
              if (typeof sdk.getContext === 'function') {
                try {
                  const context = await sdk.getContext();
                  if (context && context.user) {
                    console.log('✅ Found user via getContext():', context.user);
                    const authenticated = await authenticateFromSDK(context.user);
                    if (authenticated) {
                      setIsLoading(false);
                      return;
                    }
                  }
                } catch (e) {
                  console.log('getContext() failed:', e);
                }
              }
              
              // Listen for context changes
              const eventNames = ['context', 'contextChange', 'contextUpdate', 'user', 'auth'];
              eventNames.forEach(eventName => {
                if (typeof sdk.on === 'function') {
                  try {
                    sdk.on(eventName, (data: unknown) => {
                      console.log(`SDK ${eventName} event:`, data);
                      const eventData = data as { user?: SDKUser } | SDKUser;
                      const user = 'user' in eventData ? eventData.user : eventData;
                      if (user && 'fid' in user && user.fid) {
                        authenticateFromSDK(user);
                      }
                    });
                  } catch {
                    // Event listener might not be supported
                  }
                }
                
                if (typeof sdk.addEventListener === 'function') {
                  try {
                    sdk.addEventListener(eventName, (data: unknown) => {
                      console.log(`SDK ${eventName} event (addEventListener):`, data);
                      const eventData = data as { user?: SDKUser } | SDKUser;
                      const user = 'user' in eventData ? eventData.user : eventData;
                      if (user && 'fid' in user && user.fid) {
                        authenticateFromSDK(user);
                      }
                    });
                  } catch {
                    // Event listener might not be supported
                  }
                }
              });
              
              // Poll for context if it becomes available
              // iOS app may inject SDK context asynchronously
              let pollCount = 0;
              const maxPolls = 40; // Poll for up to 12 seconds (40 * 300ms)
              const pollInterval = setInterval(() => {
                pollCount++;
                
                // Check direct context access
                if (sdk.context) {
                  const context = typeof sdk.context.then === 'function' 
                    ? null // Will be handled by promise
                    : sdk.context;
                  
                  if (context && context.user) {
                    console.log(`✅ SDK context available after polling (attempt ${pollCount}):`, context.user);
                    authenticateFromSDK(context.user);
                    clearInterval(pollInterval);
                    return;
                  }
                }
                
                // Try accessing context as a promise
                if (sdk.context && typeof sdk.context.then === 'function') {
                  sdk.context.then((context: { user?: SDKUser }) => {
                    if (context && context.user) {
                      console.log('✅ SDK context available via promise:', context.user);
                      authenticateFromSDK(context.user);
                      clearInterval(pollInterval);
                    }
                  }).catch(() => {
                    // Context promise rejected
                  });
                }
                
                // Check if context becomes available as a method
                if (typeof sdk.getContext === 'function') {
                  sdk.getContext().then((context: { user?: SDKUser }) => {
                    if (context && context.user) {
                      console.log(`✅ SDK context available via getContext() after polling (attempt ${pollCount}):`, context.user);
                      authenticateFromSDK(context.user);
                      clearInterval(pollInterval);
                    }
                  }).catch(() => {
                    // Context not available yet
                  });
                }
                
                if (pollCount >= maxPolls) {
                  console.log('⏱️ Polling timeout - SDK context not available after', maxPolls, 'attempts');
                  clearInterval(pollInterval);
                }
              }, 300);
            } else {
              console.log('❌ No SDK found on window object');
              console.log('💡 iOS app may inject SDK later or communicate via postMessage');
            }
            
            // Always listen for postMessage - iOS app may send user data this way
            const messageHandler = (event: MessageEvent) => {
              console.log('📨 Received postMessage:', event.data);
              try {
                const messageData = typeof event.data === 'string' 
                  ? JSON.parse(event.data) 
                  : event.data;
                
                // Check for various message formats
                if (messageData) {
                  // Format 1: { type: 'farcaster', user: {...} }
                  if (messageData.type === 'farcaster' && messageData.user) {
                    console.log('✅ User received via postMessage (format 1):', messageData.user);
                    authenticateFromSDK(messageData.user);
                    return;
                  }
                  
                  // Format 2: { user: {...} } (direct user object)
                  if (messageData.user && messageData.user.fid) {
                    console.log('✅ User received via postMessage (format 2):', messageData.user);
                    authenticateFromSDK(messageData.user);
                    return;
                  }
                  
                  // Format 3: Direct user object
                  if (messageData.fid && !messageData.type) {
                    console.log('✅ User received via postMessage (format 3):', messageData);
                    authenticateFromSDK(messageData);
                    return;
                  }
                }
              } catch {
                // Not JSON or not user data
              }
            };
            window.addEventListener('message', messageHandler);
            
            // Also listen for custom events that might be dispatched
            window.addEventListener('farcaster:context', ((event: CustomEvent) => {
              console.log('📨 Received farcaster:context event:', event.detail);
              if (event.detail && event.detail.user) {
                authenticateFromSDK(event.detail.user);
              }
            }) as EventListener);
          } catch (sdkError) {
            console.error('❌ Error checking SDK context:', sdkError);
            // Continue with other authentication methods
          }
        }
        
        // Wait longer for SDK to be injected by iOS app
        // iOS app may inject SDK after page load, so we wait and check multiple times
        console.log('⏳ Waiting for SDK to be available...');
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Re-check for SDK on each iteration
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const win = window as any;
          const sdk = win.__FARCASTER_SDK__ || win.farcaster || win.FarcasterSDK || win.sdk;
          
          if (sdk && sdk.context && sdk.context.user) {
            console.log(`✅ SDK context found on attempt ${i + 1}:`, sdk.context.user);
            const authenticated = await authenticateFromSDK(sdk.context.user);
            if (authenticated) {
              setIsLoading(false);
              return;
            }
          }
          
          // Also check if user was set by early detection
          if (win.__FARCASTER_USER__) {
            console.log(`✅ User from early detection found on attempt ${i + 1}:`, win.__FARCASTER_USER__);
            const authenticated = await authenticateFromSDK(win.__FARCASTER_USER__);
            if (authenticated) {
              setIsLoading(false);
              return;
            }
          }
        }
        console.log('⏱️ Finished waiting for SDK');
        
        // Fallback: Check for userId in URL query parameters (from frame post_redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        
        // Build API URL with userId if present
        const apiUrl = userId ? `/api/user/me?userId=${userId}` : '/api/user/me';
        
        console.log('📡 Fetching user from API:', apiUrl);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        
        const data = await response.json();
        console.log('📡 API response:', data);
        
        if (data.user) {
          console.log('✅ User found from API:', data.user);
        setUser(data.user);
        } else {
          console.log('ℹ️ No user in API response');
        }
        
        // If user was found via URL param, clean up the URL
        if (data.user && userId) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
