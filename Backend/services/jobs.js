import jobs from "../daos/jobs.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const config = require('../config/config.' + process.env.NODE_ENV);

/**
 * @description - Pagination function for jobs.
 * @param {Object} filter - Filter object for pagination.
 * @param {Number} skip - Number of records to skip.
 * @param {Number} limit - Maximum number of records to return.
 * @param {String} search - Search criteria.
 * @param {Object} sort - Sort criteria.
 * @returns {Promise<Object>} - Promise resolving to pagination result.
 */
async function pagination(filter, skip, limit, search, sort) {
    try {
        let { query, pipeline } = jobs.paginationQuery(filter, search);
        let result = await jobs.basicPagination(
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

/**
 * @description  Get course by object id.
 * @param {ObjectId} id  Object id of course.
 * @returns {Promise<Object>}  Promise resolving to an course.
 */
async function get(id) {
    try {
        let projection = {
            _id: 0,
            name: 1,
            status: 1,
            created: {
                "$dateToString": {
                    "format": "%Y-%m-%d %H:%M:%S",
                    "date": "$dates.created",
                    "timezone": config.timeZoneConfig.timezone
                }
            },
            started: {
                "$dateToString": {
                    "format": "%Y-%m-%d %H:%M:%S",
                    "date": "$dates.started",
                    "timezone": config.timeZoneConfig.timezone
                }
            },
            finished: {
                "$dateToString": {
                    "format": "%Y-%m-%d %H:%M:%S",
                    "date": "$dates.finished",
                    "timezone": config.timeZoneConfig.timezone
                }
            },
            recordCount: 1,
            reason: 1,
            summary: 1

        };
        let result = await jobs.get(id, projection);
        if (!result) {
            throw new Error("Failed to fetch job data.");
        }
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function distinct(field) {
    try {
        let result = await jobs.distinct(field);
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}


export default {
    pagination,
    get,
    distinct
}