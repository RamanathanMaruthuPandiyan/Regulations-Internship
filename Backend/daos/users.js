import { BaseDao } from "./base.js";
const dao = BaseDao("users");

/**
 * @description Constructing query for pagination.
 * @param {Object} filter Filter object for pagination.
 * @param {String} search Search criteria.
 * @returns {Object} Query for pagination.
 */
function paginationQuery(search = "") {
    try {
        let preQuery = {};
        let postQuery = {};
        if (search) {
            postQuery = {
                $or: [
                    {
                        userId: new RegExp(search, "i")
                    },
                    {
                        firstName: new RegExp(search, "i")
                    },
                    {
                        roles: new RegExp(search, "i")
                    },
                    {
                        "departments.name": new RegExp(search, "i")
                    },
                    {
                        "programmes.name": new RegExp(search, "i")
                    }
                ]
            };
        }

        let pipeline = [
            {
                $lookup: {
                    from: 'departments',
                    let: {
                        departmentIds: '$departmentIds'
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ['$_id', '$$departmentIds'] },
                            }
                        },
                        {
                            $project: {
                                name: {
                                    $concat: [
                                        "$name", " - ",
                                        "$category",
                                    ]
                                }
                            }
                        }

                    ],
                    as: 'departments'
                }
            },
            {
                $lookup: {
                    from: 'programmes',
                    let: {
                        programmeIds: '$programmeIds',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ['$_id', '$$programmeIds'] },
                            }
                        },
                        {
                            $project: {
                                name: {
                                    $concat: [
                                        "$name", " - ",
                                        "$category", " - ",
                                        "$type", " - ",
                                        "$mode"
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'programmes'
                }
            },
        ];

        return { preQuery, pipeline, postQuery };
    } catch (e) {
        throw e;
    }
}

export default {
    ...dao,
    paginationQuery
};
