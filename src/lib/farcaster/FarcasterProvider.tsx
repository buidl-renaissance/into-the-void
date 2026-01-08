import React, { useEffect, ReactNode, createContext, useContext, useState } from 'react';

interface FarcasterContextType {
  context: any;
  isLoading: boolean;
}

const FarcasterContext = createContext<FarcasterContextType>({
  context: null,
  isLoading: true,
});

interface FarcasterProviderProps {
  children: ReactNode;
}

// Client-side only component that uses the Farcaster SDK
const FarcasterSDKWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [context, setContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initSDK = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        if (!mounted) return;
        
        // Call ready() - don't await it, just call it
        // The SDK handles the postMessage internally
        sdk.actions.ready();
        
        // Access context directly from SDK
        // Give it a moment for the context to be available
        setTimeout(() => {
          if (mounted) {
            const sdkContext = sdk.context;
            setContext(sdkContext);
            setIsLoading(false);
          }
        }, 0);
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initSDK();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <FarcasterContext.Provider value={{ context, isLoading }}>
      {children}
    </FarcasterContext.Provider>
  );
};

export const FarcasterProvider: React.FC<FarcasterProviderProps> = ({ children }) => {
  // Only render the SDK wrapper on client side
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  return <FarcasterSDKWrapper>{children}</FarcasterSDKWrapper>;
};

// Hook that safely accesses the Farcaster context
export const useFarcaster = () => {
  const farcasterContext = useContext(FarcasterContext);
  
  // If we're on the server or context isn't available, return empty context
  if (typeof window === 'undefined') {
    return { context: null, isLoading: false };
  }

  return farcasterContext;
};
