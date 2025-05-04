import regulations from "../daos/regulations.js";
import credits from "../daos/credits.js";
import grades from "../daos/grades.js";
import courses from "../daos/courses.js";
import programmes from "../daos/programmes.js";
import evaluationSchemes from "../daos/evaluationSchemes.js";
import programmeRegulations from "../daos/programmeRegulations.js";
import regulationBatchYear from "../daos/regulationBatchYear.js";
import sendMail from "./sendMail.js";
import stateTransition from "./stateTransition.js";
import jobs from "../daos/jobs.js";
import { setDifference } from './common.js'
import { client } from "../daos/MongoDbUtil.js";
import { ObjectId } from "mongodb";
import { Regulations, Action_Items, Mapping, Jobs } from "../enums/enums.js";
import { ROLES } from "../middleware/auth.js";
import { regulationLog } from "../daos/log.js";
import { Mutex } from "async-mutex";
const regMutex = new Mutex();

/**
 * @description - Retrieves a regulation by its object id.
 * @param {ObjectId} id - The object id of the regulation.
 * @returns {Promise<Object>} A Promise that resolves to the regulation object.
 */
async function get(id) {
    try {
        let record = await regulations.get(id);

        if (!record) {
            throw new Error("Failed to fetch regulation record.");
        }

        let result = {
            _id: id,
            title: record.title,
            year: record.year,
            creditRecord: await credits.getBy({ _id: { $in: record.creditIds } }, { _id: 1, name: 1 }),
            gradeRecord: await grades.getBy({ _id: { $in: record.gradeIds } }, { _id: 1, name: 1 }),
            evaluationRecord: await evaluationSchemes.getBy({ _id: { $in: record.evaluationIds } }, { _id: 1, name: 1 }),
            prgmRecord: await programmeRegulations.distinct("prgm", { regulationId: id }),
            attachments: record.attachment
        };

        if (record.status == Regulations.status.APPROVED) {
            result.isApproved = true;
        }

        if (record.reason && (record.status == Regulations.status.REQUESTED_CHANGES || record.status == Regulations.status.WAITING_FOR_APPROVAL)) {
            result["reason"] = record.reason;
        }

        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Function to check whether all fields have been received or not in routes.
 * @param {Object} data All the data from the req.body.
 * @returns {Object} Throws error if any fields are missing or else returns valid payload
 */
function validatePayload(data) {
    try {
        let title = data.title;
        let creditIds = data.creditIds;
        let gradeIds = data.gradeIds;
        let evaluationIds = data.evaluationIds;
        let programmeIds = data.programmeIds;
        let attachments = data.file;

        if (!title || !creditIds || !creditIds.length || !gradeIds ||
            !gradeIds.length || !evaluationIds || !evaluationIds.length ||
            !programmeIds || !programmeIds.length ||
            !attachments || !Object.keys(attachments).length) {
            throw new Error("Mandatory fields are missing.");
        }

        creditIds = creditIds.map((id) => { return ObjectId(id) });
        gradeIds = gradeIds.map((id) => { return ObjectId(id) });
        evaluationIds = evaluationIds.map((id) => { return ObjectId(id) });
        programmeIds = programmeIds.map((id) => { return ObjectId(id) });

        return { title, creditIds, gradeIds, evaluationIds, programmeIds, attachments };
    } catch (e) {
        throw e;
    }
}

/**
 * @description - Changes the status of a regulation.
 * @param {ObjectId} id - The object id of the regulation.
 * @param {String} destination - The destination status of the regulation.
 * @param {Array<String>} roles - Array of user roles.
 * @param {String} userName - who logged in
 * @param {String} reason - Reason for changing the status to requested changes.
 * @returns {Promise<String>} A Promise that resolves to a status change message.
 */
async function changeStatus(id, destination, roles, userName, userId, reason) {
    try {
        let result = await regMutex.runExclusive(async () => {
            try {
                let record = await regulations.get(id);

                if (!record) {
                    throw new Error("Regulation record not found.");
                }

                if (!stateTransition.isTransitionAllowed(stateTransition.regulation, record.status, destination, roles)) {
                    throw new Error("You are not authorized to perform this action.");
                }

                let details = { status: destination };

                if (destination == Regulations.status.REQUESTED_CHANGES) {
                    details["reason"] = reason;
                }

                let res = await regulations.update(id, "SET", details);

                if (!res || !res.modifiedCount) {
                    throw new Error("Failed to change the regulation status.");
                }

                let msg = `The status for the regulation '${record.title} - ${record.year} - ${record.version}' has been changed from
                '${Regulations.status.descriptions[record.status]}' to '${Regulations.status.descriptions[destination]}'.`;

                await regulationLog("regulations", "state change", userName, msg);

                let jobId = await jobs.createJob(Jobs.names.Regulation_ChangeStatus);

                sendMail.regulationMailService(destination, record.year, record.version, record.title, msg, jobId, userName, userId, reason);

                return Promise.resolve(msg);

            } catch (e) {
                return Promise.reject(e);
            }
        });
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Determines the actions items that can be performed on a regulation based on its status and user roles.
 * @param {ObjectId} id - The object id of the regulation.
 * @param {Array<String>} userRoles - Array of user roles.
 * @returns {Promise<Array<String>>} A Promise that resolves to an array of action items.
 */
async function actionItems(id, userRoles = []) {
    try {
        let actions = [Action_Items.action.VIEW];

        let record = await regulations.get(id, { status: 1 });

        if (!record) {
            throw new Error("Regulation record not found.");
        }

        if (record.status == Regulations.status.DRAFT && (userRoles.has(ROLES.RF) || userRoles.has(ROLES.A))) {
            actions = [...actions, Action_Items.action.EDIT, Action_Items.action.DELETE, Action_Items.action.SEND_FOR_APPROVAL];
        }

        if (record.status == Regulations.status.WAITING_FOR_APPROVAL && (userRoles.has(ROLES.RF) || userRoles.has(ROLES.A))) {
            actions.push(Action_Items.action.EDIT);
        }

        if (record.status == Regulations.status.REQUESTED_CHANGES && (userRoles.has(ROLES.RF) || userRoles.has(ROLES.A))) {
            actions = [...actions, Action_Items.action.SEND_FOR_APPROVAL, Action_Items.action.EDIT];
        }

        if (record.status == Regulations.status.WAITING_FOR_APPROVAL && (userRoles.has(ROLES.RA) || userRoles.has(ROLES.A))) {
            actions = [...actions, Action_Items.action.APPROVE, Action_Items.action.REQUEST_CHANGES];
        }

        if (record.status == Regulations.status.APPROVED && (userRoles.has(ROLES.RF) || userRoles.has(ROLES.A))) {
            actions = [...actions, Action_Items.action.CLONE];
        }

        if (record.status == Regulations.status.APPROVED && (userRoles.has(ROLES.RA) || userRoles.has(ROLES.A))) {
            actions = [...actions, Action_Items.action.EDIT];
        }

        return Promise.resolve(actions);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Middleware function to inject regulation ID from request headers.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 */
function injectRegulationId(req, res, next) {
    if (req.headers.regulationid) {
        req.body.regulationid = ObjectId(req.headers.regulationid);
        next();
    }
    return res.status(400).json({ message: "Regulation id not found." });
}

/**
 * @description - Retrieves counts of various entities related to a regulation.
 * @param {Object} data - Data object containing creditIds, gradeIds, evaluationIds, programmeIds, and year.
 * @returns {Promise<Object>} A Promise that resolves to an object containing counts and regulation IDs.
 */
async function getCount(data) {
    try {

        let [creditCount, gradeCount, evaluationCount, prgmCount] = await Promise.all(
            [
                credits.count({ "_id": { "$in": data.creditIds } }),
                grades.count({ "_id": { "$in": data.gradeIds } }),
                evaluationSchemes.count({ "_id": { "$in": data.evaluationIds } }),
                programmes.count({ "_id": { "$in": data.programmeIds }, status: "A" })
            ]
        );

        return { creditCount, gradeCount, evaluationCount, prgmCount };
    } catch (e) {
        throw e;
    }
}

/**
 * @description - To auto compute the version.
 * @param {Number} year - Year of the regulation.
 * @returns {Number} Returns the auto computed version for the year.
 */
async function autoComputeVersion(data) {
    try {
        let version = 1;
        let regulationIds = await programmeRegulations.distinct("regulationId", { "prgm.id": { $in: data.programmeIds } });
        let versionArray = await regulations.distinct("version", { "year": data.year, _id: { $in: regulationIds } });
        if (versionArray && versionArray.length) {
            version = versionArray[versionArray.length - 1] + 1;
        }
        return version;
    } catch (e) {
        throw e;
    }
}

function compareObjects(a, b) {
    a = Object.keys(a).sort();
    b = Object.keys(b).sort();

    if (JSON.stringify(a) !== JSON.stringify(b)) {
        return false;
    }

    for (let key of a) {
        if (a[key] !== b[key]) {
            return false;
        }
    }

    return true;
}

/**
 * @description - Validates data before creating or updating a regulation.
 * @param {Object} data - Data object containing creditIds, gradeIds, evaluationIds, programmeIds, and year.
 * @param {ObjectId} id - Object id of the regulation (optional).
 * @returns {Promise<Object>} A Promise that resolves to a validation result JSON object.
 */
async function validateData(data, id) {
    try {
        let resultJson = {
            isInValid: false,
            err: [],
        };

        if (data.year) {
            data["version"] = await autoComputeVersion(data);
        }

        let { creditCount, gradeCount, evaluationCount, prgmCount } = await getCount(data, id);

        if (creditCount !== data.creditIds.length) {
            resultJson.isInValid = true;
            resultJson.err.push("Invalid credit patterns selected.");
        }

        if (gradeCount !== data.gradeIds.length) {
            resultJson.isInValid = true;
            resultJson.err.push("Invalid grade patterns selected.");
        }

        if (evaluationCount !== data.evaluationIds.length) {
            resultJson.isInValid = true;
            resultJson.err.push("Invalid evaluation scheme names.");
        }

        if (prgmCount !== data.programmeIds.length) {
            resultJson.isInValid = true;
            resultJson.err.push("Invalid programme names.");
        }

        let query = { _id: { $in: data.programmeIds } };

        if (id) {
            const existingRecord = await regulations.get(id);

            if (!existingRecord) {
                throw new Error("Regulation record not found.");
            }

            if (existingRecord.status == Regulations.status.APPROVED) {
                if (existingRecord.title != data.title || !compareObjects(existingRecord.attachment, data.attachment)) {
                    throw new Error("The regulation year, title and atachments can't be updated.");
                }
            }

            let existingPrgmIds = await programmeRegulations.distinct("prgm.id", { regulationId: id });

            const { deleted: oldCreditIds, added: newCreditIds } = setDifference(existingRecord.creditIds, data.creditIds, true);

            const { deleted: oldEvaluationIds, added: newEvaluationIds } = setDifference(existingRecord.evaluationIds, data.evaluationIds, true);

            const { deleted: oldProgrammeIds, added: newProgrammeIds } = setDifference(existingPrgmIds, data.programmeIds, true);

            const [courseUnderCredits, courseUnderEvaluation, courseUnderProgramme] = await Promise.all(
                [
                    oldCreditIds && oldCreditIds.length ? courses.count(
                        {
                            regulationId: id,
                            "ltpc.id": { $in: oldCreditIds },
                        }
                    ) : 0,
                    oldEvaluationIds && oldEvaluationIds.length ? courses.count(
                        {
                            regulationId: id,
                            "evalPattern.id": { $in: oldEvaluationIds },
                        }
                    ) : 0,
                    oldProgrammeIds && oldProgrammeIds.length ? courses.count(
                        {
                            regulationId: id,
                            prgmId: { $in: oldProgrammeIds },
                        }
                    ) : 0
                ]
            );
            if (courseUnderCredits) {
                resultJson.isInValid = true;
                resultJson.err.push("Some of the credit patterns can't be removed since some courses come under this credits and regulation.");
            }

            if (courseUnderEvaluation) {
                resultJson.isInValid = true;
                resultJson.err.push("Some of the evaluation schemes can't be removed since some courses come under this evaluations and regulation.");
            }

            if (courseUnderProgramme) {
                resultJson.isInValid = true;
                resultJson.err.push("Some of the programmes can't be removed since some courses come under this programmes.");
            }

            if (existingPrgmIds && existingPrgmIds.length) {
                resultJson.oldProgrammeIds = oldProgrammeIds;
                query = { _id: { $in: newProgrammeIds } };
            }
        }

        resultJson["prgmData"] = await programmes.getBy(query, {
            prgm: {
                id: "$_id", category: "$category", name: "$name", duration: "$duration", mode: "$mode", type: "$type", shortName: "$shortName",
                stream: "$stream"
            },
            dept: {
                id: "$dept.id", category: "$dept.category", name: "$dept.name"
            }
        });

        return resultJson;
    } catch (e) {
        throw e;
    }
}


/**
 * @description - Creates a new regulation.
 * @param {String} title - Title of the regulation.
 * @param {Number} year - Year of the regulation.
 * @param {Array<String>} creditIds - Array of credit ids.
 * @param {Array<String>} gradeIds - Array of grade ids.
 * @param {Array<String>} evaluationIds - Array of evaluation ids.
 * @param {Array<String>} programmeIds - Array of programme ids.
 * @param {Object} attachment - regulation attachment
 * @param {String} userName - user who performed the action
 * @returns {Promise<string|Array<String>>} A Promise that resolves to a success message or an array of error messages.
 */
async function create(title, year, creditIds, gradeIds, evaluationIds, programmeIds, attachment, userName, cloneId) {
    try {
        let result = await regMutex.runExclusive(async () => {
            try {
                let data = {
                    year: year,
                    creditIds: creditIds,
                    gradeIds: gradeIds,
                    evaluationIds: evaluationIds,
                    programmeIds: programmeIds
                };

                let resultJson = await validateData(data);

                if (resultJson.isInValid) {
                    throw { "name": "multiErr", "message": resultJson.err };
                }

                const session = client.startSession();
                try {
                    const transactionOptions = {
                        readPreference: "primary",
                        readConcern: { level: "local" },
                        writeConcern: { w: "majority" },
                        maxCommitTimeMS: 1000,
                    };

                    await session.withTransaction(async () => {
                        let result = await regulations.create(
                            {
                                title: title,
                                year: year,
                                version: data.version,
                                status: Regulations.status.DRAFT,
                                creditIds: creditIds,
                                gradeIds: gradeIds,
                                evaluationIds: evaluationIds,
                                attachment: attachment
                            },
                            { session }
                        );

                        if (!result || !result.insertedId) {
                            throw new Error("Error while creating the regulation.");
                        }

                        if (resultJson.prgmData && resultJson.prgmData.length) {
                            let records = resultJson.prgmData.map(programme => (
                                {
                                    regulationId: result.insertedId,
                                    prgm: programme.prgm,
                                    dept: programme.dept,
                                    poStatus: Mapping.status.DRAFT,
                                    po: {},
                                    peo: [],
                                    pso: [],
                                    freeze: [],
                                    verticals: []
                                }
                            ));

                            await programmeRegulations.createMany(records, { session });
                        }

                    }, transactionOptions);
                } catch (e) {
                    return Promise.reject(e);
                } finally {
                    await session.endSession();
                }

                let msg = `Created a new regulation '${year} - ${data.version}- ${title}'.`;
                if (cloneId) {
                    let result = await regulations.getOne({ _id: ObjectId(cloneId) }, { year: 1, title: 1, version: 1 });
                    msg = `Cloned a new regulation '${year} - ${data.version} - ${title}'. From regulation - '${result.year} - ${result.version} - ${result.title}.`
                }

                await regulationLog("regulations", cloneId ? "clone" : "create", userName, msg);

                return Promise.resolve(`Regulation '${title} - ${data.version} - ${title}' has been ${cloneId ? "cloned" : "created"} successfully.`);
            } catch (e) {
                return Promise.reject(e);
            }
        });
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Updates an existing regulation.
 * @param {ObjectId} id - Object id of the regulation.
 * @param {String} title - Title of the regulation.
 * @param {Array<String>} creditIds - Array of credit ids.
 * @param {Array<String>} gradeIds - Array of grade ids.
 * @param {Array<String>} evaluationIds - Array of evaluation ids.
 * @param {Array<String>} programmeIds - Array of programme ids.
 * @param {Object} attachment - File attached
 * @param {String} userName - user who performed the action.
 * @returns {Promise<string|Array<String>>} A Promise that resolves to a success message or an array of error messages.
 */
async function update(id, title, creditIds, gradeIds, evaluationIds, programmeIds, attachment, userName) {
    try {
        let result = await regMutex.runExclusive(async () => {
            try {
                let data = {
                    title: title,
                    creditIds: creditIds,
                    gradeIds: gradeIds,
                    evaluationIds: evaluationIds,
                    programmeIds: programmeIds,
                    attachment: attachment
                };

                let record = await regulations.get(id, { _id: 0, year: 1, version: 1 });

                if (!record) {
                    throw new Error("Regulation record not found.");
                }

                let resultJson = await validateData(data, id);

                if (resultJson.isInValid) {
                    throw { "name": "multiErr", "message": resultJson.err };
                }

                const session = client.startSession();
                try {
                    const transactionOptions = {
                        readPreference: "primary",
                        readConcern: { level: "local" },
                        writeConcern: { w: "majority" },
                        maxCommitTimeMS: 1000,
                    };
                    await session.withTransaction(async () => {
                        let result = await regulations.update(
                            id,
                            "SET",
                            {
                                title: title,
                                creditIds: creditIds,
                                gradeIds: gradeIds,
                                evaluationIds: evaluationIds,
                                attachment
                            },
                            { session }
                        );

                        if (!result.modifiedCount && !resultJson.oldProgrammeIds.length && !resultJson.prgmData.length) {
                            throw new Error("No modifications found.");
                        }

                        if (resultJson.oldProgrammeIds && resultJson.oldProgrammeIds.length) {
                            let result = await programmeRegulations.removeBy({ regulationId: id, "prgm.id": { "$in": resultJson.oldProgrammeIds } }, { session });
                            if (!result || !result.deletedCount) {
                                throw new Error("Failed to remove the programmes.");
                            }
                        }

                        if (resultJson.prgmData && resultJson.prgmData.length) {
                            const records = resultJson.prgmData.map(programme => (
                                {
                                    regulationId: id,
                                    prgm: programme.prgm,
                                    dept: programme.dept,
                                    poStatus: Mapping.status.DRAFT,
                                    po: {},
                                    peo: [],
                                    pso: [],
                                    freeze: [],
                                    verticals: []
                                }
                            ));
                            let result = await programmeRegulations.createMany(records, { session });
                            if (!result || !result.insertedIds || !Object.keys(result.insertedIds).length) {
                                throw new Error("Failed to create new programmes.");
                            }
                        }

                        if (!result) {
                            throw new Error("Failed to update regulation record.");
                        }

                    }, transactionOptions);
                } catch (e) {
                    return Promise.reject(e);
                } finally {
                    await session.endSession();
                }

                let msg = `Updated a regulation '${record.year} - ${record.version} - ${title}'.`;

                await regulationLog("regulations", "update", userName, msg);

                return Promise.resolve(`Regulation '${title} - ${record.year} - ${record.version}' has been updated successfully.`);
            } catch (e) {
                return Promise.reject(e);
            }
        });
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Deletes a regulation.
 * @param {ObjectId} id - Object id of the regulation.
 * @param {String} userName - who deleted the regulation
 * @returns {Promise<String>} A Promise that resolves to a success message.
 */
async function remove(id, userName) {
    try {
        let result = await regMutex.runExclusive(async () => {
            try {
                const record = await regulations.get(id);

                if (!record) {
                    throw new Error("Regulation record not found.");
                }

                if (record.status != Regulations.status.DRAFT) {
                    throw new Error("You can delete regulations only if it is in 'Draft' state.");
                }

                const session = client.startSession();
                try {
                    const transactionOptions = {
                        readPreference: "primary",
                        readConcern: { level: "local" },
                        writeConcern: { w: "majority" },
                        maxCommitTimeMS: 1000,
                    };
                    await session.withTransaction(async () => {

                        await programmeRegulations.removeBy({ regulationId: id }, { session });
                        await regulationBatchYear.removeBy({ regulationId: id }, { session });
                        await courses.removeBy({ regulationId: id }, { session });

                        let result = await regulations.remove(id, { session });

                        if (!result || !result.deletedCount) {
                            throw new Error("Failed to delete the regulation.");
                        }

                    }, transactionOptions);
                } catch (e) {
                    return Promise.reject(e);
                } finally {
                    await session.endSession();
                }

                let msg = `Deleted a regulation '${record.year} - ${record.version} - ${record.title}'.`;

                await regulationLog("regulations", "delete", userName, msg);

                return Promise.resolve(`Regulation '${record.title} - ${record.year} - ${record.version}' has been deleted successfully.`);
            } catch (e) {
                return Promise.reject(e);
            }
        });
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

//to get query based on role
function getQueryByRoles(userRoles) {
    try {
        let query = { $or: [] };
        let statusArray = [Regulations.status.APPROVED];
        if (userRoles.has(ROLES.A) || userRoles.has(ROLES.RF)) {
            statusArray = [...statusArray, Regulations.status.DRAFT, Regulations.status.WAITING_FOR_APPROVAL, Regulations.status.REQUESTED_CHANGES];
        }
        if (userRoles.has(ROLES.A) || userRoles.has(ROLES.RA)) {
            statusArray = [...statusArray, Regulations.status.WAITING_FOR_APPROVAL];
        }
        statusArray = Array.from(new Set(statusArray));
        statusArray.map((status) => {
            query.$or.push({ status: status });
        });

        return { query };
    } catch (e) {
        throw e;
    }
}

/**
 * @description - Performs pagination for regulations based on filters, search, and sort criteria.
 * @param {Object} filter - Filter object containing status, year, and programName.
 * @param {Number} skip - Number of documents to skip.
 * @param {Number} limit - Maximum number of documents to return.
 * @param {String} search - Search query.
 * @param {Object} sort - Sort criteria.
 * @returns {Promise<Object>} A Promise that resolves to the paginated result.
 */
async function pagination(filter, skip, limit, search, sort, { userRoles }) {
    try {
        let { query } = getQueryByRoles(userRoles);

        if (filter.status && filter.status.length) {
            query.status = { $in: filter.status };
        }

        if (filter.year && filter.year.length) {
            query.year = { $in: filter.year };
        }

        if (filter.prgmIds && filter.prgmIds.length) {
            filter.prgmIds = filter.prgmIds.map(val => ObjectId(val));
            let regulationIds = await programmeRegulations.distinct("regulationId", { "prgm.id": { "$in": filter.prgmIds } });
            query._id = { $in: regulationIds };
        }

        let pipeline = regulations.paginationQuery(search);
        let result = await regulations.basicPagination(
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

//to fetch distinct fields
async function distinct(field, { userRoles }) {
    try {
        let { query } = getQueryByRoles(userRoles);
        let result = await regulations.distinct(field, query);
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

//to fetch programme names based on userRoles
async function programNamesByRole({ userRoles }) {
    try {
        let { query } = getQueryByRoles(userRoles);
        let distinctRegulationIds = await regulations.distinct("_id", query);
        let result = await programmeRegulations.getBy({ regulationId: { $in: distinctRegulationIds } },
            {
                _id: 0,
                prgmId: "$prgm.id",
                name: {
                    "$concat": [
                        "$prgm.category", ' - ', "$prgm.type", ' - ', "$prgm.name", ' - ', "$prgm.mode"
                    ]
                }
            });
        result = Array.from(new Map(result.map(item => [item.prgmId.toString(), item])).values());
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description to fetch regulation attachments
 * @param {ObjectId} regulationId
 * @returns {Promise<Object>} attachments
 */
async function getAttachments(regulationId) {
    try {
        let regAttachments = await regulations.getOne(regulationId, { attachments: 1, _id: 0 });

        if (!regAttachments || !Object.keys(regAttachments).length) {
            throw new Error("Failed to fetch regulation attachments.");
        }

        let result = regAttachments.attachments;
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description to fetch approved regulations
 * @returns {Promise<Array>} - approved regulations
 */
async function fetchApprovedRegulations(regulationId, programmeId) {
    try {
        let query = { status: Regulations.status.APPROVED }
        if (regulationId && programmeId) {

            let regulationIds = await programmeRegulations.distinct("regulationId", { "prgm.id": programmeId, "regulationId": { $ne: regulationId } });

            if (!regulationIds.length) {
                throw new Error("No possible programme regulations found for clone.");
            }
            query._id = { $in: regulationIds };


        }
        let names = await regulations.getBy(query, {
            "year": 1,
            "version": 1,
            "title": 1
        },
            {
                sort: { "_id": -1 }
            }
        );
        return Promise.resolve(names);
    } catch (e) {
        return Promise.reject(e);
    }
}

export default {
    get,
    remove,
    create,
    update,
    validatePayload,
    pagination,
    changeStatus,
    actionItems,
    getAttachments,
    injectRegulationId,
    distinct,
    programNamesByRole,
    fetchApprovedRegulations
};