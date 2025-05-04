import programmeRegulations from "../daos/programmeRegulations.js";
import regulations from "../daos/regulations.js";
import programmes from "../daos/programmes.js";
import courses from "../daos/courses.js";
import sendMail from "./sendMail.js";
import { setDifference } from "./common.js";
import { Mapping, Courses, Jobs, Action_Items } from "../enums/enums.js";
import { regulationLog } from "../daos/log.js";
import users from "../daos/users.js";
import jobs from "../daos/jobs.js";
import stateTransition from "./stateTransition.js";
import { ROLES } from "../middleware/auth.js";
import { ObjectId } from "mongodb";
import { client } from "../daos/MongoDbUtil.js";

/**
 * @description - Determines the actions items that can be performed on a programme outcomes based on its status and user roles.
 * @param {ObjectId} id - The object id of the regulation.
 * @param {Array<String>} userRoles - Array of user roles.
 * @returns {Promise<Array<String>>} A Promise that resolves to an array of action items.
 */
async function actionItems(id, userName, userRoles = []) {
    try {

        let actions = [];

        let record = await programmeRegulations.get(id, { poStatus: 1, prgmId: "$prgm.id" });
        let access = Boolean(await users.getOne({ userId: userName, programmeIds: record.prgmId }));

        if (!record) {
            throw new Error("Programme regulation record not found.");
        }

        if (record.poStatus == Mapping.status.DRAFT && ((userRoles.has(ROLES.PU) && access) || userRoles.has(ROLES.A))) {
            actions.push(Action_Items.action.EDIT, Action_Items.action.SEND_FOR_APPROVAL);
        }

        if (record.poStatus == Mapping.status.WAITING_FOR_APPROVAL && ((userRoles.has(ROLES.PU) && access) || userRoles.has(ROLES.A))) {
            actions.push(Action_Items.action.EDIT);
        }

        if (record.poStatus == Mapping.status.REQUESTED_CHANGES && ((userRoles.has(ROLES.PU) && access) || userRoles.has(ROLES.A))) {
            actions.push(Action_Items.action.SEND_FOR_APPROVAL, Action_Items.action.EDIT);
        }

        if (record.poStatus == Mapping.status.WAITING_FOR_APPROVAL && ((userRoles.has(ROLES.OA) && access) || userRoles.has(ROLES.A))) {
            actions = [...actions, Action_Items.action.APPROVE, Action_Items.action.REQUEST_CHANGES];
        }

        return Promise.resolve(actions);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function getRegulationInfo(regulationId) {
    try {
        let { regulationInfo } = await regulations.get(regulationId, {
            _id: 0, regulationInfo: {
                $concat: ["$year", " - ", { $toString: "$version" }, " - ", "$title"]
            }
        });

        return regulationInfo;
    } catch (e) {
        throw e;
    }
}
async function getProgrammeInfo(regulationId, prgmId) {
    try {
        let { programmeInfo } = await programmeRegulations.getOne({ regulationId: regulationId, "prgm.id": prgmId }, {
            _id: 0,
            programmeInfo: {
                $concat: ["$prgm.category", " - ", "$prgm.type", " - ", "$prgm.name", " - ", "$prgm.mode"]
            }
        });

        return programmeInfo;
    } catch (e) {
        throw e;
    }
}


async function freezeSemester(regulationId, prgmId, semester, userName) {
    try {
        let isCoursesNotConfirmed = Boolean(await courses.count({ regulationId: regulationId, "prgm.id": prgmId, semester: semester, status: { $ne: Courses.status.CONFIRMED } }));

        if (isCoursesNotConfirmed) {
            throw new Error(`There are still some courses under the semester '${semester}' that have been not yet'${Courses.status.descriptions.CO}'.`);
        }

        let result = await programmeRegulations.updateOne({ regulationId: regulationId, "prgm.id": prgmId }, "ADDTOSET", { freeze: semester });

        if (!result || !result.modifiedCount) {
            throw new Error("No modifications found.");
        }

        let msg = `Freezed semester - '${semester}' under the regulation - '${await getRegulationInfo(regulationId)}' and programme - '${await getProgrammeInfo(regulationId, prgmId)}'.`;

        await regulationLog("programme regulations", "freeze semester", userName, msg);

        return Promise.resolve(`Semester ${semester} - freezed successfully.`);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - To fetch programme id for the given regulation id.
 * @param {ObjectId} regulationId - Object id of regulation.
 * @returns {Promise<String>} - A Promise that resolves to an array of programme Ids.
 */
async function getProgrammeIds(regulationId) {
    try {
        let programmeIds = await programmeRegulations.distinct("prgm.id", { "regulationId": regulationId });
        return Promise.resolve(programmeIds);
    } catch (e) {
        throw e;
    }
}

/**
 * @description - Changes the status of a regulation.
 * @param {ObjectId} id - The object id of the regulation.
 * @param {String} destination - The destination status of the regulation.
 * @param {Array<String>} roles - Array of user roles.
 * @param {String} reason - Reason for changing the status to requested changes.
 * @returns {Promise<String>} A Promise that resolves to a status change message.
 */
async function changeStatus(id, destination, roles, userName, userId, reason) {
    try {
        let result = await programmeRegulations.mutex(id.toString()).runExclusive(async () => {
            try {
                let prgmRegRec = await programmeRegulations.get(id, {
                    prgmId: "$prgm.id", programme: "$prgm.name", type: "$prgm.type", mode: "$prgm.mode", category: "$prgm.category", poStatus: 1, regulationId: 1, po: 1, peo: 1, pso: 1
                });
                if (!prgmRegRec) {
                    throw new Error("Programme Regulation not found.");
                }
                if (!Object.keys(prgmRegRec.po).length) {
                    throw new Error("The programme outcomes are not yet specified.");
                }
                if (!Object.keys(prgmRegRec.pso).length) {
                    throw new Error("The programme specific objectives are not yet specified.");
                }
                if (!Object.keys(prgmRegRec.peo).length) {
                    throw new Error("The programme educational objectives are not yet specified.");
                }
                let regRec = await regulations.get(prgmRegRec.regulationId, { title: 1, year: 1, version: 1, _id: 0 });
                if (!regRec) {
                    throw new Error("Regulation not found.");
                }
                if (!stateTransition.isTransitionAllowed(stateTransition.programmeRegulation, prgmRegRec.poStatus, destination, roles)) {
                    throw new Error("Illegal state transition detected.");
                }
                let details = { poStatus: destination };
                if (destination == Mapping.status.REQUESTED_CHANGES) {
                    details["reason"] = reason;
                }
                let result = await programmeRegulations.update(id, "SET", details);
                if (!result || !result.modifiedCount) {
                    throw new Error("No modifications found.");
                }
                let msg = "The Programme outcome status for the programme '"
                    + prgmRegRec.programme + " - " + prgmRegRec.category + " - "
                    + prgmRegRec.mode + " - " + prgmRegRec.type + "', under the regulation '"
                    + regRec.title + " - " + regRec.year + " - " + regRec.version
                    + "' has been changed from '"
                    + Mapping.status.descriptions[prgmRegRec.poStatus]
                    + "' to '"
                    + Mapping.status.descriptions[destination] + "'.";
                await regulationLog("programme regulations", "state change", userName, msg);
                let jobId = await jobs.createJob(Jobs.names.PO_ChangeStatus);
                sendMail.programmeOutcomeMailService(destination, regRec, prgmRegRec, msg, jobId, userName, userId, reason);
                return Promise.resolve(`The programme outcome status has been changed to '${Mapping.status.descriptions[destination]}'.`);
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
 * @description - To fetch programme outcomes for the given regulation id and programme id.
 * @param {ObjectId} id - Object id of prgmRegulation.
 * @param {Object} projection
 * @returns {Promise<String>} - A Promise that resolves to an array of programme outcomes.
 */
async function getOutcomes(id, projection) {
    try {
        projection.poStatus = 1;
        let result = await programmeRegulations.get(id, projection);

        if (!result) {
            throw new Error("Error while fetching programme outcomes.");
        }

        return Promise.resolve(result);
    } catch (e) {
        throw e;
    }
}

/**
 * @description - To fetch basic info of programmes for the given regulation id and programme id.
 * @param {ObjectId} regulationId - Object id of regulation.
 * @param {ObjectId} programmeId - Object id of programme.
 * @returns {Promise<Object>} - A Promise that resolves a programmes info.
 */
async function basicInfo(regulationId, programmeId) {
    try {
        let pipeline = programmeRegulations.constructQuery(regulationId, programmeId);
        let prgmData = await programmeRegulations.aggregate(pipeline);

        if (!prgmData || !prgmData.length) {
            throw new Error("Programme regulation details not found.");
        }

        prgmData[0].poStatus = Mapping.status.descriptions[prgmData[0].poStatus];

        let distinctStatus = await courses.distinct("status", { regulationId: regulationId, "prgm.id": programmeId });

        let prgmStatus = '';
        if (distinctStatus && distinctStatus.length) {
            if (distinctStatus.every(status => status == Courses.status.APPROVED)) {
                prgmStatus = Courses.displayStatus.APPROVED;
            } else if (distinctStatus.every(status => status == Courses.status.CONFIRMED)) {
                prgmStatus = Courses.displayStatus.CONFIRMED;
            } else if (distinctStatus.every(status => status == Courses.status.DRAFT)) {
                prgmStatus = Courses.displayStatus.DRAFT;
            } else if (distinctStatus.every(status => status == Courses.status.WAITING_FOR_APPROVAL)) {
                prgmStatus = Courses.displayStatus.WAITING_FOR_APPROVAL;
            } else if (distinctStatus.every(status => status == Courses.status.REQUESTED_CHANGES)) {
                prgmStatus = Courses.displayStatus.REQUESTED_CHANGES;
            } else if (distinctStatus.some((status) => [Courses.status.APPROVED, Courses.status.CONFIRMED].includes(status))) {
                prgmStatus = Courses.displayStatus.PARTIALLY_VERIFIED;
            } else {
                prgmStatus = Courses.displayStatus.PENDING;
            }
        }

        prgmData[0].statusDesc = Courses.displayStatus.descriptions[prgmStatus];

        return Promise.resolve(prgmData[0]);

    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description To fetch programmeIds for which user have access.
 * @param {String} userId
 * @returns {Promise<Array<ObjectId>>} - A Promise that resolves to an array of programmeIds.
 */
async function allowedPrgms(userId) {
    try {
        let result = await users.distinct("programmeIds", { userId });
        return Promise.resolve(result);

    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Validates data of regulation id and programme id.
 * @param {ObjectId} regulationId - Object id of regulation.
 * @param {ObjectId} prgmId - Object id of programme.
 * @param {String} username
 * @returns {Promise<Boolean>} value that denotes user have access.
 */
async function validateData(regulationId, prgmId, username) {
    try {
        let isExist = Boolean(await programmeRegulations.count({
            regulationId: regulationId,
            "prgm.id": prgmId
        }));

        if (!isExist) {
            throw new Error("Programme regulation record not found.");
        }

        let userData = await users.getOne({ userId: username });

        if (!userData || !Object.keys(userData).length) {
            throw new Error("User not found.");
        }

        userData.programmeIds = userData.programmeIds.map((id) => id.toString());

        if (!userData.programmeIds || !userData.programmeIds.length || !userData.programmeIds.includes(prgmId.toString())) {
            throw new Error("You are not allowed to perform this operation.");
        }

        return Promise.resolve(true);
    } catch (e) {
        throw e;
    }
}

/**
 * @description - Add a verticals for courses.
 * @param {ObjectId} regulationId - Object id of regulation.
 * @param {ObjectId} prgmId - Object id of programme.
 * @param {Array} verticalSet - Array of verticals.
 * @param {String} username
 * @param {Boolean} isAdmin
 * @returns {Promise<String>} A Promise that resolves to a success message.
 */
async function verticals(regulationId, prgmId, verticalSet, userName, isAdmin) {
    try {
        if (!isAdmin) {
            await validateData(regulationId, prgmId, userName);
        }

        let prgmRegRec = await programmeRegulations.getOne({ regulationId: regulationId, "prgm.id": prgmId }, { verticals: 1 });

        if (!prgmRegRec) {
            throw new Error("Programme regulation record not found.");
        }

        if (!verticalSet || !verticalSet.length) {
            verticalSet = [];
        }

        let detailsToUpdate = { "verticals": verticalSet };

        let existingVerticals = prgmRegRec.verticals || [];

        let count = {};
        verticalSet.forEach(verticalName => {
            count[verticalName] = (count[verticalName] || 0) + 1;
        });

        for (const vertical in count) {
            if (count[vertical] > 1) {
                throw new Error(`Vertical name - '${vertical}' already exists.`);
            }
        }

        let { deleted } = await setDifference(existingVerticals, verticalSet);
        if (deleted && deleted.length) {
            let count = await courses.count({ regulationId, "prgm.id": prgmId, vertical: { $in: deleted } });

            if (count) {
                throw new Error(`Vertical - ${deleted} can't be removed since some courses added under this vertical.`);
            }
        }

        let result = await programmeRegulations.updateOne(
            {
                regulationId: regulationId,
                "prgm.id": prgmId
            },
            "SET",
            detailsToUpdate,
        );

        if (!result || !result.modifiedCount) {
            throw new Error("No modifications found.");
        }

        return Promise.resolve("Verticals have been added successfully.");
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Add a minimum credits of regular and lateral.
 * @param {ObjectId} regulationId - Object id of regulation.
 * @param {ObjectId} prgmId - Object id of programme.
 * @param {Boolean} isLateral - to denote lateral entry is allowed or not
 * @param {Number} regularCredits - minimum credits for regular.
 * @param {Number} lateralCredits - minimum credits for lateral.
 * @param {String} username - to check user have access
 * @param {Boolean} isAdmin - field to denote user is admin or not
 * @returns {Promise<String>} A Promise that resolves to a success message.
 */
async function minimumCredits(regulationId, prgmId, isLateral, regularCredits, lateralCredits, username, isAdmin) {
    try {
        if (!isAdmin) {
            await validateData(regulationId, prgmId, username);
        }

        const regExpression = /^[1-9]\d*$/;
        if (!regExpression.test(regularCredits) || (isLateral && !regExpression.test(lateralCredits))) {
            throw new Error("Credits must be a number positive number.");
        } else if (regularCredits > 500 || (isLateral && lateralCredits > 500)) {
            throw new Error("Maximum value of credits is 500.");
        }

        let obj = {
            minCredits: { "regular": regularCredits }
        };

        if (isLateral) {
            obj["minCredits"] = {
                "regular": regularCredits,
                "lateral": lateralCredits
            }
        }

        let { existingMinCredits } = await programmeRegulations.getOne({ regulationId, "prgm.id": prgmId }, { existingMinCredits: "$minCredits" });

        let result = await programmeRegulations.updateOne(
            {
                regulationId: regulationId,
                "prgm.id": prgmId
            },
            "SET",
            obj
        );

        if (!result || !result.modifiedCount) {
            throw new Error("No modifications found.");
        }

        let msg = "";

        if (existingMinCredits && Object.keys(existingMinCredits).length && existingMinCredits.regular == regularCredits && !isLateral && !obj.hasOwnProperty("lateral")) {
            msg = "Lateral entry credits have been removed successfully.";
        } else if (isLateral) {
            msg = "Lateral entry credits have been updated successfully.";
        } else {
            msg = "Minimum credits have been updated successfully.";
        }

        return Promise.resolve(msg);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description Add a course code sub string to programme regulation
 * @param {ObjectId} regulationId - Object id of regulation.
 * @param {ObjectId} prgmId - Object id of programme
 * @param {String} courseCodeSubStr - course code sub string
 * @returns {Promise<String>} A Promise that resolves to a success message.
 */
async function courseCodeSubstring(regulationId, prgmId, courseCodeSubStr, username, isAdmin) {
    try {
        if (!isAdmin) {
            await validateData(regulationId, prgmId, username);
        }

        let result = await programmeRegulations.updateOne(
            {
                regulationId: regulationId,
                "prgm.id": prgmId
            },
            "SET",
            {
                courseCodeSubStr: courseCodeSubStr
            }
        );

        if (!result || !result.modifiedCount) {
            throw new Error("No modifications found.");
        }

        return Promise.resolve("Course code substring have been updated successfully.");
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description To validate PO can be updated or not
 * @param {ObjectId} id - prgmRegulationId
 * @returns {Promise<Boolean>} - to denote PO can be updated
 */
async function poValidation(id, username, isAdmin) {
    try {
        let prgmRegRec = await programmeRegulations.get(id);

        if (!prgmRegRec) {
            throw new Error("Programme regulation record not found.");
        }

        if (!isAdmin) {
            await validateData(prgmRegRec.regulationId, prgmRegRec.prgm.id, username);
        }

        if (prgmRegRec.poStatus == Mapping.status.APPROVED) {
            throw new Error("The programme outcomes can't be updated since it is already 'Approved'.");
        }


        return Promise.resolve({ regulationId: prgmRegRec.regulationId, programmeId: prgmRegRec.prgm.id });
    } catch (e) {
        throw e;
    }
}

/**
 * @description Add a programme outcomes to programme regulation
 * @param {ObjectId} id - Object id of programme regulation.
 * @param {Array<String>}  - Array of programme outcomes
 * @returns {Promise<String>} A Promise that resolves to a success message.
 */
async function updatePO(id, programmeOutcomes, userName, isAdmin) {
    try {
        let { regulationId, programmeId } = await poValidation(id, userName, isAdmin);

        let result = await programmeRegulations.mutex(id.toString()).runExclusive(async () => {
            try {
                let obj = {};
                programmeOutcomes.map((po, index) => obj["PO" + parseInt(index + 1)] = po.trim());

                let result = await programmeRegulations.updateOne({ _id: id }, "SET", { po: obj });

                if (!result || !result.modifiedCount) {
                    throw new Error("No modifications found.");
                }

                let msg = `Updated the programme outcome under the regulation - '${await getRegulationInfo(regulationId)}' for the programme - '${await getProgrammeInfo(regulationId, programmeId)}'.`;
                await regulationLog("programme regulations", "updated po", userName, msg);

                return Promise.resolve("Programme outcomes have been updated successfully.");
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
 * @description Add prgm specific objectives to programme regulation
 * @param {ObjectId} id - Object id of programme regulation.
 * @param {Array<String>}  - Array of programme specific objectives.
 * @returns {Promise<String>} A Promise that resolves to a success message.
 */
async function updatePSO(id, specificObjectives, userName, isAdmin) {
    try {
        let { regulationId, programmeId } = await poValidation(id, userName, isAdmin);

        let result = await programmeRegulations.mutex(id.toString()).runExclusive(async () => {
            try {
                specificObjectives = specificObjectives.map((pso) => pso.trim());

                let obj = {};
                specificObjectives.map((pso, index) => obj["PSO" + parseInt(index + 1)] = pso.trim());

                let result = await programmeRegulations.updateOne({ _id: id }, "SET", { pso: obj });

                if (!result || !result.modifiedCount) {
                    throw new Error("No modifications found.");
                }

                let msg = `Updated the programme specific objectives under the regulation - '${await getRegulationInfo(regulationId)}' for the programme - '${await getProgrammeInfo(regulationId, programmeId)}'.`;
                await regulationLog("programme regulations", "updated pso", userName, msg);

                return Promise.resolve("Programme specific objectives have been updated successfully.");
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
 * @description Add a programme educational objectives outcomes to programme regulation
 * @param {ObjectId} id - Object id of programme regulation.
 * @param {Array<String>}  - Array of programme educational objectives.
 * @returns {Promise<String>} A Promise that resolves to a success message.
 */
async function updatePEO(id, educationalObjectives, userName, isAdmin) {
    try {
        let { regulationId, programmeId } = await poValidation(id, userName, isAdmin);

        let result = await programmeRegulations.mutex(id.toString()).runExclusive(async () => {
            try {

                let obj = {};
                educationalObjectives.map((peo, index) => obj["PEO" + parseInt(index + 1)] = peo.trim());

                let result = await programmeRegulations.updateOne({ _id: id }, "SET", { peo: obj });

                if (!result || !result.modifiedCount) {
                    throw new Error("No modifications found.");
                }

                let msg = `Updated the programme educational objectives under the regulation - '${await getRegulationInfo(regulationId)}' for the programme - '${await getProgrammeInfo(regulationId, programmeId)}'.`;
                await regulationLog("programme regulations", "updated peo", userName, msg);

                return Promise.resolve("Programme educational objectives have been updated successfully.");
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
 * @description - Performs pagination for programme regulations based on filters, search, and sort criteria.
 * @param {ObjectId} id - Object id of regulation.
 * @param {Number} skip - Number of documents to skip.
 * @param {Number} limit - Maximum number of documents to return.
 * @param {String} search - Search query.
 * @param {Object} sort - Sort criteria.
 * @returns {Promise<Object>} A Promise that resolves to the paginated result.
 */
async function pagination(regulationId, filter, skip, limit, search, sort) {
    try {
        let { query, pipeline } = programmeRegulations.paginationQuery(regulationId, filter, search);
        let result = await programmeRegulations.basicPagination(
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
 * @description - Retrieves distinct programme id , name, type, mode, and category.
 * @returns {Promise<Array<Object>>} - A Promise that resolves to an array of distinct regulation objects containing title, year, and version.
 */
async function distinct(departmentIds) {
    try {
        let match = { status: "A" };

        if (departmentIds && departmentIds.length) {
            match["dept.id"] = { $in: departmentIds };
        }

        let result = await programmes.getBy(match, { "dept": "$dept.id", "name": 1, "type": 1, "category": 1, "mode": 1, "_id": 1 });
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description Function to fetch filter data
 * @param {String} regId
 * @returns {Promise<String|Object>} - distinct data for filter
 */
async function filterData(regId) {
    try {
        let prgmData = await programmeRegulations.getBy({ regulationId: regId }, {
            _id: 0,
            prgmId: "$prgm.id",
            prgmName: "$prgm.name",
            deptId: "$dept.id",
            deptName: "$dept.name",
            type: "$prgm.type"
        });

        let result = prgmData.reduce((acc, data) => {
            acc.prgm.push({ id: data.prgmId, name: data.prgmName });
            acc.dept.push({ id: data.deptId, name: data.deptName });
            acc.type.add(data.type);
            return acc;
        }, {
            prgm: [],
            dept: [],
            type: new Set()
        });

        result.type = Array.from(result.type);

        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description  * Validates the mapping between programme outcomes (PO) and course outcomes (CO).
 * Ensures all POs and COs in the mapping exist in the provided `po` and `co` objects,
 * and that levels are valid (LOW, MEDIUM, STRONG).
 * @param {Object} mapping  Object with PO keys and CO objects as values.
 * @param {Object} po Object with PO identifiers as keys.
 * @param {Object} co Object with CO identifiers as keys.
 * @throws Will throw an error if any PO or CO in the mapping is invalid or if levels are not valid.
 */
function validatePoPeo(mapping, po, peo) {
    try {
        let programmeOutcomes = Object.keys(po);
        let educationObjectivies = Object.keys(peo);
        let levels = Object.keys(Mapping.level.values);

        for (let poMap in mapping) {

            if (!programmeOutcomes.includes(poMap)) {
                throw new Error(`Invalid programme outcome - ${poMap}`);
            }

            for (let peoMap in mapping[poMap]) {

                if (!educationObjectivies.includes(peoMap)) {
                    throw new Error(`Invalid programme educational objectives - ${peoMap} of programme outcome - ${poMap}`);
                }

                mapping[poMap][peoMap] = mapping[poMap][peoMap].trim().toString().trim().toUpperCase();

                if (!levels.includes(mapping[poMap][peoMap])) {
                    throw new Error(`Invalid level of programme outcome - ${mapping[poMap][peoMap]} of peo - ${peoMap} , po - ${poMap}`);
                }
            }
        }

    } catch (error) {
        throw error;
    }
}

/**
 * @description - Function to mapping programme outcomes and course outcomes.
 * @param {ObjectId} id Object id of course.
 * @param {Object} mapping programme outcomes and course outcomes mapping data.
 * @returns {Promise<String>} - A Promise that resolves to a success message.
 */
async function mapping(id, mapping, userName) {
    try {
        let prgmRecord = await programmeRegulations.get(id, { po: 1, regulationId: 1, "prgm.id": 1, poStatus: 1, peo: 1 });

        if (!prgmRecord || !Object.keys(prgmRecord).length) {
            throw new Error("Invalid programme regulation id received.");
        }

        if (!prgmRecord.po || !Object.keys(prgmRecord.po).length) {
            throw new Error("The programme outcomes doesn't exist..");
        }

        if (!prgmRecord.peo || !Object.keys(prgmRecord.peo).length) {
            throw new Error("The programme educational objectives doesn't exist..");
        }

        if (!prgmRecord.poStatus || prgmRecord.poStatus == Mapping.status.APPROVED) {
            throw new Error("Can't update the PO-PEO mapping since it is already approved.");
        }

        validatePoPeo(mapping, prgmRegRec.po, prgmRegRec.peo);

        let result = await programmeRegulations.update(id, "SET", { mapping });

        if (!result || !result.modifiedCount) {
            throw new Error("No modifications found.");
        }

        let msg = `Programme outcome and programme educational objectives have been mapped.`;

        await regulationLog("programme regulations", "po peo mapping", userName, msg);

        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Function for clone programme schemes.
 * @param {ObjectId} regulationId Object id of regulation for clone.
 * @param {Object} prgmRegId Object id of programme regulation.
 * @returns {Promise<String>} - A Promise that resolves to a success message.
 */
async function clone(regulationId, prgmRegId, username) {
    try {

        //Current PrgRegRec
        let prgmRecord = await programmeRegulations.getOne({ _id: prgmRegId });
        if (!prgmRecord || !Object.keys(prgmRecord).length) {
            throw new Error("Invalid programme regulation id received.");
        }

        let cloneRecord = await programmeRegulations.getOne({ regulationId, "prgm.id": prgmRecord.prgm.id });
        if (!cloneRecord || !Object.keys(cloneRecord).length) {
            throw new Error("Invalid regulation id received for clone.");
        }

        let cloneVerticals = [...new Set([...cloneRecord.verticals])];

        let regulationRecord = await regulations.getBy(
            {
                _id: { $in: [prgmRecord.regulationId, cloneRecord.regulationId] }
            },
            {
                year: 1, title: 1, version: 1, gradeIds: 1, creditIds: 1, evaluationIds: 1

            });

        prgmRecord.regulation = regulationRecord.find((record) => {
            if (record._id.toString() == prgmRecord.regulationId.toString()) {
                return record;
            }
        });

        cloneRecord.regulation = regulationRecord.find((record) => {
            if (record._id.toString() == cloneRecord.regulationId.toString()) {
                return record;
            }
        });

        prgmRecord.regulation.creditIds.push(null);
        prgmRecord.regulation.evaluationIds.push(null);

        //cloning programme schemes
        let courseResult = await courses.getBy(
            {
                "regulationId": cloneRecord.regulationId,
                "prgm.id": cloneRecord.prgm.id,
                "ltpc.id": { $in: prgmRecord.regulation.creditIds },
                "evalPattern.id": { $in: prgmRecord.regulation.evaluationIds }
            },
            {
                _id: 0,
            });
        if (courseResult.length) {
            const courseCodeIdMap = new Map();
            courseResult = courseResult.map((course) => {
                const courseId = new ObjectId();
                if (!courseCodeIdMap.has(course.code)) {
                    courseCodeIdMap.set(course.code, courseId);
                }
                return {
                    ...course,
                    _id: courseId,
                    prerequisites: course.prerequisites.map((prereq) => prereq.courseCode),
                    regulationId: prgmRecord.regulationId,
                    status: Courses.status.DRAFT,
                    mappingStatus: Mapping.status.DRAFT,
                    mapping: {},
                    co: {}
                };
            });

            courseResult = courseResult.map((course) => ({
                ...course,
                prerequisites: course.prerequisites.map((prereqCode) => {
                    if (courseCodeIdMap.has(prereqCode)) {
                        return {
                            courseId: courseCodeIdMap.get(prereqCode),
                            courseCode: prereqCode
                        }
                    }
                    return null;
                }).filter(Boolean)
            }));

            const session = client.startSession();
            try {
                const transactionOptions = {
                    readPreference: "primary",
                    readConcern: { level: "local" },
                    writeConcern: { w: "majority" },
                    maxCommitTimeMS: 1000,
                };

                await session.withTransaction(async () => {

                    await programmeRegulations.updateOne({ _id: prgmRegId }, "SET", { verticals: cloneVerticals }, { session });

                    let result = await courses.createMany(courseResult, { session });

                    if (!result || !result.insertedIds) {
                        throw new Error("Error occurred while cloning the schemes.");
                    }

                }, transactionOptions);
            } catch (e) {
                return Promise.reject(e);
            } finally {
                await session.endSession();
            }

        }
        else {
            throw new Error("No possible courses found for clone.")
        }

        let msg = "Programme schemes of regulation - '"
            + prgmRecord.regulation.title + " - " + prgmRecord.regulation.year + " - "
            + prgmRecord.regulation.version + "' has been cloned successfully. From programme schemes of regulation - '"
            + cloneRecord.regulation.title + " - " + cloneRecord.regulation.year + " - " + cloneRecord.regulation.version + ".'";
        ;

        await regulationLog("programme regulations", "clone", username, msg);

        return Promise.resolve(msg);
    } catch (e) {
        return Promise.reject(e);
    }
}

export default {
    changeStatus,
    pagination,
    distinct,
    minimumCredits,
    basicInfo,
    courseCodeSubstring,
    allowedPrgms,
    getProgrammeIds,
    verticals,
    updatePO,
    updatePSO,
    updatePEO,
    getOutcomes,
    filterData,
    freezeSemester,
    actionItems,
    mapping,
    clone
};
