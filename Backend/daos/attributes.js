import { BaseDao } from './base.js';
const dao = BaseDao('attributes');


/**
 * @description Constructing query for pagination.
 * @param {Object} filter Filter object for pagination.
 * @param {String} search Search criteria.
 * @returns {Object} Query for pagination.
 */
function paginationQuery(filter = {}) {
    try {
        let query = {
            "module": "regulations"
        };

        if (filter.displayName) {
            query.displayName = filter.displayName;
        }

        let pipeline = [
            {
                $unwind: "$values",
            },
            {
                $project: {
                    _id: 0,
                    values: 1
                }
            }
        ];

        return { query, pipeline };
    } catch (e) {
        throw e;
    }
}

/**
 * @description Validation function for CRUD operations.
 * @param {String} displayName Name of the attribute.
 * @param {String} oldValue old value for check exists.
 * @param {String} newValue New value for unique validation .
 * @returns {Promise<String>} Promise rejecting to a failure message.
 */
async function valueExists(displayName, oldValue = {}, newValue = {}) {
    try {
        const keyFound = Boolean(await dao.count({ displayName: displayName, module: "regulations" }));
        if (!keyFound) {
            throw new Error(`Attribute name -  ${displayName} not found.`);
        }

        if (Object.keys(newValue).length) {
            const valueFound = Boolean(await dao.count({
                displayName: displayName,
                module: "regulations",
                values: { $elemMatch: { $or: [{ name: newValue.name }, { shortName: newValue.shortName }] } },
            }));
            if (valueFound) {
                throw new Error(`Attribute name - '${displayName}' name and short name must be unique.`);
            }
        }

        if (Object.keys(oldValue).length) {
            const valueFound = Boolean(await dao.count({
                displayName: displayName,
                module: "regulations",
                values: { $elemMatch: { $or: [{ name: oldValue.name }, { shortName: oldValue.shortName }] } }
            }));
            if (!valueFound) {
                throw new Error(`Attribute name - '${displayName}' has no value name and shortName.`);
            }
        }
    } catch (e) {
        return Promise.reject(e);
    }
}

export default {
    ...dao,
    valueExists,
    paginationQuery,
};
