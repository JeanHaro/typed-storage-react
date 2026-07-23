import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useTrackRoute(storage: { setRoute(route: string): void }): void {
    const location = useLocation();

    useEffect(() => {
        storage.setRoute(location.pathname);
    }, [location.pathname]);
}