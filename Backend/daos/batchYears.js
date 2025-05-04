import { BaseDao } from "./base.js";
const dao = BaseDao("batchYears");

/**
 * @description Retrieves distinct batch years based on provided criteria.
 * @param {Object} academicYear The academic year object containing startYear and endYear properties.
 * @returns {Promise<Array<String>>} A promise resolving to an array of distinct batch years.
 */
async function getPendingPrgms(activeBatchYear, academicSemester, programmes) {
    try {
        let prgmIds = programmes.map((prgm) => prgm.prgmId);
        let pipeline = [
            {
                $match: {
                    status: "A",
                    prgmId: { $in: prgmIds }
                }
            },
            {
                $lookup:
                {
                    from: "programmes",
                    let: {
                        prgm: "$prgmId"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: ["$_id", "$$prgm"]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "programme"
                }
            }, {
                $unwind: "$programme"
            },
            {
                $addFields: {
                    "yearDurationDiff": { $subtract: [activeBatchYear, "$batchYear"] }
                }
            },
            {
                $match: {
                    $expr: { $lt: ["$yearDurationDiff", "$programme.duration"] }
                }
            },
            {
                $addFields: {
                    "semester": { $sum: [{ $multiply: ["$yearDurationDiff", 2] }, academicSemester] }
                }
            },
            {
                $project: {
                    "programme": {
                        $concat: [
                            '$programme.category', ' - ',
                            '$programme.type', ' - ',
                            '$programme.name', ' - ', '$programme.mode', ' - ', { $toString: '$batchYear' }, ' - ', { $toString: '$semester' }
                        ],
                    },
                    batchYear: 1,
                    prgmId: 1,
                    semester: 1,
                }
            },
            {
                $lookup: {
                    from: "regulationBatchYear",
                    let: {
                        prgmId: "$prgmId",
                        batchYear: "$batchYear",
                        semester: "$semester",
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$prgm.id", "$$prgmId"] },
                                        { $eq: ["$batchYear", "$$batchYear"] },
                                        { $eq: ["$semester", "$$semester"] },
                                    ],
                                }
                            }
                        },
                        {
                            $project: { prgmRegulationId: 1 }
                        }
                    ],
                    as: "mappingExists"
                }
            },
            {
                $lookup: {
                    from: "programmeRegulations",
                    let: {
                        prgmId: "$prgmId",
                        semester: "$semester"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$prgm.id", "$$prgmId"] },
                                        { $in: ["$$semester", "$freeze"] },
                                    ],
                                }
                            }
                        }
                    ],
                    as: "courseExists"
                }
            },
            {
                $match: {
                    "mappingExists.0": { $exists: false },
                    "courseExists.0": { $exists: true },
                    "semester": { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: {
                        prgmId: "$prgmId",
                        batchYear: "$batchYear",
                        semester: "$semester"
                    },
                    batchIds: { $push: "$_id" },  // Assuming _id represents batchId
                    programme: { $first: "$programme" }  // Keeping the programme details
                }
            },
            {
                $sort: {
                    "_id.semester": 1
                }
            }
        ];

        let result = await dao.aggregate(pipeline);

        result = result.map((res) => ({
            data: { prgmId: res._id.prgmId, batchYear: res._id.batchYear, batchIds: res.batchIds, semester: res._id.semester },
            value: res._id.prgmId.toString() + res._id.semester.toString() + res._id.batchYear.toString(),
            label: res.programme
        }));

        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description Get regulation mapping records
 * @param {Object} regulationData
 * @param {Array<ObjectId>} batchIds
 * @returns {Promise<Array<Object>>} records
 */
async function getMappingRecords(regulationData, batchIds) {
    try {
        let batchYearRecords = await dao.aggregate(
            [
                {
                    $match: { "_id": { $in: batchIds } }
                },
                {
                    $lookup:
                    {
                        from: "programmeRegulations",
                        let: { prgmId: "$prgmId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$regulationId", regulationData.id] },
                                            { $eq: ["$prgm.id", "$$prgmId"] }
                                        ],
                                    }
                                }
                            }
                        ],
                        as: "programme"
                    }
                }
            ]
        );

        if (!batchYearRecords || !batchYearRecords.length) {
            throw new Error("No records found to construct regulation mapping.");
        }

        return Promise.resolve(batchYearRecords);
    } catch (e) {
        throw e;
    }
}

export default {
    ...dao,
    getPendingPrgms,
    getMappingRecords
};