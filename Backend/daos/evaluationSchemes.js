import { BaseDao } from "./base.js";
const dao = BaseDao("evaluationSchemes");
import { extractSearchKeys } from "../services/common.js";

/**
 * @description Function to check for usage of the record.
 * @param { Object } query Query consist of courseType.
 * @returns {Promise<Boolean>} - Promise resolve to a boolean value.
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
 * @description To construct a pagination query.
 * @param { Object } filter Criteria to filter the record.
 * @param {String} search Search criteria.
 * @returns {Object} - An object with query and pipeline.
 */
function paginationQuery(filter = {}, search = "", courseTypeEnum) {
	try {
		let query = {};

		if (filter.courseType && filter.courseType.length) {
			query.courseType = { $in: filter.courseType };
		}

		if (search) {
			let courseTypeKeys = extractSearchKeys(courseTypeEnum, search);
			query.$or = [
				{
					name: new RegExp(search, "i"),
				},
				{
					courseType: { $in: courseTypeKeys },
				},
			];
		}

		let pipeline = [
			{
				$project: {
					"name": 1,
					"courseType": 1,
					"CA": "$markSplitUp.CA",
					"FE": "$markSplitUp.FE",
					"total": "$markSplitUp.total"
				},
			},
		];

		return { query, pipeline };
	} catch (e) {
		throw e;
	}
}

export default {
	...dao,
	paginationQuery,
	checkUsage
};
