import { useEffect, useState } from 'react';
import { getProvinces, getRegencies, type Region } from '../services/locationApi';

type Kind = 'provinces' | 'regencies';
type State = { key: string; data: Region[]; isLoading: boolean; error: string | null };

// The same hook serves the province dropdown and either city dropdown.
export function useLocationData(kind: Kind, provinceId = '') {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ key: '', data: [], isLoading: kind === 'provinces', error: null });
  const key = `${kind}:${provinceId}:${attempt}`;
  const enabled = kind === 'provinces' || Boolean(provinceId);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let active = true;
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 12000);
    const request = kind === 'provinces' ? getProvinces(controller.signal) : getRegencies(provinceId, controller.signal);
    request.then((data) => {
      if (active) setState({ key, data, isLoading: false, error: null });
    }).catch((error: unknown) => {
      if (!active) return;
      if (timedOut) setState({ key, data: [], isLoading: false, error: 'Layanan wilayah terlalu lama merespons. Coba lagi.' });
      else if (!controller.signal.aborted) setState({ key, data: [], isLoading: false, error: error instanceof Error ? error.message : 'Wilayah belum dapat dimuat.' });
    }).finally(() => window.clearTimeout(timeout));

    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [enabled, key, kind, provinceId]);

  const current = state.key === key ? state : { key, data: [], isLoading: enabled, error: null };
  return { data: current.data, isLoading: current.isLoading, isError: Boolean(current.error), error: current.error, retry: () => setAttempt((value) => value + 1) };
}
