import React, { createContext, useContext, ReactNode } from 'react';
import { useStorage } from './use-storage.js';
import { useTrackRoute } from './use-route-tracking.js';
import { StorageSchema, StorageSignalOptions } from '@jeanharo98/typed-storage';

const StorageContext = createContext<any>(null);

export function StorageProvider<T extends StorageSchema>({
    schema,
    options,
    children
}: {
    schema: T;
    options?: StorageSignalOptions;
    children: ReactNode;
}) {
    const storage = useStorage(schema, options);
    useTrackRoute(storage); 
    return (
        <StorageContext.Provider value={storage}>
            {children}
        </StorageContext.Provider>
    );
}

export function useAppStorage<T = any>(): T {
    const context = useContext(StorageContext);
    if (!context) {
        throw new Error('useAppStorage debe usarse dentro de un StorageProvider');
    }
    return context;
}