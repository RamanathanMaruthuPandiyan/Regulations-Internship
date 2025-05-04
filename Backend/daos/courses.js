import { BaseDao } from "./base.js";
import { ObjectId } from "mongodb";
const dao = BaseDao("courses");
import { Courses } from "../enums/enums.js";
import { Mutex } from "async-mutex";
const coursesMutexCached = new Map();

/**
 * @description - Acquires a mutex lock for regulating access to a resource associated with the given regulation key.
 * @param {any} regPrgmId - A concatenation of regulation Id and prgm id.
 * @returns {Mutex} The mutex associated with the given regulation.
 */
function mutex(regPrgmId) {
    if (!coursesMutexCached.has(regPrgmId)) {
        coursesMutexCached.set(regPrgmId, new Mutex());
    }
    return coursesMutexCached.get(regPrgmId);
}

/**
 * @description Cheking a course exists.
 * @param {Object} query filter query consist of courseType or courseCategory.
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

function constructUpdateObj(data) {
    try {
        let obj = {
            "regulationId": data.regulationId,
            "prgm": data.prgmData,
            "semester": data.semester,
            "code": data.code,
            "title": data.title,
            "type": data.type,
            "category": data.category,
            "evalPattern": data.evaluationData,
            "ltpc": data.creditData,
            "prerequisites": data.prerequisites,
            "partType": data.partType,
            "isVertical": data.isVertical,
            "vertical": data.vertical || null,
            "isPlaceholder": data.isPlaceholder,
            "isOneYear": data.isOneYear

        }

        if (data.offeringDept && Object.keys(data.offeringDept).length) {
            obj["offeringDept.id"] = data.offeringDept.id;
            obj["offeringDept.name"] = data.offeringDept.name;
            obj["offeringDept.category"] = data.offeringDept.category;
        } else {
            obj["offeringDept"] = {};
        }

        return obj;
    } catch (e) {
        throw e;
    }
}

/**
 * @description function that construct object for store data
 * @param {Object} data containg courses information
 * @returns {Object} formatted object
 */
function constructObj(data) {
    try {
        let obj = {
            "regulationId": data.regulationId,
            "prgm": data.prgmData,
            "semester": data.semester,
            "code": data.code,
            "title": data.title,
            "type": data.type,
            "category": data.category,
            "evalPattern": data.evaluationData,
            "ltpc": data.creditData,
            "prerequisites": data.prerequisites,
            "partType": data.partType,
            "isVertical": data.isVertical,
            "vertical": data.vertical || null,
            "isPlaceholder": data.isPlaceholder,
            "isOneYear": data.isOneYear,
            "co": {},
            "mapping": {}
        }

        if (data.status) {
            obj["status"] = data.status;
        }

        if (data.mappingStatus) {
            obj["mappingStatus"] = data.mappingStatus;
        }

        if (data.offeringDept) {
            obj["offeringDept"] = data.offeringDept;
        }

        return obj;
    } catch (e) {
        throw e;
    }
}

/**
 * @description - Constructs a MongoDB aggregation pipeline for create course.
 * @param {Object} regulationId  Object id of regulation
 * @param {Object} programmeId Object id of programme
* @returns {Array<Object>} An array representing the MongoDB aggregation pipeline.
 */
