import { BaseDao } from "./base.js";
const dao = BaseDao("regulationBatchYear");
import { ObjectId } from "mongodb";

const searchParams = [
    "regulation.title",
    "prgm.category",
    "dept.name",
    "prgm.mode",
    "prgm.name",
    "prgm.shortName",
    "prgm.stream",
    "prgm.type"
];

/**
 * @description - Constructs a MongoDB aggregation pipeline for moving regulation to next semester.
* @returns {Array<Object>} An array representing the MongoDB aggregation pipeline.
 */
function constructPipeline() {
    try {

        let pipeline = [
            {
                $match: {
                    $expr: {
                        $lt: ["$semester", { $multiply: ["$prgm.duration", 2] }]
                    }
                }
            },
            {
                $addFields: {
                    semester: { $add: ["$semester", 1] }
                }
            },
            {
                $lookup: {
                    from: "programmeRegulations",
                    let: {
                        id: "$prgmRegulationId",
                        semester: "$semester"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: ["$_id", "$$id"]
                                        },
                                        {
                                            $in: ["$$semester", "$freeze"]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "mappingExists"
                },
            },
            {
                $match: {
                    mappingExists: { $ne: [] }
                }
            },
            {
                $project: { _id: 0, mappingExists: 0 }
            }
        ];
        return pipeline;

    } catch (e) {
        throw e;
    }
}

/**
 * @description Constructing query for pagination.
 * @param {Object} filter Filter object for pagination.
 * @param {String} search Search criteria.
 * @returns {Object} Query for pagination.
 */
function paginationQuery(filter = {}, search = "") {
    try {
        let query = {};
        if (filter.prgmIds && filter.prgmIds.length) {
            filter.prgmIds = filter.prgmIds.map(val => ObjectId(val));
            query["prgm.id"] = { $in: filter.prgmIds };
        }

        if (filter.batchYear && filter.batchYear.length) {
            query["batchYear"] = { $in: filter.batchYear };
        }

        if (filter.regulationYear && filter.regulationYear.length) {
            query["regulation.year"] = { $in: filter.regulationYear };
        }

        if (search) {
            const searchMatch = [];
            searchParams.forEach(function (item) {
                let searchItems = {};
                searchItems[item] = { $regex: search, $options: "i" };
                searchMatch.push(searchItems);
            });

            query["$or"] = searchMatch;
        }

        return query;
    } catch (e) {
        throw e;
    }
}

export default {
    ...dao,
    paginationQuery,
    constructPipeline
}