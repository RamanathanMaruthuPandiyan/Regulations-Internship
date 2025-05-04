import { BaseDao } from "./base.js";
const dao = BaseDao("grades");
import { extractSearchKeys } from "../services/common.js";

/**
 * @description Cheking a grade pattern exists.
 * @param {Object} query filter query consist of gradeType.
 * @returns {Promise<String>} Promise resolving to a success message.
 */
async function checkUsage(query) {
    try {
        let result = Boolean(await dao.count(query));
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description Constructing query for pagination.
 * @param {Object} filter Filter object for pagination.
 * @param {String} search Search criteria.
 * @returns {Object} Query for pagination.
 */
function paginationQuery(filter = {}, search = "", courseTypeEnum, gradeTypeEnum) {
    try {
        let query = {};

        if (filter.gradeType && filter.gradeType.length) {
            query.gradeType = { $in: filter.gradeType };
        }

        if (filter.courseType && filter.courseType.length) {
            query.courseType = { $in: filter.courseType };
        }

        if (search) {
            let courseTypeKeys = extractSearchKeys(courseTypeEnum, search);
            let gradeTypeKeys = extractSearchKeys(gradeTypeEnum, search);

            query.$or = [
                {
                    name: new RegExp(search, "i")
                },
                {
                    gradeType: { $in: gradeTypeKeys }
                },
                {
                    courseType: { $in: courseTypeKeys }
                }
            ];
        };

        let pipeline = [
            {
                $project: {
                    name: 1,
                    gradeType: 1,
                    courseType: 1
                }
            }
        ];

        return { query, pipeline };
    } catch (e) {
        throw e;
    }
}

export default {
    paginationQuery,
    ...dao,
    checkUsage
};
