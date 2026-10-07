type Flight = { promise: Promise<unknown>; controller: AbortController; subscribers: number };
const flights = new Map<string, Flight>();

// share only a running GET, not a response cache or a mutation.
export function sharedRead<T>(key: string, load: (signal: AbortSignal) => Promise<T>): { promise: Promise<T>; release: () => void } {
  let flight = flights.get(key);
  if (!flight) {
    const controller = new AbortController();
    const created: Flight = { controller, subscribers: 0, promise: Promise.resolve().then(() => load(controller.signal)) };
    flight = created;
    flights.set(key, created);
    const remove = () => { if (flights.get(key) === created) flights.delete(key); };
    created.promise.then(remove, remove);
  }
  flight.subscribers++;
  const current = flight;
  let released = false;
  return {
    promise: current.promise as Promise<T>,
    release() {
      if (released) return;
      released = true;
      current.subscribers--;
      // StrictMode immediately subscribes again; do not start a second request.
      queueMicrotask(() => {
        if (current.subscribers === 0) {
          current.controller.abort();
          if (flights.get(key) === current) flights.delete(key);
        }
      });
    },
  };
}

export function clearSharedReads(): void {
  for (const flight of flights.values()) flight.controller.abort();
  flights.clear();
}
