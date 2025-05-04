import attributes from "../daos/attributes.js";
import courses from "../daos/courses.js";
import evaluationSchemes from "../daos/evaluationSchemes.js";
import grades from "../daos/grades.js";
import { client } from "../daos/MongoDbUtil.js";
import { regulationLog } from "../daos/log.js";
import defineEnum from "../enums/define.js";

let fieldMap = new Map([
    ["Part Type", "partType"],
    ["Course Type", "type"],
    ["Course Category", "category"],
    ["Grade Type", "gradeType"],
    ["Letter Grade", "grades.letter"]
]);

/**
 * @description - Pagination function for attributes.
 * @param {Object} filter - Filter object for pagination.
 * @param {Number} skip - Number of records to skip.
 * @param {Number} limit - Maximum number of records to return.
 * @param {String} search - Search criteria.
 * @param {Object} sort - Sort criteria.
 * @returns {Promise<Object>} - Promise resolving to pagination result.
 */
async function pagination(filter, skip, limit, search, sort) {
    try {
        let { query, pipeline } = attributes.paginationQuery(filter);
        let result = await attributes.basicPagination(
            query,
            {
                skip: skip,
                limit: limit,
            },
            sort,
            pipeline
        );
        let isReadOnly = await checkReadOnly(filter.displayName);
        if (isReadOnly && result && Object.keys(result).length) {
            result["readOnly"] = isReadOnly;
        }
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Get distinct attribute names.
 * @returns {Promise<string[]>} - Promise resolving to an array of distinct attribute names.
 */
async function distinctNames() {
    try {
        let values = await attributes.distinct("displayName", { module: "regulations" });
        return Promise.resolve(values);
    } catch (e) {
        return Promise.reject("Error while fetching attribute names.");
    }
}

/**
 * @description - Get distinct attribute values for a given name.
 * @param {String} fieldName - Field name to fetch distinct values.
 * @param {Object} query
 * @returns {Promise<Array<Object>>} - Promise resolving to an array of distinct attribute values.
 */
async function distinctValues(value, query = {}) {
    try {
        query["module"] = "regulations";
        let result = await attributes.distinct(value, query);

        if (!result || !result.length) {
            throw new Error(`Attribute values not found for ${query.name}.`);
        }

        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description To retrieve attributeValues as enums
 * @param {String} attributeName
 * @param {String} valueName
 * @returns {Promise<string[]>} - Promise resolving enum
 */
async function getEnumByName(attributeName, valueName) {
    try {
        let attribute = await attributes.getOne({ "name": attributeName, module: "regulations" }, {
            values: {
                $map: {
                    input: "$values",
                    as: "item",
                    in: {
                        name: "$$item.name",
                        [valueName]: "$$item.shortName"
                    }
                }
            }
        });

        if (!attribute || !Object.keys(attribute).length) {
            throw new Error("Invalid attribute name.")
        }

        if (valueName == "_id") {
            return Promise.resolve(attribute.values);
        }

        attribute = defineEnum(attribute.values);
        return Promise.resolve(attribute);
    } catch (error) {
        return Promise.reject(error);
    }
};

/**
 * @description - Add a new attribute value.
 * @param {String} displayName - Name of the attribute.
 * @param {String} name
 * @param {String} shortName
 * @returns {Promise<String>} - Promise resolving to a success message.
 */
async function addValue(displayName, name, shortName, userName) {
    try {
        let isReadOnly = await checkReadOnly(displayName);
        if (isReadOnly) {
            throw new Error("This attribute is a read only attribute. You can't perform any operations on that.");
        }
        await attributes.valueExists(displayName, "", { name, shortName });

        const result = await attributes.updateOne({ "displayName": displayName, module: "regulations" }, "PUSH", { values: { name, shortName } });

        if (!result || !result.modifiedCount) {
            throw new Error(`Error while adding ${name}-${shortName} to ${displayName}.`);
        }

        let msg = `Added '${name}-${shortName}' to '${displayName}' attribute.`;
        await regulationLog("attributes", "update", userName, msg);

        return Promise.resolve(`${name}-${shortName} has been added successfully for the attribute -  ${displayName}.`);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Update an attribute value.
 * @param {String} displayName - Name of the attribute.
 * @param {any} oldValue - Old value to update.
 * @param {any} newValue - New value to set.
 * @returns {Promise<String>} - Promise resolving to a success message.
 */
async function updateValue(displayName, oldValue, newValue) {
    try {
        await checkReadOnly(displayName);
        await attributes.valueExists(displayName, oldValue, newValue);
        const session = client.startSession();

        try {
            const transactionOptions = {
                readPreference: "primary",
                readConcern: { level: "local" },
                writeConcern: { w: "majority" },
                maxCommitTimeMS: 1000,
            };

            await session.withTransaction(async () => {

                switch (displayName) {

                    case "Course Type":
                        await evaluationSchemes.updateMany({ courseType: oldValue }, "SET", { courseType: newValue }, { session });
                        await grades.updateMany({ courseType: oldValue }, "SET", { courseType: newValue }, { session });
                        await courses.updateMany({ type: oldValue }, "SET", { type: newValue }, { session });
                        break;

                    case "Course Category":
                        await courses.updateMany({ category: oldValue }, "SET", { category: newValue }, { session });
                        break;

                    case "Grade Type":
                        await grades.updateMany({ gradeType: oldValue }, "SET", { gradeType: newValue }, { session });
                        break;

                    case "Letter Grade":
                        await grades.updateMany({ "grades.letter": oldValue }, "SET", { "grades.$.letter": newValue }, { session });
                        break;

                    case "Part Type":
                        await courses.updateMany({ partType: oldValue }, "SET", { partType: newValue }, { session });
                        break;

                }

                let result = await attributes.updateOne({ "displayName": displayName, values: oldValue, module: "regulations" }, "SET", { "values.$": newValue }, { session });
                if (!result || !result.modifiedCount) {
                    throw new Error(`Error while updating ${displayName}.`);
                }

            }, transactionOptions);

            let msg = `Updated the value '${oldValue}' to '${newValue}' for the '${displayName}' attribute.`;
            await regulationLog("attributes", "update", "admin", msg);

            return Promise.resolve(`${displayName} has been updated successfully for the attribute '${displayName}'.`);
        } catch (e) {
            return Promise.reject(e);
        } finally {
            await session.endSession();
        }
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Delete an attribute value.
 * @param {String} displayName - Name of the attribute.
 * @param {any} value - Value to delete.
 * @returns {Promise<String>} - Promise resolving to a success message.
 */
async function deleteValue(displayName, value) {
    try {
        await checkReadOnly(displayName);
        await attributes.valueExists(displayName, value);
        let query = {};
        let courseKey = fieldMap.get(displayName);
        query[courseKey] = value;

        let count;
        switch (displayName) {

            case "Course Type":
                let evaluationSchemesCount = await evaluationSchemes.checkUsage({ "courseType": value });
                let gradeCount = await grades.checkUsage({ "courseType": value });
                if (gradeCount || evaluationSchemesCount) {
                    let errorIn = gradeCount ? "grade pattern" : "evaluation scheme";
                    errorIn = gradeCount && evaluationSchemesCount ? "grade pattern and evaluation scheme" : errorIn;
                    throw new Error(`Failed to delete course type - ${value} since it is already assigned for some ${errorIn}.`);
                }
                break;

            case "Grade Type":
                count = await grades.checkUsage({ gradeType: value });
                if (count) {
                    throw new Error(`Failed to delete grade type - ${value} since it is already assigned for some grade pattern .`);
                }
                break;

            case "Letter Grade":
                count = await grades.checkUsage({ "grades": { $elemMatch: { letter: value } } });
                if (count) {
                    throw new Error(`Failed to delete letter grade - ${value} since it is already assigned for some grade pattern .`);
                }
                break;
        }

        count = await courses.checkUsage(query);
        if (count) {
            throw new Error(`Failed to delete value - ${value} since it is already assigned for some courses.`);
        }

        let result = await attributes.updateOne({ "displayName": displayName, module: "regulations" }, "PULL", { values: value });
        if (!result || !result.modifiedCount) {
            throw new Error("Error while deleting the value.");
        }

        let msg = `'${displayName}' attribute - '${value}' value has been deleted.`;
        await regulationLog("attributes", "delete", "admin", msg);

        return Promise.resolve(`${value} has been deleted successfully for the attribute ${displayName}.`);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - to check an attribute is readOnly
 * @param {String} displayName
 * @returns {Promise<Boolean>} to denote attribute is read only
 */
async function checkReadOnly(displayName) {
    try {
        const { readOnly } = await attributes.getOne({ displayName, module: "regulations" }, { readOnly: { $cond: { if: "$readOnly", then: "$readOnly", else: false } } });
        return Promise.resolve(readOnly);
    } catch (e) {
        return Promise.reject(e);
    }
}

export default {
    pagination,
    distinctNames,
    addValue,
    deleteValue,
    updateValue,
    distinctValues,
    getEnumByName
};
