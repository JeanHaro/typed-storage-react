import { useSyncExternalStore, useRef, useState } from "react";
import {
    createStorage,
    StorageSchema,
    StorageSignalOptions
} from '@jeanharo98/typed-storage';

export type UseStorageResult<T extends StorageSchema> = {
    [K in keyof T]: T[K]
} & {
    set<K extends keyof T>(key: K, value: T[K]): void;
    reset(key: keyof T): void;
    remove(key: keyof T): void;
    has(key: keyof T): boolean;
    clear(): void;
    destroy(): void;
    setRoute(route: string): void;
    batch(values: Partial<T>): void;
    archive(): Promise<void>;
    restore(): Promise<void>;
}

export function useStorage<T extends StorageSchema>(
    schema: T,
    options?: StorageSignalOptions
): UseStorageResult<T> {
    // useRef guarda la instancia entre renders, no se recrea
    const storageRef = useRef<any>(null);

    if ( !storageRef.current ) {
        storageRef.current = createStorage(schema, options);
    }

    // 1. Crea el storage 
    const storage = storageRef.current;

    const result: any = {};

    for ( const key of Object.keys(schema) ) {
        result[key] = useSyncExternalStore(
            (callback) => {
                return storage[key].onChange(callback);
            },
            () => storage[key]() // getSnapshot - valor actual
        );
    }

    // Agrega un counter que fuerza re-render en remove/clear
    const [, forceUpdate] = useState(0);

    result.set = ( key: keyof T, value: any ) => storage[key].set(value);
    result.reset = ( key: keyof T ) => storage[key].reset();
    result.remove = ( key: keyof T ) => { 
        storage[key].remove();
        forceUpdate(n => n + 1); // fuerza re-render
    }
    result.has = ( key: keyof T ) => storage[key].has();
    result.clear = () => {
        storage.clear();
        forceUpdate(n => n + 1); // fuerza re-render
    }

    result.destroy = () => {
        storage.destroy();
        forceUpdate(n => n + 1); // fuerza re-render, igual que remove/clear
    }

    result.setRoute = (route: string) => {
        storage.setRoute(route);
        forceUpdate(n => n + 1); // fuerza re-render para reflejar los cambios
    }

    result.batch = (values: Partial<T>) => {
        storage.batch(values);
        forceUpdate(n => n + 1); // fuerza re-render para reflejar todos los cambios
    }

    result.archive = async () => {
        await storage.archive();
        forceUpdate(n => n + 1); // fuerza re-render, valores volvieron al initialValue
    }

    result.restore = async () => {
        await storage.restore();
        forceUpdate(n => n + 1); // fuerza re-render, valores restaurados
    }

    return result as UseStorageResult<T>;
}