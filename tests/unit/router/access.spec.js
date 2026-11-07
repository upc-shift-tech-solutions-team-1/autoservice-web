import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import router, { authorizeRoute } from '../../../src/router';
import { useAuthStore } from '../../../src/domains/auth/application/auth.store';

describe('Route access by authenticated role', () => {
    beforeEach(() => {
        localStorage.clear();
        setActivePinia(createPinia());
    });

    it('keeps anonymous tracking accessible and protects workshop pages', () => {
        expect(authorizeRoute(router.resolve('/tracking'))).toBe(true);
        expect(authorizeRoute(router.resolve('/work-orders/1'))).toBe('/login');
    });

    it.each(['/customers', '/vehicles/1', '/work-orders', '/tasks', '/mechanics', '/inventory'])(
        'redirects mechanics away from %s', (path) => {
            const auth = useAuthStore();
            auth.token = 'local-test';
            auth.user = { role: 'mechanic' };
            expect(authorizeRoute(router.resolve(path))).toBe('/mechanic/workspace');
            expect(authorizeRoute(router.resolve('/mechanic/order/1'))).toBe(true);
        }
    );

    it('keeps administrators in their own workspace', () => {
        const auth = useAuthStore();
        auth.token = 'local-test';
        auth.user = { role: 'admin' };
        expect(authorizeRoute(router.resolve('/mechanic/workspace'))).toBe('/');
        expect(authorizeRoute(router.resolve('/inventory'))).toBe(true);
    });
});
