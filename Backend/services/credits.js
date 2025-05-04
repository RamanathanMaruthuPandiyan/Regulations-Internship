import credits from "../daos/credits.js";
import regulations from "../daos/regulations.js";
import { Action_Items } from "../enums/enums.js";
import { ROLES } from "../middleware/auth.js";
import { regulationLog } from "../daos/log.js";

/**
 * @description To get action items of credit pattern.
 * @param {ObjectId} id Id of the credit pattern.
 * @param {Array} userRoles Array of userRoles.
 * @returns {Promise<Array<String>>} - Promise resolving to an array of action items.
 */
async function actionItems(id, userRoles = []) {
	try {

		let actions = [Action_Items.action.VIEW];

		let count = Boolean(await credits.count({ _id: id }));

		if (!count) {
			throw new Error("Credit pattern not found.");
		}

		let { isUsed } = await checkUsage(id);

		if ((userRoles.has(ROLES.DM) || userRoles.has(ROLES.A)) && !isUsed) {
			actions = [...actions, Action_Items.action.EDIT, Action_Items.action.DELETE];
		}

		return Promise.resolve(actions);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description To get distinct credit names and ids.
 * @returns {Promise<Array<Object>>} - Promise resolving to an array of distinct credit pattern names and ids.
 */
async function distinct() {
	try {
		let values = await credits.getAll({ name: 1 });
		return Promise.resolve(values);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description Explore function to get the credit pattern's for the given id's.
 * @param {Array<ObjectId>} creditIds Id's of the credit pattern's.
 * @returns {Promise<Array<Object>>} - Promise resolving to an array of object that matches the condition.
 */
async function explore(creditIds) {
	try {
		let result = await credits.getBy({ _id: { $in: creditIds } }, {
			"_id": 0,
			"name": 1,
			"credits": 1,
			"lecture": "$hoursPerWeek.lecture",
			"tutorial": "$hoursPerWeek.tutorial",
			"practical": "$hoursPerWeek.practical"
		});

		if (!result) {
			throw new Error("Credit pattern not found.");
		}

		return Promise.resolve(result);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description To fetch the credit pattern for the given id.
 * @param {ObjectId} id Id of the credit pattern.
 * @returns {Promise<Object>} - Promise resolving to matching condition.
 */
async function get(id) {
	try {
		let result = await credits.get(id, {
			name: 1,
			credits: 1,
			lecture: "$hoursPerWeek.lecture",
			tutorial: "$hoursPerWeek.tutorial",
			practical: "$hoursPerWeek.practical"
		});

		if (!result) {
			throw new Error("Credit pattern not found.");
		}

		return Promise.resolve(result);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description Pagination function for credits.
 * @param {Number} skip Number of records to skip.
 * @param {Number} limit Maximum number of records to return.
 * @param {String} search Search criteria.
 * @param {Object} sort Sort criteria.
 * @returns {Promise<Object>} - Promise resolving to pagination result.
 */
async function pagination(filter, skip, limit, search, sort) {
	try {
		let { query, pipeline } = credits.paginationQuery(search);
		let result = await credits.basicPagination(
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
 * @description Create function for credit pattern.
 * @param {String} name Name of the credit pattern.
 * @param { number } lecture Lecture hours per week.
 * @param { number } tutorial Tutorial hours per week.
 * @param { number } practical Practical hours per week.
 * @param { number } credit Total credits.
 * @returns { Promise<String>} - Promise resolving a success message.
 */
async function create(name, lecture, tutorial, practical, credit, userName) {
	try {
		let obj = credits.constructObj(name, lecture, tutorial, practical, credit);
		await credits.validateData(name, lecture, tutorial, practical, credit);

		let result = await credits.create(obj);

		if (!result || !result.insertedId) {
			throw new Error("Failed to add the credit pattern.");
		}

		let msg = `Created a new credit pattern named - '${name}'.`;
		await regulationLog("credits", "create", userName, msg);

		return Promise.resolve(`Credit pattern ${name} has been added successfully.`);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description Update function for credit pattern.
 * @param { ObjectId } id Id of the credit pattern.
 * @param {String} name Name of the credit pattern.
 * @param { number } lecture Lecture hours per week.
 * @param { number } tutorial Tutorial hours per week.
 * @param { number } practical Practical hours per week.
 * @param { number } credit Total credits.
 * @returns { Promise<String>} - Promise resolving a success message.
 */
async function update(id, name, lecture, tutorial, practical, credit, userName) {
	try {
		const mappingExist = Boolean(await regulations.count({ creditIds: id }));

		if (mappingExist) {
			throw new Error("This credit pattern is already used in some regulations.");
		}

		let obj = credits.constructObj(name, lecture, tutorial, practical, credit);
		await credits.validateData(name, lecture, tutorial, practical, credit, id);

		let result = await credits.update(id, "SET", Object.assign(obj, { "name": name }));
		if (!result || !result.modifiedCount) {
			throw new Error("No modifications found.");
		}

		let msg = `Updated a credit pattern named - '${name}'.`;
		await regulationLog("credits", "update", userName, msg);

		return Promise.resolve(`Credit pattern - ${name} has been updated successfully.`);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description Delete function for credit pattern.
 * @param { ObjectId } id Id of the credit pattern.
 * @returns { Promise<String>} - Promise resolving a success message.
 */
async function remove(id, userName) {
	try {
		const record = await credits.get(id);

		if (!record) {
			throw new Error("Credit pattern not found.");
		}

		const mappingExist = Boolean(await regulations.count({ creditIds: id }));

		if (mappingExist) {
			throw new Error("This credit pattern is already used in some regulations.");
		}

		let result = await credits.remove(id);
		if (!result || !result.deletedCount) {
			throw new Error("Failed to delete the credit pattern.");
		}

		let msg = `Deleted a credit pattern named - '${record.name}'.`;
		await regulationLog("credits", "delete", userName, msg);

		return Promise.resolve(`Credit pattern - ${record.name} has been deleted successfully.`);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description To check credit pattern is used.
 * @param { ObjectId } id Id of the credit pattern.
 * @returns { Promise<Object>} - To denote credit pattern is used
 */
async function checkUsage(id) {
	try {
		const isFound = await credits.get(id);

		if (!isFound) {
			throw new Error("Credit pattern not found.");
		}

		const mappingExist = Boolean(await regulations.count({ creditIds: id }));

		return Promise.resolve({ "isUsed": mappingExist });
	} catch (e) {
		return Promise.reject(e);
	}
}

export default {
	distinct,
	get,
	create,
	update,
	remove,
	pagination,
	actionItems,
	explore,
	checkUsage
};
