import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { demoShipments, type Shipment } from '../data/shipments';
import type { PostalPlace, Region } from '../services/locationApi';

type ShipmentLocation = {
  originProvince: Region | null;
  originRegency: Region | null;
  destinationProvince: Region | null;
  destinationRegency: Region | null;
  postalPlace: PostalPlace | null;
};

type ShipmentContextValue = ShipmentLocation & {
  shipments: readonly Shipment[];
  setOriginProvince: (value: Region | null) => void;
  setOriginRegency: (value: Region | null) => void;
  setDestinationProvince: (value: Region | null) => void;
  setDestinationRegency: (value: Region | null) => void;
  setPostalPlace: (value: PostalPlace | null) => void;
};

const ShipmentContext = createContext<ShipmentContextValue | null>(null);
ShipmentContext.displayName = 'ShipmentContext';

export function ShipmentProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<ShipmentLocation>({
    originProvince: null, originRegency: null,
    destinationProvince: null, destinationRegency: null, postalPlace: null,
  });

  // Parent selection clears children so old city/postal values cannot survive a route change.
  const value = useMemo<ShipmentContextValue>(() => ({
    ...location,
    shipments: demoShipments,
    setOriginProvince: (originProvince) => setLocation((current) => ({ ...current, originProvince, originRegency: null })),
    setOriginRegency: (originRegency) => setLocation((current) => ({ ...current, originRegency })),
    setDestinationProvince: (destinationProvince) => setLocation((current) => ({ ...current, destinationProvince, destinationRegency: null, postalPlace: null })),
    setDestinationRegency: (destinationRegency) => setLocation((current) => ({ ...current, destinationRegency, postalPlace: null })),
    setPostalPlace: (postalPlace) => setLocation((current) => ({ ...current, postalPlace })),
  }), [location]);

  return <ShipmentContext.Provider value={value}>{children}</ShipmentContext.Provider>;
}

export function useShipmentContext(): ShipmentContextValue {
  const context = useContext(ShipmentContext);
  if (!context) throw new Error('useShipmentContext harus dipakai di dalam ShipmentProvider.');
  return context;
}
