import { ObjectId } from "mongodb";
import { BaseDao } from "./base.js";
const dao = BaseDao("credits");

/**
 * @description To construct a pagination query.
 * @param {String} search Search criteria.
 * @returns {Object} - An object with search.
 */
function paginationQuery(search = "") {
    try {
        let query = {};
        let pipeline = [
            {
                $project: {
                    name: 1,
                    credits: 1,
                    lecture: "$hoursPerWeek.lecture",
                    tutorial: "$hoursPerWeek.tutorial",
                    practical: "$hoursPerWeek.practical"
                }
            }
        ];
        if (search) {
            query = { name: new RegExp(search, "i") };
        }
        return { query, pipeline };
    } catch (e) {
        throw e;
    }
}

/**
 * @description Construct object for credit pattern.
 * @param {String} name Name of the credit pattern.
 * @param { number } lecture Lecture hours per week.
 * @param { number } tutorial Tutorial hours per week.
 * @param { number } practical Practical hours per week.
 * @param { number } credit Total credits.
 * @returns {Object} - An object with name,credits and hoursPerWeek.
 */
function constructObj(name, lecture, tutorial, practical, credits) {
    try {
        let obj = {
            "name": name,
            "credits": credits,
            "hoursPerWeek": {
                "lecture": lecture,
                "tutorial": tutorial,
                "practical": practical
            }
        };
        return obj;
    } catch (e) {
        throw e;
    }
}

/**
 * @description To validate the credit pattern.
 * @param {Object} obj The obj containg name,credits and hoursPerWeek.
 * @param {ObjectId} id Id of the credit pattern.
 * @returns {Promise<Boolean>} - true if success
 */
async function validateData(name, lecture, tutorial, practical, credit, id) {
    try {
        let nameQuery = { "name": name };
        let patternQuery = {
            "hoursPerWeek.lecture": lecture,
            "hoursPerWeek.tutorial": tutorial,
            "hoursPerWeek.practical": practical,
            "credits": credit
        };

        if (id) {
            let idExist = Boolean(await dao.count({ _id: id }));
            if (!idExist) {
                throw new Error("Invalid id received.");
            }
            nameQuery._id = { $ne: id };
            patternQuery._id = { $ne: id };
        }

        let nameExist = Boolean(await dao.count(nameQuery));
        let patternExist = Boolean(await dao.count(patternQuery));

        if (nameExist) {
            throw new Error(`The name ${name} is already exists(it should be unique).`);
        }

        if (patternExist) {
            throw new Error("Given credit pattern already exists.");
        }

        return Promise.resolve(true);

    } catch (e) {
        throw e;
    }
}

export default {
    ...dao,
    paginationQuery,
    constructObj,
    validateData,
};
