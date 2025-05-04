import { BaseDao } from "./base.js";
const dao = BaseDao("programmeRegulations");
import { Mutex } from "async-mutex";
const programmeRegMutexCached = new Map();
import { ObjectId } from "mongodb";

/**
 * @description - Acquires a mutex lock for regulating access to a resource associated with the given regulation key.
 * @param {any} id - Programme regulation record.
 * @returns {Mutex} The mutex associated with the given regulation.
 */
function mutex(id) {
    if (!programmeRegMutexCached.has(id)) {
        programmeRegMutexCached.set(id, new Mutex());
    }
    return programmeRegMutexCached.get(id);
}

/**
 * @description - Constructs a MongoDB aggregation pipeline for programme regulation.
 * @param {ObjectId} regulationId - Object id of regulation.
 * @param {ObjectId} programmeId - Object id of programme.
 * @returns {Array<Object>} An array representing the MongoDB aggregation pipeline.
 */
function constructQuery(regulationId, programmeId) {
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
                    _id: 0,
                    prgmRegId: "$_id",
                    prgm: 1,
                    dept: 1,
                    regulationId: 1,
                    status: 1,
                    poStatus: 1,
                    minCredits: 1,
                    courseCodeSubStr: 1,
                    verticals: 1
                }
            },
            {
                $lookup: {
                    from: "regulations",
                    as: "regulationData",
                    let: {
                        id: "$regulationId"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$id"]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                title: 1,
                                year: 1,
                                version: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$regulationData"
                }
            },
            {
                $project: {
                    dept: "$dept.name",
                    category: "$prgm.category",
                    name: "$prgm.name",
                    shortName: "$prgm.shortName",
                    type: "$prgm.type",
                    mode: "$prgm.mode",
                    duration: "$prgm.duration",
                    stream: "$prgm.stream",
                    minCredits: 1,
                    courseCodeSubStr: 1,
                    regulationYear: "$regulationData.year",
                    version: "$regulationData.version",
                    title: "$regulationData.title",
                    verticals: 1,
                    prgmRegId: 1,
                    poStatus: 1
                }
            }
        ];

        return pipeline;
    } catch (e) {
        throw e;
    }
}

/**
 * @description - Constructs a MongoDB aggregation pipeline for pagination with search criteria.
 * @param {ObjectId} id - Object id of the regulation.
 * @param {String} search - The search query.
 * @returns {Array<Object>} An array representing the MongoDB aggregation pipeline.
 */
function paginationQuery(regulationId, filter = {}, search = "") {
    try {
        let query = {};
        let pipeline = [];
        query.regulationId = regulationId;

        if (filter.prgmIds && filter.prgmIds.length) {
            query["prgm.id"] = { $in: filter.prgmIds.map((id) => ObjectId(id)) };
        }
        if (filter.deptIds && filter.deptIds.length) {
            query["dept.id"] = { $in: filter.deptIds.map((id) => ObjectId(id)) };
        }
        if (filter.type && filter.type.length) {
            query["prgm.type"] = { $in: filter.type };
        }

        pipeline.push({
            $project: {
                _id: 0,
                prgmId: "$prgm.id",
                name: "$prgm.name",
                type: "$prgm.type",
                dept: "$dept.name",
                category: "$prgm.category",
                mode: "$prgm.mode",
                duration: "$prgm.duration"
            }
        });
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            type: new RegExp(search, "i"),
                        },
                        {
                            category: new RegExp(search, "i"),
                        },
                        {
                            mode: new RegExp(search, "i"),
                        },
                        {
                            name: new RegExp(search, "i"),
                        },
                        {
                            dept: new RegExp(search, "i"),
                        }
                    ],
                },
            });
        }
        return { query, pipeline };
    } catch (e) {
        throw e;
    }
}

async function getSchemeConfirmedRegulationIds(programmes) {
    try {
        let programmeIds = programmes.map((programme)=>programme.prgmId)
        let result = await dao.aggregate([
            {
                $project: {
                    "regulationId": 1,
                    "prgmId": "$prgm.id",
                    "semester" : "$freeze"
                }
            },
            {
                $match: {
                    "prgmId": { $in: programmeIds }
                }
            },
            {
                $unwind : "$semester"
            },
            {
                $match: {
                    "$or": programmes
                }
            },
            {
                $group: {
                    _id: "$regulationId", prgmIds: { $addToSet: "$prgmId" }
                }
            },
            {
                $match: { prgmIds: { $all: programmeIds } }
            },
            {
                $group: { _id: null, regulationIds: { $addToSet: "$_id" } }
            },
        ]);

        if (!result || !result.length) {
            throw new Error("No possible regulations found");
        }

        return Promise.resolve(result[0].regulationIds);

    } catch (e) {
        throw e;
    }
}

export default {
    ...dao,
    paginationQuery,
    constructQuery,
    getSchemeConfirmedRegulationIds,
    mutex
};
