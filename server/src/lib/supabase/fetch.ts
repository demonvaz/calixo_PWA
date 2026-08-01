/**
 * Create a custom fetch that ignores SSL certificate errors when APP_ENV = CAJA
 * This is needed when working behind a VPN that intercepts SSL connections
 * 
 * This function should be used by all Supabase clients when APP_ENV = CAJA
 * to bypass SSL certificate validation issues caused by VPN interception
 * 
 * Note: This only works in Node.js runtime, not in Edge Runtime
 */
export function createCustomFetch(): typeof fetch {
  const appEnv = process.env.APP_ENV;
  
  // Only disable SSL verification when APP_ENV = CAJA
  if (appEnv === 'CAJA') {
    // Check if we're in Node.js runtime (not Edge Runtime)
    // Edge Runtime doesn't have process.versions.node
    const isNodeRuntime = typeof process !== 'undefined' && process.versions?.node;
    
    if (!isNodeRuntime) {
      // Edge Runtime: can't disable SSL, return default fetch
      return globalThis.fetch;
    }
    
    // Node.js runtime: Return a custom fetch that ignores SSL certificate errors
    return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      // Handle different URL types
      let urlString: string;
      let requestInit: RequestInit | undefined = init;
      
      if (url instanceof Request) {
        urlString = url.url;
        // Merge headers and other properties from Request object
        requestInit = {
          method: url.method,
          headers: url.headers,
          body: url.body,
          ...init,
        };
      } else if (url instanceof URL) {
        urlString = url.toString();
      } else {
        urlString = url;
      }
      
      // Use NODE_TLS_REJECT_UNAUTHORIZED to disable SSL verification
      // This is the most compatible approach that works in Node.js runtime
      const originalReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      
      try {
        return await fetch(urlString, requestInit);
      } finally {
        // Restore original value
        if (originalReject !== undefined) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalReject;
        } else {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        }
      }
    };
  }

  // Return the default fetch for other environments
  return globalThis.fetch;
}