function constructPipeline(matchQuery, preQuery = {}) {
    try {

        if (Object.keys(preQuery).length) {
            matchQuery = { ...matchQuery, ...preQuery };
        }

        let pipeline = [
            {
                $match: matchQuery
            },
            {
                $project: {
                    code: 1,
                    title: 1,
                    type: 1,
                    semester: 1,
                    category: 1,
                    prerequisites: {
                        $map: {
                            input: "$prerequisites",
                            as: "prereq",
                            in: "$$prereq.courseCode"
                        }
                    },
                    mappingStatus: 1,
                    hoursPerWeek: "$ltpc.hoursPerWeek",
                    credits: "$ltpc.credits",
                    markSplitUp: "$evalPattern.markSplitUp",
                    isPlaceholder: 1,
                    coUploaders: 1,
                    status: 1
                }
            },
            {
                $facet: {
                    "semWise": [
                        {
                            $match: { semester: { $ne: null } },
                        },
                        {
                            $addFields: { "semStr": { $toString: "$semester" } }
                        },
                        {
                            $group: {
                                _id: { "$concat": ["Semester ", "$semStr"] },
                                semester: { $first: "$semester" },
                                statuses: { $addToSet: "$status" },
                                totalLecture: { $sum: "$hoursPerWeek.lecture" },
                                totalTutorial: { $sum: "$hoursPerWeek.tutorial" },
                                totalPractical: { $sum: "$hoursPerWeek.practical" },
                                totalCredits: { $sum: "$credits" },
                                courseTypes: { $push: { $cond: { if: { $ne: ["$type", null] }, then: "$type", else: "$$REMOVE" } } },
                                categories: { $push: "$category" },
                                courses: {
                                    $push: "$$ROOT"
                                }
                            }
                        },
                        {
                            $sort: {
                                "semester": 1
                            }
                        }
                    ],
                    "categoryWise": [
                        {
                            $match: { semester: { $eq: null } },
                        },
                        {
                            $group: {
                                _id: "$category",
                                statuses: { $addToSet: "$status" },
                                totalLecture: { $sum: "$hoursPerWeek.lecture" },
                                totalTutorial: { $sum: "$hoursPerWeek.tutorial" },
                                totalPractical: { $sum: "$hoursPerWeek.practical" },
                                totalCredits: { $sum: "$credits" },
                                courseTypes: { $push: { $cond: { if: { $ne: ["$type", null] }, then: "$type", else: "$$REMOVE" } } },
                                categories: { $push: "$category" },
                                courses: {
                                    $push: "$$ROOT"
                                }
                            }
                        },
                        {
                            $sort: {
                                "_id": 1
                            }
                        }
                    ]
                }
            }
        ];
        return pipeline;

    } catch (e) {
        throw e;
    }
}

/**
 * @description - Constructs a MongoDB aggregation pipeline for export courses.
 * @param {Object} regulationId
 * @param {Object} programmeId
* @returns {Array<Object>} An array representing the MongoDB aggregation pipeline.
 */
function exportQuery(regulationId, programmeId) {
    try {
        let pipeline = [
            {
                $match: {
                    regulationId: regulationId,
                    "prgm.id": programmeId
                }
            },
            {
                $project: {
                    "_id": 0,
                    "Semester": "$semester",
                    "Course Code": "$code",
                    "Course Title": "$title",
                    "Course Category": "$category",
                    "Course Type": "$type",
                    "Part Type": "$partType",
                    "Lecture Hours": "$ltpc.hoursPerWeek.lecture",
                    "Tutorial Hours": "$ltpc.hoursPerWeek.tutorial",
                    "Practical Hours": "$ltpc.hoursPerWeek.practical",
                    "Credits": "$ltpc.credits",
                    "Evaluation Scheme": "$evalPattern.name",
                    "Offering Department Name": "$offeringDept.name",
                    "Offering Department Category": "$offeringDept.category",
                    "Prerequisites": {
                        $cond: {
                            if: {
                                $gt: [{ $size: "$prerequisites" }, 0]
                            }, then: {
                                $map: {
                                    input: "$prerequisites",
                                    as: "prereq",
                                    in: "$$prereq.courseCode"
                                }
                            }, else: null
                        }
                    },
                    "Is Vertical": { $cond: { if: "$isVertical", then: "YES", else: "NO" } },
                    "Vertical": "$vertical",
                    "Is Placeholder": { $cond: { if: "$isPlaceholder", then: "YES", else: "NO" } },
                    "Is One Year": { $cond: { if: "$isOneYear", then: "YES", else: "NO" } },
                    "sortingKey": {
                        $cond: {
                            if: { $ne: ["$semester", null] },  // If semester exists (not null)
                            then: "$semester",                // Sort by semester
                            else: "$category"                 // Otherwise, sort by category
                        }
                    }
                }
            },
            {
                $sort: { "sortingKey": 1 }  // Sort by the dynamic sortingKey
            },
            {
                $project: {
                    "sortingKey": 0  // Remove the sortingKey from the final projection
                }
            }
        ];
        return pipeline;

    } catch (e) {
        throw e;
    }
}

