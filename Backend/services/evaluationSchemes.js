import evaluationSchemes from "../daos/evaluationSchemes.js";
import regulations from "../daos/regulations.js";
import { Action_Items } from "../enums/enums.js"
import { ROLES } from "../middleware/auth.js";
import { regulationLog } from "../daos/log.js";
import { validate } from "./validateEvaluationScheme.js";
import attributes from "../services/attributes.js";

/**
 * @description To get action items of evaluation scheme.
 * @param {ObjectId} id Id of the credit pattern.
 * @param {Array} userRoles Array of userRoles.
 * @returns {Promise<Array<String>>} - Promise resolving to an array of action items.
 */
async function actionItems(id, userRoles = []) {
	try {
		let actions = [Action_Items.action.VIEW];

		let isFound = Boolean(await evaluationSchemes.count({ _id: id }));

		if (!isFound) {
			throw new Error("Evaluation scheme not found.");
		}

		let isUsed = await checkUsage(id);

		if ((userRoles.has(ROLES.DM) || userRoles.has(ROLES.A)) && !isUsed) {
			actions = [...actions, Action_Items.action.EDIT, Action_Items.action.DELETE];
		}

		return Promise.resolve(actions);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description To get distinct evaluation scheme names and ids.
 * @returns {Promise<Array<Object>>} - Promise resolving to an array of distinct evaluation scheme names and ids.
 */
async function distinct() {
	try {
		let result = await evaluationSchemes.getAll({ name: 1 });
		return Promise.resolve(result);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description To fetch the evaluation scheme for the given id.
 * @param {ObjectId} id Id of the evaluation scheme.
 * @returns {Promise<Object>} - Promise resolving to an object that matches the condition.
 */
async function get(id) {
	try {
		let result = await evaluationSchemes.get(id);

		if (!result) {
			throw new Error("Evaluation scheme not found.");
		}

		return Promise.resolve(result);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description Explore function to get the evaluation scheme's for the given id's.
 * @param {Array<ObjectId>} creditIds Id's of the evaluation scheme's.
 * @returns {Promise<Array<Object>>} - Promise resolving to an array of object that matches the condition.
 */
async function explore(evaluationIds) {
	try {
		let courseTypeEnum = await attributes.getEnumByName("type", "value");

		let result = await evaluationSchemes.getBy({ _id: { $in: evaluationIds } }, {
			_id: 0,
			name: 1,
			courseType: 1,
			CA: "$markSplitUp.CA",
			FE: "$markSplitUp.FE",
			total: "$markSplitUp.total"
		});

		if (!result) {
			throw new Error("Failed to fetch data.");
		}

		result = result.map((evaluationPattern) => {
			evaluationPattern.courseType = courseTypeEnum.values[evaluationPattern.courseType];
			return evaluationPattern;
		});

		return Promise.resolve(result);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description Pagination function for evaluationSchemes.
 * @param {Object} filter Filter object for pagination.
 * @param {Number} skip Number of records to skip.
 * @param {Number} limit Maximum number of records to return.
 * @param {String} search Search criteria.
 * @param {Object} sort Sort criteria.
 * @returns {Promise<Object>} - Promise resolving to pagination result.
 */
async function pagination(filter, skip, limit, search, sort) {
	try {
		let courseTypeEnum = await attributes.getEnumByName("type", "value");
		let { query, pipeline } = evaluationSchemes.paginationQuery(filter, search, courseTypeEnum);
		let result = await evaluationSchemes.basicPagination(
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
 * @description to get evaluation schemes for a particular courseType in a regulation
 * @param {ObjectId} regId - regulationId
 * @param {String} courseType
 * @returns {Promise<Array<Object>>} - Evaluation schemes
 */
async function getEvalNameByCourseType(regId, courseType) {
	try {
		let { evaluationIds } = await regulations.get(regId, { _id: 0, evaluationIds: 1 });

		let records = await evaluationSchemes.getBy({ _id: { $in: evaluationIds }, courseType: courseType }, { _id: 1, name: 1 });

		if (!records && !records.length) {
			throw new Error("No evaluation schemes found under this course type for this regulation.");
		}

		return Promise.resolve(records);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description Creates a new evaluation scheme. Validates the input data and, if valid, adds the evaluation scheme to the database.
 * @param {String} name - The name of the evaluation scheme.
 * @param {String} courseType - The type of the course.
 * @param {String} distributionType - The type of distribution (CA, FE, BOTH).
 * @param {Object} markSplitUp - The split up of marks for the course.
 * @param {Array} CA_Components - Continuous Assessment components.
 * @param {Array} FE_Components - Final Exam components.
 * @returns {Promise<String>} - Returns a success message.
 * @throws {Error} - Throws errors if an issue occurs during the creation process.
 */
async function create(name, courseType, distributionType, markSplitUp, CA_Components, FE_Components, userName) {
	try {
		let data = await validate(name, courseType, distributionType, markSplitUp, CA_Components, FE_Components);

		let result = await evaluationSchemes.create(data);

		if (!result || !result.insertedId) {
			throw new Error("Error while adding the evaluation scheme.");
		}

		let msg = `Created a new evaluation scheme named - '${name}'.`;
		await regulationLog("evaluation schemes", "create", userName, msg);

		return Promise.resolve(`Evaluation scheme - '${name}' has been added successfully.`);
	} catch (e) {
		throw e;
	}
}

/**
 * @description Updates an existing evaluation scheme. Validates the input data and, if valid,
 * updates the evaluation scheme in the database. Logs the update of the evaluation scheme.
 * @param {String} id - The ID of the evaluation scheme to be updated.
 * @param {String} name - The name of the evaluation scheme.
 * @param {String} courseType - The type of the course.
 * @param {String} distributionType - The type of distribution (CA, FE, BOTH).
 * @param {Object} markSplitUp - The split up of marks for the course.
 * @param {Array} CA_Components - Continuous Assessment components.
 * @param {Array} FE_Components - Final Exam components.
 * @returns {Promise<String>} - Returns success message.
 * @throws {Error} - Throws errors if an issue occurs during the update process.
 */
async function update(id, name, courseType, distributionType, markSplitUp, CA_Components = [], FE_Components = [], userName) {
	try {

		let found = Boolean(await evaluationSchemes.count({ _id: id }));
		if (!found) {
			throw new Error("Evaluation scheme not found.");
		}

		const mappingExist = Boolean(await regulations.count({ evaluationIds: id }));
		if (mappingExist) {
			throw new Error("This evaluation scheme is already used in some regulations.");
		}

		let data = await validate(name, courseType, distributionType, markSplitUp, CA_Components, FE_Components, id);

		let result = await evaluationSchemes.updateOne({ _id: id }, "SET", data);

		if (!result || !result.modifiedCount) {
			throw new Error("No modifications found.");
		}

		let msg = `Updated a evaluation scheme named - '${name}'.`;
		await regulationLog("evaluation schemes", "update", userName, msg);

		return Promise.resolve(`Evaluation scheme - '${name}' has been updated successfully.`);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description Delete function for evaluation scheme.
 * @param { ObjectId } id Id of the evaluation scheme.
 * @returns { Promise<String>} - Promise resolving a success message.
 */
async function remove(id, userName) {
	try {
		const record = await evaluationSchemes.get(id);
		if (!record) {
			throw new Error("Evaluation scheme not found.");
		}

		const mappingExist = Boolean(await regulations.count({ evaluationIds: id }));

		if (mappingExist) {
			throw new Error("This evaluation scheme is already used in some regulations.");
		}
		let result = await evaluationSchemes.remove(id);

		if (!result || !result.deletedCount) {
			throw new Error("Failed to delete the evaluation scheme.");
		}

		let msg = `Deleted a evaluation scheme named - '${record.name}'.`;
		await regulationLog("evaluation schemes", "delete", userName, msg);

		return Promise.resolve(`Evaluation scheme - ${record.name} has been deleted successfully.`);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description To check evaluation scheme is used.
 * @param { ObjectId } id Id of the evaluation scheme.
 * @returns { Promise <Boolean>} - To denote evaluation scheme is used or not.
 */
async function checkUsage(id) {
	try {
		const isFound = await evaluationSchemes.get(id);
		if (!isFound) {
			throw new Error("Evaluation scheme not found..");
		}

		const mappingExist = Boolean(await regulations.count({ evaluationIds: id }));

		return Promise.resolve(mappingExist);
	} catch (e) {
		return Promise.reject(e);
	}
}

export default {
	pagination,
	remove,
	distinct,
	get,
	create,
	update,
	actionItems,
	explore,
	checkUsage,
	getEvalNameByCourseType
};
