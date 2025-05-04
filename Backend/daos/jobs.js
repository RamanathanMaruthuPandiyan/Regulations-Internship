import { BaseDao } from './base.js';
const dao = BaseDao("jobs");
import moment from 'moment';
import { Jobs } from "../enums/enums.js";
import { extractSearchKeys } from "../services/common.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const config = require('../config/config.' + process.env.NODE_ENV);

/**
 * @description Constructing query for pagination.
 * @param {Object} filter Filter object for pagination.
 * @returns {Object} Query for pagination.
 */
function paginationQuery(filter = {}, search = "") {
    try {
        let query = {};

        if (filter.name && filter.name.length) {
            query.name = { $in: filter.name };
        }

        if (filter.status && filter.status.length) {
            query.status = { $in: filter.status };
        }

        if (filter.createDate) {
            filter.createDate = new Date(filter.createDate);
            query['dates.created'] = {
                $gte: filter.createDate,
                $lt: new Date(moment(filter.createDate, "YYYY-MM-DD").add(1, 'days').startOf("day"))
            };
        }

        if (search) {
            let searchKeys = extractSearchKeys(Jobs.names, search);
            query = {
                name: { $in: searchKeys }
            };
        }

        let pipeline = [
            {
                $project: {
                    _id: 1,
                    name: 1,
                    status: 1,
                    "dates.created": 1,
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
                    completionPercentage: 1,
                    recordCount: 1,
                }
            }
        ]

        return { query, pipeline };
    } catch (e) {
        throw e;
    }
}

async function createJob(name) {
    try {
        let job = {
            "name": name,
            "status": Jobs.status.NotStarted,
            "dates": {
                "created": new Date()
            },
            completionPercentage: 0,
            recordCount: 0
        };
        let { insertedId } = await dao.create(job);
        return Promise.resolve(insertedId);
    } catch (error) {
        return Promise.reject(error);
    }
}

async function getPending(id) {
    try {
        let query = { "status": Jobs.status.NotStarted, name: Jobs.names.Move_Regulation_To_Next_Semester };
        if (id) {
            query._id = id;
        }
        let response = await dao.getOne(query);
        return Promise.resolve(response);
    } catch (e) {
        return Promise.reject(e);
    }
}

export default {
    ...dao,
    createJob,
    paginationQuery,
    getPending
}
