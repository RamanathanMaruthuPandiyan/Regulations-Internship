import { BaseDao } from "./base.js";
const dao = BaseDao("regulations");

/**
 * @description - Constructs a MongoDB aggregation pipeline for pagination with search criteria.
 * @param {String} search - The search query.
 * @returns {Array<Object>} An array representing the MongoDB aggregation pipeline.
 */
function paginationQuery(search = "") {
    try {
        let pipeline = [
            {
                $lookup: {
                    "from": "programmeRegulations",
                    "as": "prgmCount",
                    "let": {
                        "regulationId": "$_id"
                    },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ["$regulationId", "$$regulationId"],
                                }
                            }
                        },
                    ]
                }
            },
            {
                "$addFields": {
                    "prgmCount": { "$size": "$prgmCount" }
                }
            },
            {
                $project: {
                    creditIds: 0,
                    gradeIds: 0,
                    evaluationIds: 0
                }
            }
        ];
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        {
                            title: new RegExp(search, "i")
                        },
                        {
                            year: new RegExp(search, "i")
                        }
                    ],
                },
            });
        }

        return pipeline;
    } catch (e) {
        throw e;
    }
}

export default {
    ...dao,
    paginationQuery,
};
