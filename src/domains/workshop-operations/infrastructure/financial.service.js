/**
 * Service layer for financial summary API communication.
 */

import http from '../../../shared/infrastructure/http-common';

/**
 * Provides access to financial dashboard information.
 */
export const FinancialService = {
    /**
     * Fetch the consolidated financial summary.
     * @returns {Promise}
     */
    getSummary() {
        return http.get('/financial-summary');
    }
};