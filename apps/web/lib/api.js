let refreshPromise = null;

/**
 * کلاینت API — با تمدید خودکار نشست در صورت انقضای access token.
 */
export async function api(path, { method = 'GET', body } = {}) {
  const doFetch = () =>
    fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch();

  if (res.status === 401 && !path.startsWith('/auth/')) {
    refreshPromise ||= fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      refreshPromise = null;
    });
    const refreshRes = await refreshPromise;
    if (refreshRes.ok) {
      res = await doFetch();
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || 'خطا در ارتباط با سرور');
    error.status = res.status;
    throw error;
  }
  return data;
}