/**
 * @description Constructing query for bulk select.
 * @param {Object} items selected items.
 * @returns {Object} filterQuery.
 */
function bulkSelectQuery(items) {
    try {
        let filterQuery = {};
        if (items && items.selectAll) {
            if (items && items.uncheckedSelectedItems && items.uncheckedSelectedItems.length) {
                if (!filterQuery["_id"]) {
                    filterQuery["_id"] = {};
                }
                filterQuery["_id"]["$nin"] = (items.uncheckedSelectedItems.map(unchecked => ObjectId(unchecked)));
            }
        } else if (items && items.selectedItems && items.selectedItems.length) {
            if (!filterQuery["_id"]) {
                filterQuery["_id"] = {};
            }
            filterQuery["_id"]["$in"] = (items.selectedItems.map(checked => ObjectId(checked)));
        }

        return filterQuery;
    } catch (e) {
        throw e;
    }
}

/**
 * @description to fetch prgmIds for which schemes are confirmed in a regulation
 * @param {Array<ObjectId>} regulationIds
 * @param {Array<ObjectId} prgmIds
 * @returns {Promise<Array<ObjectId>>} - scheme confirmed prgmIds
 */
async function schemeConfirmedPrgmIds(regulationIds, prgmIds) {
    try {
        let matchQuery = {
            regulationId: { $in: regulationIds },
            semester: 1
        };

        if (prgmIds && prgmIds.length) {
            matchQuery["prgm.id"] = { $in: prgmIds };
        }

        let pipeline = [
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: {
                        "regulationId": "$regulationId",
                        "prgmId": "$prgm.id",
                    },
                    statuses: { $addToSet: "$status" }
                }
            },
            {
                $addFields: { "statusSize": { $size: "$statuses" } }
            },
            {
                $match: { "statusSize": 1, statuses: { $eq: [Courses.status.CONFIRMED] } }
            },
            {
                $group: { _id: null, prgmIds: { $addToSet: "$_id.prgmId" } }
            }
        ];

        let result = await dao.aggregate(pipeline);

        if (!result || !result.length) {
            throw new Error("Schemes are not yet confirmed.")
        }

        return Promise.resolve(result[0].prgmIds);

    } catch (e) {
        throw e;
    }
}

/**
 * @description to fetch scheme confirmed regulationIds for a specific programme
 * @param {Array<ObjectId>} regulationIds
 * @param {ObjectId} prgmId
 * @param {Number} semester
 * @returns {Promise<Array<ObjectId>>} - scheme confirmed regulationIds
 */
async function schemeConfirmedRegulationIds(regulationIds, prgmId, semester) {
    try {
        let pipeline = [
            {
                $match: {
                    regulationId: { $in: regulationIds },
                    "prgm.id": ObjectId(prgmId),
                    semester: parseInt(semester)
                }
            },
            {
                $group: {
                    _id: {
                        "regulationId": "$regulationId",
                    },
                    statuses: { $addToSet: "$status" }
                }
            },
            {
                $addFields: { "statusSize": { $size: "$statuses" } }
            },
            {
                $match: { "statusSize": 1, statuses: { $eq: [Courses.status.CONFIRMED] } }
            },
            {
                $group: { _id: null, regulationIds: { $addToSet: "$_id.regulationId" } }
            }
        ];

        let result = await dao.aggregate(pipeline);

        if (!result || !result.length) {
            throw new Error("Schemes are not yet confirmed.")
        }

        return Promise.resolve(result[0].regulationIds);

    } catch (e) {
        throw e;
    }

}

export default {
    ...dao,
    checkUsage,
    mutex,
    constructObj,
    constructUpdateObj,
    constructPipeline,
    exportQuery,
    bulkSelectQuery,
    schemeConfirmedPrgmIds,
    schemeConfirmedRegulationIds
};
