import { afterEach, describe, expect, it, vi } from 'vitest';
import { bootstrapUrl } from '@/bootstrap';
import { clearSharedReads, sharedRead } from '@/shared-read';

afterEach(clearSharedReads);
describe('page request bootstrap', () => {
  it('loads only the current role page', () => {
    expect(new URLSearchParams(bootstrapUrl('/admin', '').split('?')[1]).getAll('resources[]')).toEqual(['/api/v1/view/admin']);
    expect(new URLSearchParams(bootstrapUrl('/akun', '').split('?')[1]).getAll('resources[]')).toEqual(['/api/v1/view/consumer']);
    expect(new URLSearchParams(bootstrapUrl('/transaksi', '').split('?')[1]).getAll('resources[]')).toEqual(['/api/v1/transactions?limit=100', '/api/v1/categories?status=active']);
  });
  it('preserves search and detail selectors', () => {
    expect(decodeURIComponent(bootstrapUrl('/admin/kiriman', '?q=Jakarta&risiko=at_risk'))).toContain('/api/v1/view/admin-shipments?q=Jakarta&risiko=at_risk');
    expect(decodeURIComponent(bootstrapUrl('/pengiriman/ANT-100015', ''))).toContain('/api/v1/view/seller/shipment/ANT-100015');
    expect(bootstrapUrl('/masuk', '')).toBe('/api/v1/bootstrap?');
  });
});
describe('in-flight reads', () => {
  it('shares a pending read without caching its completed response', async () => {
    const load = vi.fn(async () => ({ count: 3 }));
    const first = sharedRead('same', load);
    const second = sharedRead('same', load);
    expect(first.promise).toBe(second.promise);
    await first.promise;
    expect(load).toHaveBeenCalledTimes(1);
    const next = sharedRead('same', load);
    await next.promise;
    expect(load).toHaveBeenCalledTimes(2);
    first.release(); second.release(); next.release();
  });
  it('does not cancel the StrictMode replacement subscriber', async () => {
    let signal: AbortSignal | undefined;
    const load = vi.fn(async (value: AbortSignal) => { signal = value; return 5; });
    const first = sharedRead('strict', load);
    first.release();
    const second = sharedRead('strict', load);
    expect(await second.promise).toBe(5);
    expect(load).toHaveBeenCalledTimes(1);
    expect(signal?.aborted).toBe(false);
    second.release();
  });
  it('clears pending reads on account transitions', async () => {
    let signal: AbortSignal | undefined;
    const first = sharedRead('account', async (value) => { signal = value; return 1; });
    await Promise.resolve();
    clearSharedReads();
    expect(signal?.aborted).toBe(true);
    const second = sharedRead('account', async () => 2);
    expect(second.promise).not.toBe(first.promise);
    expect(await second.promise).toBe(2);
    first.release(); second.release();
  });
  it('does not retain failed responses', async () => {
    const first = sharedRead('failed', async () => { throw new Error('offline'); });
    await expect(first.promise).rejects.toThrow('offline');
    const second = sharedRead('failed', async () => 9);
    expect(await second.promise).toBe(9);
    first.release(); second.release();
  });
});
