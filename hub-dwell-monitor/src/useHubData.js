import { useEffect, useState } from 'react';
import { validateData, validateSummary } from './metrics.js';

export function useHubData(revision) {
  const [state, setState] = useState({ isLoading: true, error: null, hubs: [], summary: null });
  useEffect(() => {
    const controller = new AbortController();
    setState({ isLoading: true, error: null, hubs: [], summary: null });
    async function read(file) {
      const response = await fetch(`${import.meta.env.BASE_URL}data/${file}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Data ${file} gagal dimuat (HTTP ${response.status}).`);
      return response.json();
    }
    Promise.all([read('metrics.json'), read('locations.json'), read('ai-summary.json').catch(() => null)])
      .then(([metrics, locations, summary]) => {
        if (controller.signal.aborted) return;
        const hubs = validateData(metrics, locations);
        setState({ isLoading: false, error: null, hubs, period: metrics.period,
          summary: validateSummary(summary, hubs) ? summary : null });
      }).catch(error => {
        if (!controller.signal.aborted) setState({ isLoading: false, error: error.message, hubs: [], summary: null });
      });
    // Abort the old request during retry/unmount, including StrictMode's development cleanup.
    return () => controller.abort();
  }, [revision]);
  return state;
}
