import { BaseDao } from './base.js';
const dao = BaseDao("logs_regulations");
import moment from 'moment';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const config = require('../config/config.' + process.env.NODE_ENV);

/**
 * @description Constructing query for pagination.
 * @param {Object} filter Filter object for pagination.
 * @returns {Object} Query for pagination.
 */
function paginationQuery(filter = {}, search) {
    try {
        let query = {};

        if (filter.entity && filter.entity.length) {
            query.entity = { $in: filter.entity };
        }

        if (filter.action && filter.action.length) {
            query.action = { $in: filter.action };
        }

        if (filter.on) {
            filter.on = new Date(filter.on);
            query['on'] = {
                $gte: filter.on,
                $lt: new Date(moment(filter.on, "YYYY-MM-DD").add(1, 'days').startOf("day"))
            };
        }

        if (search) {
            query.$or = [
                {
                    msg: new RegExp(search, "i")
                }
            ];
        }

        let pipeline = [
            {
                $project: {
                    _id: 1,
                    entity: 1,
                    action: 1,
                    on: {
                        "$dateToString": {
                            "format": "%Y-%m-%d %H:%M:%S",
                            "date": "$on",
                            "timezone": config.timeZoneConfig.timezone
                        }
                    },
                    by: 1,
                    msg: 1,
                }
            }
        ]

        return { query, pipeline };
    } catch (e) {
        throw e;
    }
}

export default {
    ...dao,
    paginationQuery
}
