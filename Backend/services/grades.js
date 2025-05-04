import grades from "../daos/grades.js";
import attributes from "../daos/attributes.js";
import attributeService from "../services/attributes.js";
import regulations from "../daos/regulations.js";
import { Action_Items } from "../enums/enums.js"
import { ROLES } from "../middleware/auth.js";
import { regulationLog } from "../daos/log.js";

/**
 * @description - Get a action items of grade pattern.
 * @param {Object} id - Object id of grade pattern.
 * @param {Array} userRoles - array of userRoles.
 * @returns {Promise<String>} - Promise resolving to an array of action items.
 */
async function actionItems(id, userRoles = []) {
	try {
		let actions = [Action_Items.action.VIEW];

		let isExist = Boolean(await grades.count({ _id: id }));

		if (!isExist) {
			throw new Error("Grade pattern not found.");
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
 * @description Validates if a specific grade pattern already exists in the database.
 * If the grade pattern exists, it throws an error.
 * @param {String} courseType - The type of the course (e.g., "THEORY").
 * @param {String} gradeType - The type of grading (e.g., "RELATIVE GRADING").
 * @param {Array<Object>} grades - An array of grade objects to validate.
 * Each grade object should have properties: letter, min, max, and point.
 * @param {String} [id] - An optional ID to exclude from the search (to prevent self-matching).
 * @throws Will throw an error if the grade pattern already exists in the database.
 */
async function validatePattern(courseType, gradeType, gradesArr, id) {
	try {
		let query = { courseType: courseType, gradeType: gradeType, grades: { $all: [], $size: gradesArr.length } };

		if (id) {
			query["_id"] = { $ne: id };
		}

		gradesArr.forEach(obj => {
			query.grades.$all.push({ $elemMatch: obj });
		});

		let count = Boolean(await grades.count(query));

		if (count) {
			throw new Error("This grade pattern already exists under this course type and grade type.");
		}

	} catch (e) {
		throw e;
	}
}


/**
 * @description - Validation function for CRUD operations.
 * @param {String} name - Name of the grade pattern.
 * @param {String} gradeType - Type of grade.
 * @param {String} courseType - Type of course.
 * @param {Array} grade - Array of grades with letter, min, max, point.
 * @param {Object} id - Object id of grade pattern.
 * @returns {Promise<String>} - Promise rejecting to a failure message.
 */
async function validate(name, gradeType, courseType, grade, id) {
	try {
		for (let i = 0; i < grade.length; i++) {
			if (!grade[i].letter || !Number.isFinite(grade[i].min) ||
				!Number.isFinite(grade[i].max) || !Number.isFinite(grade[i].point)) {
				throw new Error("Missing required fields in grade pattern.");
			}
		}

		let query = { name: name };

		if (id) {
			let result = Boolean(await grades.count({ _id: id }));

			if (!result) {
				throw new Error("Invalid id.");
			}

			const mappingExist = Boolean(await regulations.count({ gradeIds: id }));
			if (mappingExist) {
				throw new Error(`This pattern is already used in some regulations.`);
			}

			query._id = { $ne: id };
		}

		let nameExist = Boolean(await grades.count(query));
		if (nameExist) {
			throw new Error(`Grading name ${name} already exists.`);
		}

		await validatePattern(courseType, gradeType, grade, id);

		const courseTypeFound = Boolean(await attributes.count({
			name: "type",
			"module": "regulations",
			values: { $elemMatch: { shortName: courseType } }
		}));

		if (!courseTypeFound) {
			throw new Error("Course type not found in attributes.");
		}

		const gradeTypeFound = Boolean(await attributes.count({
			name: "gradeType",
			values: { $elemMatch: { shortName: gradeType } },
			"module": "regulations"
		}));

		if (!gradeTypeFound) {
			throw new Error("Grade type not found in attributes.");
		}

		let letterGrades = new Set(await attributes.distinct("values.shortName", { name: "letterGrade", "module": "regulations" }));

		for (let i = 0; i < grade.length; i++) {
			if (!letterGrades.has(grade[i].letter.toString().trim().toUpperCase())) {
				throw new Error("Letter grade value not found in attributes.");
			}
		}

	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description - Get distinct grade pattern names and ids.
 * @returns {Promise<Array<Object>>} - Promise resolving to an array of distinct grade pattern names and ids.
 */
async function distinct() {
	try {
		let result = await grades.getAll({ name: 1 });
		return Promise.resolve(result);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description - Get grade pattern by object id.
 * @param {Object} id - Object id of the grade pattern.
 * @returns {Promise<Object>} - Promise resolving to an grade pattern.
 */
async function get(id) {
	try {
		let result = await grades.get(id);

		if (!result) {
			throw new Error("Grade pattern not found.");
		}

		return Promise.resolve(result);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description Get grade pattern name , grade type and course type by object ids.
 * @param {Array<ObjectId>} gradeIds Array of grade ids.
 * @returns {Promise<Array<Object>>}  Promise resolving to an array of grade pattern name,grade type and course type.
 */
async function explore(gradeIds) {
	try {

		let courseTypeEnum = await attributeService.getEnumByName("type", "value");
		let gradeTypeEnum = await attributeService.getEnumByName("gradeType", "value");

		let result = await grades.getBy({ _id: { $in: gradeIds } }, { _id: 0 });
		if (!result) {
			throw new Error("Grade pattern not found.");
		}

		result = result.map((grade) => {
			grade.gradeType = gradeTypeEnum.values[grade.gradeType];
			grade.courseType = courseTypeEnum.values[grade.courseType];
			return grade;
		});

		return Promise.resolve(result);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description Pagination function for grades.
 * @param {Object} filter Filter object for pagination.
 * @param {Number} skip Number of records to skip.
 * @param {Number} limit Maximum number of records to return.
 * @param {String} search Search criteria.
 * @param {Object} sort Sort criteria.
 * @returns {Promise<Object>} Promise resolving to pagination result.
 */
async function pagination(filter, skip, limit, search, sort) {
	try {
		let courseTypeEnum = await attributeService.getEnumByName("type", "value");
		let gradeTypeEnum = await attributeService.getEnumByName("gradeType", "value");
		let { query, pipeline } = grades.paginationQuery(filter, search, courseTypeEnum, gradeTypeEnum);
		let result = await grades.basicPagination(
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
 * @description Add a grade pattern.
 * @param {String} name Name of the grade pattern.
 * @param {String} gradeType Type of the grade.
 * @param {String} courseType Type of the course.
 * @param {Array} grade Array of grades with letter, min, max, point
 * @returns {Promise<String>} Promise resolving to a success message.
 */
async function create(name, gradeType, courseType, grade, userName) {
	try {
		await validate(name, gradeType, courseType, grade);
		let result = await grades.create({ name: name, gradeType: gradeType, courseType: courseType, grades: grade });

		if (!result || !result.insertedId) {
			throw new Error("Grade pattern not found.");
		}

		let msg = `Created a new grade pattern named - '${name}'.`;
		await regulationLog("grades", "create", userName, msg);

		return Promise.resolve(`Grading pattern ${name} has been added successfully.`);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description Update a grade pattern.
 * @param {Object} id Object id of grade pattern.
 * @param {String} name Name of the grade pattern.
 * @param {String} gradeType Type of the grade.
 * @param {String} courseType Type of the course.
 * @param {Array} grade Array of grades with letter, min, max, point
 * @returns {Promise<String>} Promise resolving to a success message.
 */
async function update(id, name, gradeType, courseType, grade, userName) {
	try {
		await validate(name, gradeType, courseType, grade, id);

		let result = await grades.update(id, "SET", { name: name, gradeType: gradeType, courseType: courseType, grades: grade });

		if (!result || !result.modifiedCount) {
			throw new Error("No modifications found");
		}

		let msg = `Updated a grade pattern named - '${name}'.`;
		await regulationLog("grades", "update", userName, msg);

		return Promise.resolve(`Grading pattern ${name} has been updated successfully.`);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description Delete a grade pattern.
 * @param {Object} id Object id of grade pattern.
 * @returns {Promise<String>} Promise resolving to a success message.
 */
async function remove(id, userName) {
	try {
		const record = await grades.get(id);
		if (!record) {
			throw new Error("Grade pattern not found.");
		}

		const mappingExist = Boolean(await regulations.count({ gradeIds: id }));
		if (mappingExist) {
			throw new Error("This grade pattern is already used in some regulations.");
		}

		let result = await grades.remove(id);
		if (!result || !result.deletedCount) {
			throw new Error("Failed to delete the grade pattern.");
		}

		let msg = `Deleted a grade pattern named - '${record.name}'.`;
		await regulationLog("grades", "delete", userName, msg);

		return Promise.resolve(`Grading pattern - ${record.name} has been deleted successfully.`);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * @description To check a grade pattern is used.
 * @param {Object} id Object id of grade pattern.
 * @returns {Promise<String>} Promise resolving to a success message.
 */
async function checkUsage(id) {
	try {
		const isExist = await grades.get(id);
		if (!isExist) {
			throw new Error("Grade pattern not found.");
		}

		const mappingExist = Boolean(await regulations.count({ gradeIds: id }));
		return Promise.resolve(mappingExist);
	} catch (e) {
		return Promise.reject(e);
	}
}

export default {
	pagination,
	remove,
	distinct,
	update,
	create,
	get,
	actionItems,
	explore,
	checkUsage
};
