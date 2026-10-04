import { useEffect, useState } from 'react';

export const money = cents => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);

export async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method, signal,
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Unable to reach the server. Check that it is running and try again.');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) {
    const error = new Error(data?.error || 'Unable to load this quote. Please try again.');
    error.fields = data?.fields || {};
    throw error;
  }
  return data;
}

// List, detail and edit share the same loading/error handling.
export function useResource(path) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: '' });
    request(path, { signal: controller.signal })
      .then(data => setState({ data, loading: false, error: '' }))
      .catch(error => {
        if (error.name !== 'AbortError') setState({ data: null, loading: false, error: error.message });
      });
    return () => controller.abort();
  }, [path]);
  return state;
}
