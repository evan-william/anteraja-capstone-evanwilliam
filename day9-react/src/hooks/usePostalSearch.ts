import { useEffect, useState } from 'react';
import { describeLocationError, searchPostalPlaces, type PostalPlace } from '../services/locationApi';

type State = { key: string; data: PostalPlace[]; isLoading: boolean; error: string | null };

export function usePostalSearch(query: string) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ key: '', data: [], isLoading: false, error: null });
  const keyword = query.trim();
  const enabled = keyword.length >= 3;
  const key = `${keyword}:${attempt}`;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let active = true;
    let timedOut = false;
    let timeout: number | undefined;
    // Debounce avoids one network request per keystroke. Cleanup cancels stale requests.
    const debounce = window.setTimeout(() => {
      timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 12000);
      searchPostalPlaces(keyword, controller.signal).then((data) => {
        if (active) setState({ key, data, isLoading: false, error: null });
      }).catch((error: unknown) => {
        if (!active) return;
        if (timedOut) setState({ key, data: [], isLoading: false, error: 'Pencarian kode pos terlalu lama. Coba lagi.' });
        else if (!controller.signal.aborted) setState({ key, data: [], isLoading: false, error: describeLocationError(error) });
      }).finally(() => window.clearTimeout(timeout));
    }, 400);

    return () => { active = false; window.clearTimeout(debounce); window.clearTimeout(timeout); controller.abort(); };
  }, [enabled, key, keyword]);

  const current = state.key === key ? state : { key, data: [], isLoading: enabled, error: null };
  return { data: current.data, isLoading: current.isLoading, isError: Boolean(current.error), error: current.error, retry: () => setAttempt((value) => value + 1) };
}
