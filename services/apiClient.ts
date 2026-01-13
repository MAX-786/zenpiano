import { useAuthStore } from '../store/authStore';

const API_BASE = '/api';

// Track ongoing refresh to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Refresh the access token using refresh token
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();

  if (!refreshToken) {
    logout();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      const error = await response.json();
      
      // If refresh token is invalid/expired, logout
      if (error.code === 'REFRESH_TOKEN_INVALID' || error.code === 'REFRESH_TOKEN_EXPIRED') {
        logout();
        return null;
      }
      
      throw new Error(error.message || 'Token refresh failed');
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken, data.expiresIn);
    
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh error:', error);
    logout();
    return null;
  }
};

/**
 * Enhanced fetch with automatic token refresh
 */
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const { accessToken, refreshToken, shouldRefreshToken, isTokenExpired, logout } = useAuthStore.getState();

  // If no tokens, just make the request (might be public endpoint)
  if (!accessToken) {
    return fetch(url, options);
  }

  // Check if token needs refresh
  if (isTokenExpired() || shouldRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true;
      
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      
      if (newToken) {
        onRefreshed(newToken);
      } else {
        // Refresh failed, logout and throw error
        logout();
        throw new Error('Authentication expired. Please log in again.');
      }
    } else {
      // Wait for ongoing refresh to complete
      const newToken = await new Promise<string>((resolve) => {
        addRefreshSubscriber((token: string) => {
          resolve(token);
        });
      });
      
      if (!newToken) {
        throw new Error('Authentication expired. Please log in again.');
      }
    }
  }

  // Get the latest token (might have been refreshed)
  const currentToken = useAuthStore.getState().accessToken;

  // Add auth header
  const headers = {
    ...options.headers,
    ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
  };

  // Make the request
  const response = await fetch(url, { ...options, headers });

  // If 401 and we have a refresh token, try to refresh and retry
  if (response.status === 401 && refreshToken) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Retry with new token
      const retryHeaders = {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`,
      };
      return fetch(url, { ...options, headers: retryHeaders });
    } else {
      logout();
      throw new Error('Authentication expired. Please log in again.');
    }
  }

  return response;
};

/**
 * Helper for JSON requests
 */
export const apiRequest = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await apiFetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
};

/**
 * Auto-refresh token on app start if needed
 */
export const initializeAuth = async () => {
  const { isAuthenticated, shouldRefreshToken, isTokenExpired, refreshToken } = useAuthStore.getState();

  if (isAuthenticated && refreshToken && (isTokenExpired() || shouldRefreshToken())) {
    await refreshAccessToken();
  }
};
