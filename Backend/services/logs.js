import logs from "../daos/logs.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const config = require('../config/config.' + process.env.NODE_ENV);

/**
 * @description - Pagination function for logs.
 * @param {Object} filter - Filter object for pagination.
 * @param {Number} skip - Number of records to skip.
 * @param {Number} limit - Maximum number of records to return.
 * @param {String} search - Search criteria.
 * @param {Object} sort - Sort criteria.
 * @returns {Promise<Object>} - Promise resolving to pagination result.
 */
async function pagination(filter, skip, limit, search, sort) {
    try {
        let { query, pipeline } = logs.paginationQuery(filter, search);
        let result = await logs.basicPagination(
            query,
            {
                skip: skip,
                limit: limit,
            },
            sort,
            pipeline
        );
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function distinct(field) {
    try {
        let result = await logs.distinct(field);
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

export default {
    pagination,
    distinct
}