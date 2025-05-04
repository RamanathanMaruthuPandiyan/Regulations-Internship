import fileService from "./fileService.js";
import excelTemplateService from "../services/excelTemplateService.js";
import validateExcelSheet from "../utilities/excelFileValidator.js";
import attributes from "./attributes.js";
import regulations from "../daos/regulations.js";
import courses from "../daos/courses.js";
import credits from "../daos/credits.js";
import departments from "../daos/departments.js";
import evaluationSchemes from "../daos/evaluationSchemes.js";
import programmeRegulations from "../daos/programmeRegulations.js";
import faculty from "./remote/faculty.js";
import stateTransition from "./stateTransition.js";
import sendMail from "./sendMail.js";
import { ROLES } from '../middleware/auth.js';
import { client } from "../daos/MongoDbUtil.js";
import { ObjectId } from "mongodb";
import { regulationLog } from "../daos/log.js"
import { Regulations, Action_Items, Courses, Mapping, Jobs } from "../enums/enums.js";
import users from "../daos/users.js";
import jobs from "../daos/jobs.js";
import { createRequire } from "module";
import xlsx from "xlsx";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
    nonSemesterCategories,
    semesterCategories,
    semesterCount,
    verticalPlaceHolderNotAllowed,
    verticalAllowedSet,
    placeholderAllowedSet
} from "../constants.js";
const require = createRequire(import.meta.url);
const { v4: uuid } = require('uuid');
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = require('../config/config.' + process.env.NODE_ENV);


function getFormattedStr(str) {
    return str.toString().trim().toUpperCase();
}

async function getOutcomesAccess(regulationId, prgmId, userId, userRoles) {
    try {
        const isOutcomesActive = await determineOutcomesAccess(
            regulationId,
            prgmId,
            userId,
            userRoles
        );
        return Promise.resolve({ isOutcomesActive });
    } catch (e) {
        return Promise.reject(e);
    }
}

async function determineOutcomesAccess(regulationId, prgmId, userId, userRoles) {
    const [regulation, user] = await Promise.all([
        programmeRegulations.getOne({ regulationId, "prgm.id": prgmId }, { poStatus: 1 }),
        users.getOne({ userId, programmeIds: { $in: [prgmId] } }, { DbUserRoles: "$roles" })
    ]);

    const { poStatus } = regulation || {};
    const { DbUserRoles = [] } = user || {};

    if (userRoles.has(ROLES.A)) return true;

    if (poStatus == Mapping.status.APPROVED) return true;

    if (userRoles.has(ROLES.SA1) && DbUserRoles.includes(ROLES.SA1)) return true;

    if ((userRoles.has(ROLES.FA) || userRoles.has(ROLES.SF) || userRoles.has(ROLES.SA2)) && poStatus == Mapping.status.APPROVED) return true;

    if (
        userRoles.has(ROLES.PU) &&
        DbUserRoles.includes(ROLES.PU)
    ) return true;

    if (
        userRoles.has(ROLES.OA) &&
        poStatus != Mapping.status.DRAFT &&
        DbUserRoles.includes(ROLES.OA)
    ) return true;

    return false;
}

async function setIsFreezeActive(regulationId, prgmId, semester, roles) {
    try {
        let isFreezeActive = false;
        if (roles.has(ROLES.SA2) || roles.has(ROLES.A)) {
            isFreezeActive = true;
            let freezedSemester = await programmeRegulations.distinct("freeze", { regulationId: regulationId, "prgm.id": prgmId });
            if (freezedSemester.includes(semester)) {
                isFreezeActive = false;
            } else {
                let distinctStatus = await courses.distinct("status", { regulationId: regulationId, "prgm.id": prgmId, semester: semester });

                isFreezeActive = distinctStatus.length == 1 && distinctStatus[0] == Courses.status.CONFIRMED;
            }
        }

        return Promise.resolve({ isFreezeActive });
    } catch (e) {
        return Promise.reject(e);
    }
}


async function getUserProgramIds(username) {
    try {
        let prgmIds = await users.distinct("programmeIds", { userId: username });
        if (prgmIds && prgmIds.length) {
            prgmIds = prgmIds.map((id) => id.toString());
        }
        return prgmIds;
    } catch (e) {
        throw e;
    }
}

function getConstants() {
    try {
        let result = {
            nonSemesterCategories: Array.from(nonSemesterCategories),
            verticalPlaceHolderNotAllowed: Array.from(verticalPlaceHolderNotAllowed),
            semesterCategories: Array.from(semesterCategories),
            verticalAllowedSet: Array.from(verticalAllowedSet),
            placeholderAllowedSet: Array.from(placeholderAllowedSet)
        }
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e)
    }
}

function getCategoryNames(categoriesEnum, categoryArray) {
    try {
        let categoryDesc = [];
        categoryArray.map((cat) => {
            if (categoriesEnum.values[cat]) {
                categoryDesc.push(categoriesEnum.values[cat]);
            }
        })
        return categoryDesc;
    } catch (e) {
        throw e;
    }
}

/**
 * @description  Get course by object id.
 * @param {ObjectId} id  Object id of course.
 * @returns {Promise<Object>}  Promise resolving to an course.
 */
async function get(id, projection = {}) {
    try {
        if (projection && !Object.keys(projection).length) {
            projection = {
                _id: 0,
                code: 1,
                title: 1,
                type: 1,
                semester: 1,
                category: 1,
                prerequisites:
                {
                    $map: {
                        input: "$prerequisites",
                        as: "prereq",
                        in: {
                            value: "$$prereq.courseId",
                            label: "$$prereq.courseCode"
                        }
                    }
                },
                creditId: "$ltpc.id",
                evaluationId: "$evalPattern.id",
                isOneYear: 1,
                isVertical: 1,
                vertical: { $cond: { if: "$isVertical", then: "$vertical", else: "$$REMOVE" } },
                isPlaceholder: 1,
                partType: 1,
                offeringDeptName: "$offeringDept.name",
                offeringDeptCategory: "$offeringDept.category",
                reason: 1 || null,
                status: 1,
                regId: "$regulationId",
                prgmId: "$prgm.id"
            };
        }

        let result = await courses.get(id, projection);

        if (result && result.regId && result.prgmId) {
            let courseUsedAsPrerequisite = Boolean(await courses.count({ regulationId: result.regId, "prgm.id": result.prgmId, "prerequisites.courseId": id }));
            delete result["regId"];
            delete result["prgmId"];
            result["isUsedAsPrerequisite"] = courseUsedAsPrerequisite;
        }

        if (!result) {
            throw new Error("Failed to fetch courses data.");
        }
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function getOfferingDept(id) {
    try {
        let result = await courses.get(id, {
            _id: 0,
            offeringDeptName: "$offeringDept.name",
            offeringDeptCategory: "$offeringDept.category"
        });

        if (!result) {
            throw new Error("Failed to fetch offering department.");
        }
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function fetchDetailsForAdd(regId, prgmId) {
    try {
        let data = {};
        let regData = await regulations.get(regId, { _id: 0, creditIds: 1, evaluationIds: 1 });

        let { verticals, duration, freeze } = await programmeRegulations.getOne({ regulationId: regId, "prgm.id": prgmId }, {
            verticals: 1,
            duration: "$prgm.duration",
            freeze: 1
        });

        data.creditName = await credits.getBy({ _id: { $in: regData.creditIds } }, { _id: 1, name: 1 });
        data.evaluationName = await evaluationSchemes.getBy({ _id: { $in: regData.evaluationIds } }, { _id: 1, name: 1 });
        data.verticals = verticals;
        data.freezedSemesters = (freeze && freeze.length) ? freeze : [];

        data.totalSemester = parseInt(duration * semesterCount);
        data.partType = await attributes.getEnumByName("partType", "_id");
        data.type = await attributes.getEnumByName("type", "_id");
        data.category = await attributes.getEnumByName("category", "_id");

        return Promise.resolve(data);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function getPrerequisites(regId, prgmId, semester, id) {
    try {
        let query = {
            regulationId: regId,
            "prgm.id": prgmId,
            category: { $nin: Array.from(nonSemesterCategories).concat(Array.from(semesterCategories)) },
            isPlaceholder: { $ne: true }
        };

        if (semester != null) {
            query.semester = { $lt: semester };
        }

        if (id) {
            query["_id"] = { $ne: id };
        }

        const result = await courses.aggregate([
            {
                $match: query
            },
            {
                // Stage 1: Project the necessary fields and format semester label
                $project: {
                    code: 1,
                    semester: 1,
                    _id: 1,
                    semesterLabel: { $concat: ["Semester ", { $toString: "$semester" }] },
                },
            },
            {
                // Stage 2: Group by semesterLabel and accumulate options
                $group: {
                    _id: "$semesterLabel",
                    options: {
                        $addToSet: {
                            value: { $toString: "$_id" },
                            label: "$code",
                        },
                    },
                },
            },
            {
                // Stage 3: Sort by semester (optional)
                $sort: {
                    _id: 1, // Sorting by the semester label
                },
            },
            {
                // Stage 4: Project the final output format
                $project: {
                    label: "$_id",
                    options: "$options",
                    _id: 0, // Exclude the default _id field
                },
            },
        ]);

        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description  Get programme scheme template.
 * @param {ObjectId} regId  Object id of regulation.
 * @param {ObjectId} prgmId  Object id of programme.
 * @returns {Promise<Object>}  Promise resolving to an excel template.
 */
async function getTemplate(regulationId, programmeId) {
    try {

        let fileName = "Programme Scheme template" + uuid() + ".xlsx";

        let filePath = await excelTemplateService.schemeTemplate(regulationId, programmeId, fileName);

        if (!filePath) {
            throw new Error("Failed to get programme scheme template.");
        }
        return Promise.resolve(filePath);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description  Get mapping of the course.
 * @param {ObjectId} id  Object id of course.
 * @returns {Promise<Object>}  Promise resolving to the mapping  of the course.
 */
async function getMapping(id) {
    try {
        let { mapping, co, prgmId, regId } = await courses.get(id, { mapping: 1, co: 1, prgmId: "$prgm.id", regId: "$regulationId" });

        if (!mapping || !co) {
            throw new Error("The mapping or course outcome doesn't exist.");
        }

        let { po, pso } = await programmeRegulations.getOne({ regulationId: regId, "prgm.id": prgmId }, { po: 1, pso: 1 });
        if (!po || !pso) {
            throw new Error("The programme outcomes doesn't exists.");
        }
        let outcomes = Object.assign({}, po, pso);

        let mappings = Object.entries(mapping).map(([prgmIndex, courseOutcomes, average = 0]) => ({
            [prgmIndex]: outcomes[prgmIndex],
            courseOutcome: Object.entries(courseOutcomes).map(([courseIndex, level]) => {
                average += parseInt(level)
                return {
                    [courseIndex]: co[courseIndex],
                    level: level
                }
            }),
            average: (average / Object.keys(courseOutcomes).length).toFixed(1)

        }));

        //sorting based on outcomes
        let records = [];
        Object.keys(outcomes).map((key) => mappings.find((item) => {
            return Object.keys(item).includes(key) && records.push(item)
        }));

        return Promise.resolve(records);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - To fetch course outcomes for the given course id.
 * @param {ObjectId} courseId - Object id of course.
 * @returns {Promise<Array<String>>} - A Promise that resolves to an array of course outcomes.
 */
async function getOutcomes(courseId) {
    try {
        let result = await courses.getOne({ _id: courseId, status: Courses.status.CONFIRMED }, { name: "$title", code: 1, co: 1, status: "$mappingStatus", reason: "$mappingReason", _id: 0 });

        if (!result || !result.co) {
            throw new Error("Missing course outcomes.");
        }

        return Promise.resolve(result);
    } catch (e) {
        throw e;
    }
}

/**
 * @description - To fetch courses semester wise.
 * @returns {Promise<Array<String>>} - A Promise that resolves to an array of courses.
 */
async function getCoursesForMapping(programmeRegulationId, userRoles, userId) {
    try {
        let record = await programmeRegulations.get(programmeRegulationId, { regulationId: 1, "programmeId": "$prgm.id" });

        if (!record || !Object.keys(record).length) {
            throw new Error("The programme regulation record doesn't exist.");
        }

        let matchQuery = {
            regulationId: record.regulationId,
            "prgm.id": record.programmeId
        };

        let preQuery = { status: Courses.status.CONFIRMED, isPlaceholder: false };

        if (!userRoles.has(ROLES.A) && !userRoles.has(ROLES.SA1)) {
            preQuery.$or = [];
            if (userRoles.has(ROLES.SF) || userRoles.has(ROLES.SA2) || userRoles.has(ROLES.PU)) {
                preQuery.$or.push({ mappingStatus: Mapping.status.APPROVED });
            }

            if (userRoles.has(ROLES.FA)) {
                preQuery.$or = preQuery.$or.concat([
                    { mappingStatus: Mapping.status.APPROVED },
                    { coUploaders: { $in: [userId] } }
                ]);
            }

            if (userRoles.has(ROLES.OA)) {
                preQuery.$or.push({
                    mappingStatus: { $ne: Mapping.status.DRAFT }
                });
            }
        }

        let pipeline = courses.constructPipeline(matchQuery, preQuery);
        let [result] = await courses.aggregate(pipeline);

        result.assignFaculty = userRoles.has(ROLES.A) || Boolean(await users.count({ userId: userId, roles: ROLES.SA1, programmeIds: record.programmeId }));

        if (!result || !Object.keys(result).length) {
            throw new Error("Error while fetching semester wise courses.");
        }

        let courseCategoryEnum = await attributes.getEnumByName("category", "value");

        result.categoryWise.forEach((value) => {
            value._id = courseCategoryEnum.values[value._id];
        });
        result.semWise = result.semWise.concat(result.categoryWise);

        result.semWise = result.semWise.map((value) => {
            value.courses = value.courses.map((course) => {
                course.category = courseCategoryEnum.values[course.category];
                return course;
            });

            return value;
        });

        return Promise.resolve([result]);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Function to check whether all fields have been received or not in routes.
 * @param {Object} data All the data from the req.body.
 * @returns {Error} Throws error if any fields are missing.
 */
function validatePayload(data, mode) {
    try {
        let courseId = data.id || null;
        let regulationId = data.regulationId;
        let prgmId = data.prgmId;
        let code = getFormattedStr(data.code);
        let title = getFormattedStr(data.title);
        let semester = data.semester;
        let category = data.category;
        let type = data.type;
        let evaluationId = data.evaluationId;
        let creditId = data.creditId;
        let prerequisites = data.prerequisites && data.prerequisites.length ? data.prerequisites.map(prereq => ObjectId(prereq)) : [];
        let partType = data.partType;
        let isVertical = data.isVertical || false;
        let vertical = isVertical && data.vertical ? data.vertical : null;
        let isPlaceholder = data.isPlaceholder || false;
        let isOneYear = data.isOneYear || false;
        let deptName = data.deptName || null;
        let deptCategory = data.deptCategory || null;

        if (!regulationId || !prgmId || !code || !title || !category) {
            throw new Error("Mandatory fields are missing.");
        }

        if (semester && !Number.isFinite(semester)) {
            throw new Error("Semester should be a finite number.");
        }

        if (isVertical && !vertical) {
            throw new Error("Vertical is checked but vertical details are missing.");
        }

        if (semesterCategories.has(category) && semester == null && !(deptName && deptCategory)) {
            throw new Error("Offering department is missing.");
        } else if (!semesterCategories.has(category) && semester != null && !(deptName && deptCategory)) {
            throw new Error("Offering department is missing.");
        } else if (semesterCategories.has(category) && semester != null) {
            if (deptName && deptCategory) {
                throw new Error("Offering department can't be given for placeholder course.");
            } else if (type || evaluationId || creditId || (prerequisites && prerequisites.length) || partType) {
                throw new Error(`Course type, evaluation scheme, prerequisites, and part type cannot be specified for the following categories: '${Array.from(semesterCategories)}'.`);
            }
        }

        if (mode == "EDIT" && !courseId) {
            throw new Error("Requested id missing.");
        }

        return {
            id: courseId && ObjectId(courseId),
            regulationId: ObjectId(regulationId),
            prgmId: ObjectId(prgmId),
            semester: semester ? parseInt(semester) : null,
            code: code,
            title: title,
            type: type,
            category: category,
            evaluationId: evaluationId && ObjectId(evaluationId),
            creditId: creditId && ObjectId(creditId),
            prerequisites: prerequisites,
            partType: partType,
            isVertical: isVertical,
            vertical: vertical,
            isPlaceholder: isPlaceholder,
            isOneYear: isOneYear,
            deptName: deptName,
            deptCategory: deptCategory
        };
    } catch (e) {
        throw e;
    }
}

/**
 * @description  Determines the actions items that can be performed on a course based on its status and user roles.
 * @param {Array<String>} userRoles  Array of user roles.
 * @returns {Promise<Array<String>>} A Promise that resolves to an array of action items.
 */
async function bulkActionItems(prgmId, selectedItems, { username, userRoles }) {
    try {
        let courseStatus = await courses.distinct("status", { _id: { $in: selectedItems } });

        if (!courseStatus || !courseStatus.length) {
            throw new Error("Received invalid course id(s).");
        }

        const isAllCourseStatusSame = (courseStatus.length == 1) ? true : false;

        let prgmIds = await getUserProgramIds(username);

        let actions = [];

        let isSchemeFaculty = (userRoles.has(ROLES.A) || (userRoles.has(ROLES.SF) && prgmIds.includes(prgmId)));
        let isSchemeApprover = (userRoles.has(ROLES.A) || (userRoles.has(ROLES.SA1) && prgmIds.includes(prgmId)));
        let isSchemeConfirmer = (userRoles.has(ROLES.A) || userRoles.has(ROLES.SA2));

        if (isAllCourseStatusSame) {
            const status = courseStatus[0];
            if ([Courses.status.DRAFT, Courses.status.REQUESTED_CHANGES].includes(status) && isSchemeFaculty) {
                actions.push(Action_Items.action.SEND_FOR_APPROVAL, Action_Items.action.OFFERING_DEPARTMENT);
            }

            if ([Courses.status.WAITING_FOR_APPROVAL].includes(status) && isSchemeFaculty) {
                actions.push(Action_Items.action.OFFERING_DEPARTMENT);
            }

            if (status == Courses.status.WAITING_FOR_APPROVAL && isSchemeApprover) {
                actions = actions.concat([Action_Items.action.APPROVE, Action_Items.action.REQUEST_CHANGES]);
            }

            if (status == Courses.status.APPROVED && isSchemeConfirmer) {
                actions = actions.concat([Action_Items.action.CONFIRMED, Action_Items.action.REQUEST_CHANGES], userRoles.has(ROLES.A) ? [Action_Items.action.OFFERING_DEPARTMENT] : []);
            }

            if (status == Courses.status.CONFIRMED && userRoles.has(ROLES.A)) {
                actions = actions.concat([Action_Items.action.OFFERING_DEPARTMENT]);
            }
        }

        return Promise.resolve(actions);

    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description  Determines the actions items that can be performed on a course based on its status and user roles.
 * @param {ObjectId} id  The object id of the course.
 * @param {Array<String>} userRoles  Array of user roles.
 * @returns {Promise<Array<String>>} A Promise that resolves to an array of action items.
 */
async function actionItems(id, { username, userRoles }) {
    try {
        let record = await courses.getOne({ _id: id });

        if (!record) {
            throw new Error("Course not found.");
        }

        let prgmIds = await getUserProgramIds(username);

        let isAdmin = userRoles.has(ROLES.A);
        let isSchemeFaculty = userRoles.has(ROLES.SF) && prgmIds.includes(record.prgm.id.toString());
        let isSchemeApprover = userRoles.has(ROLES.SA1) && prgmIds.includes(record.prgm.id.toString());

        let courseUsedAsPrerequisite = Boolean(await courses.count({ regulationId: record.regulationId, "prgm.id": record.prgm.id, "prerequisites.courseId": id }));

        let actions = [Action_Items.action.VIEW];

        if (record.attachment && Object.keys(record.attachment).length) {
            actions.push(Action_Items.action.VIEW_SYLLABUS);
        }

        if ([Courses.status.DRAFT, Courses.status.WAITING_FOR_APPROVAL, Courses.status.REQUESTED_CHANGES].includes(record.status) &&
            (isSchemeFaculty || isAdmin) && (!semesterCategories.has(record.category) || record.semester == null)) {
            actions.push(Action_Items.action.UPLOAD_SYLLABUS);
        }

        if (record.status == Courses.status.DRAFT && (isSchemeFaculty || isAdmin)) {
            actions = actions.concat([Action_Items.action.EDIT, Action_Items.action.SEND_FOR_APPROVAL]);
        }

        if (record.status == Courses.status.DRAFT && !courseUsedAsPrerequisite && (isSchemeFaculty || isAdmin)) {
            actions.push(Action_Items.action.DELETE);
        }

        if (record.status == Courses.status.WAITING_FOR_APPROVAL && (isSchemeFaculty || isAdmin)) {
            actions.push(Action_Items.action.EDIT);
        }

        if (record.status == Courses.status.REQUESTED_CHANGES && (isSchemeFaculty || isAdmin)) {
            actions = actions.concat([Action_Items.action.SEND_FOR_APPROVAL, Action_Items.action.EDIT]);
        }

        if (record.status == Courses.status.WAITING_FOR_APPROVAL && (isSchemeApprover || isAdmin)) {
            actions = actions.concat([Action_Items.action.APPROVE, Action_Items.action.REQUEST_CHANGES]);
        }

        if (record.status == Courses.status.APPROVED && (isAdmin || userRoles.has(ROLES.SA2))) {
            actions = actions.concat([Action_Items.action.CONFIRMED, Action_Items.action.REQUEST_CHANGES]
                // ,isAdmin ? [Action_Items.action.EDIT] : []
            );
        }

        // if (record.status == Courses.status.CONFIRMED && isAdmin) {
        //     actions = actions.concat([Action_Items.action.EDIT]);
        // }

        return Promise.resolve(actions);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Determines the actions items that can be performed on a programme outcomes based on its status and user roles.
 * @param {ObjectId} id - The object id of the regulation.
 * @param {Array<String>} userRoles - Array of user roles.
 * @returns {Promise<Array<String>>} A Promise that resolves to an array of action items.
 */
async function coActionItems(id, userName, userRoles = []) {
    try {

        let actions = [];

        let record = await courses.getOne(id, { mappingStatus: 1, coUploaders: 1 });
        if (!record) {
            throw new Error("Course record not found.");
        }

        let coUploaders = record.coUploaders || [];
        let access = coUploaders.includes(userName.trim().toUpperCase());

        if (record.mappingStatus == Mapping.status.DRAFT && ((userRoles.has(ROLES.FA) && access) || userRoles.has(ROLES.A))) {
            actions.push(Action_Items.action.EDIT, Action_Items.action.SEND_FOR_APPROVAL);
        }

        if (record.mappingStatus == Mapping.status.WAITING_FOR_APPROVAL && ((userRoles.has(ROLES.FA) && access) || userRoles.has(ROLES.A))) {
            actions.push(Action_Items.action.EDIT);
        }

        if (record.mappingStatus == Mapping.status.REQUESTED_CHANGES && ((userRoles.has(ROLES.FA) && access) || userRoles.has(ROLES.A))) {
            actions.push(Action_Items.action.SEND_FOR_APPROVAL, Action_Items.action.EDIT);
        }

        if (record.mappingStatus == Mapping.status.WAITING_FOR_APPROVAL && (userRoles.has(ROLES.OA) || userRoles.has(ROLES.A))) {
            actions = [...actions, Action_Items.action.APPROVE, Action_Items.action.REQUEST_CHANGES];
        }

        return Promise.resolve(actions);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description Logs an action performed on a specific course under a regulation and programme.
 * @param {ObjectId} regId - The ID of the regulation.
 * @param {ObjectId} prgmId - The ID of the programme.
 * @param {String} action - The action performed.
 * @param {String} code - The code associated with the action.
 * @param {String} user - The user who performed the action.
 * @param {String} phrase - A phrase describing the action.
 */
async function log(regId, prgmId, action, code, user, phrase) {
    try {
        let regRecord = await regulations.get(regId, { year: 1, version: 1, title: 1 });

        let prgmRecord = await programmeRegulations.getOne({ regulationId: regId, "prgm.id": prgmId }, {
            programme: "$prgm.name",
            type: "$prgm.type",
            mode: "$prgm.mode",
            category: "$prgm.category"
        });

        let msg = `${phrase} '${code}' under the regulation - '${regRecord.title}-${regRecord.year}-${regRecord.version}
            ' and programme - '${prgmRecord.programme}-${prgmRecord.category}-${prgmRecord.type}-${prgmRecord.mode}.`;

        await regulationLog("courses", action, user, msg);

    } catch (e) {
    }
}

/**
 * @description - Changes the status of a course.
 * @param {ObjectId} id - The object id of the course.
 * @param {String} destination - The destination status of the course.
 * @param {Array<String>} roles - Array of user roles.
 * @param {String} reason - Reason for changing the status to requested changes.
 * @returns {Promise<String>} A Promise that resolves to a status change message.
 */
async function changeStatus(items, regulationId, prgmId, destination, roles, userName, userId, reason) {
    try {
        let regPrgmId = regulationId.toString().concat(prgmId.toString());
        let result = await courses.mutex(regPrgmId).runExclusive(async () => {
            try {
                let errorCodes = [];

                let regRecord = await regulations.get(regulationId, { _id: 0, title: 1, year: 1, version: 1 });

                let prgmRecord = await programmeRegulations.getOne({ regulationId: regulationId, "prgm.id": prgmId }, {
                    prgmId: "$prgm.id",
                    programme: "$prgm.name",
                    type: "$prgm.type",
                    mode: "$prgm.mode",
                    category: "$prgm.category"
                });

                let filterQuery = courses.bulkSelectQuery(items);

                let records = await courses.getBy(filterQuery);

                if (!records || !records.length) {
                    throw new Error("Error while fetching courses for updating the status.");
                }

                records.forEach((record) => {
                    if (!stateTransition.isTransitionAllowed(stateTransition.course, record.status, destination, roles)) {
                        errorCodes.push(record.code);
                    }
                });

                if (errorCodes && errorCodes.length) {
                    throw new Error(`Invalid state transition detected for the course code(s) ${errorCodes}.`);
                }

                let courseIds = records.map(courseId => courseId._id);

                let courseCodes = records.map(course => course.code);

                const session = client.startSession();

                try {
                    const transactionOptions = {
                        readPreference: "primary",
                        readConcern: { level: "local" },
                        writeConcern: { w: "majority" },
                        maxCommitTimeMS: 1000,
                    };

                    await session.withTransaction(async () => {

                        let details = { status: destination };

                        if (destination == Courses.status.REQUESTED_CHANGES) {
                            details["reason"] = reason;
                        }

                        let result = await courses.updateMany({ _id: { $in: courseIds } }, "SET", details, { session });

                        if (!result || !result.modifiedCount) {
                            throw new Error("Failed to change the status of the selected courses.");
                        }

                    }, transactionOptions);

                } catch (e) {
                    return Promise.reject(e);
                } finally {
                    await session.endSession();
                }

                let msg = "The status for the courses '" + courseCodes + "' has been changed to '"
                    + Courses.status.descriptions[destination] + "', under the regulation - '"
                    + regRecord.title + "-" + regRecord.year + "-"
                    + regRecord.version + "' and programme - '" + prgmRecord.programme + "-"
                    + prgmRecord.category + "-"
                    + prgmRecord.type + "-" + prgmRecord.mode + "'.";


                await regulationLog("courses", "state change", userName, msg);

                let jobId = await jobs.createJob(Jobs.names.Course_ChangeStatus);

                sendMail.coursesMailService(records[0].status, destination, regRecord, prgmRecord, msg, jobId, userName, userId, reason);

                return Promise.resolve(`The status for the courses '${courseCodes}' has been changed to
                '${Courses.status.descriptions[destination]}'.`);

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
 * @description - Changes the status of a course.
 * @param {ObjectId} id - The object id of the course.
 * @param {String} destination - The destination status of the course.
 * @param {Array<String>} roles - Array of user roles.
 * @param {String} reason - Reason for changing the status to requested changes.
 * @returns {Promise<String>} A Promise that resolves to a status change message.
 */
async function changeMappingStatus(id, destination, roles, userName, reason) {
    try {
        let courseRec = await courses.get(id, { regulationId: 1, "prgm.id": 1, code: 1, mapping: 1, mappingStatus: 1, coUploaders: 1 });

        if (!courseRec) {
            throw new Error("Error while fetching the course for updating the mapping status.");
        }

        if (!courseRec.mapping) {
            throw new Error("The mapping doesn't exist.");
        }

        let regPrgmId = courseRec.regulationId.toString().concat(courseRec.prgm.id.toString());

        let result = await courses.mutex(regPrgmId).runExclusive(async () => {
            try {
                let prgmRegRec = await programmeRegulations.getOne({ regulationId: courseRec.regulationId, "prgm.id": courseRec.prgm.id }, {
                    prgmId: "$prgm.id", programme: "$prgm.name", type: "$prgm.type", mode: "$prgm.mode", category: "$prgm.category", _id: 0
                });

                let regRec = await regulations.get(courseRec.regulationId, { title: 1, year: 1, version: 1, _id: 0 });

                if (!stateTransition.isTransitionAllowed(stateTransition.courseOutcome, courseRec.mappingStatus, destination, roles)) {
                    throw new Error(`Illegal state transition detected.`);
                }

                let details = { mappingStatus: destination };

                if (destination == Mapping.status.REQUESTED_CHANGES) {
                    details["mappingReason"] = reason;
                }

                let result = await courses.update(id, "SET", details);

                if (!result || !result.modifiedCount) {
                    throw new Error("No modification found.");
                }

                let msg = "The mapping status for the course '" + courseRec.code + "' has been changed to '"
                    + Mapping.status.descriptions[destination] + "', under the regulation - '"
                    + regRec.title + "-" + regRec.year + "-" + regRec.version + "' and programme - '"
                    + prgmRegRec.programme + "-" + prgmRegRec.category + "-" + prgmRegRec.type + "-" + prgmRegRec.mode + "'.";


                await regulationLog("courses", "state change", userName, msg);

                let jobId = await jobs.createJob(Jobs.names.CO_PO_Mapping_ChangeStatus);

                sendMail.coPoMappingMailService(destination, regRec, prgmRegRec, msg, jobId, userName, reason, courseRec?.coUploaders);

                return Promise.resolve(`The mapping status for the course '${courseRec.code}'
                has been changed to '${Mapping.status.descriptions[destination]}.`);

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
 * @description Exports courses to an Excel file.
 * @param {ObjectId} regulationId - The object id of the regulation.
 * @param {ObjectId} prgmId - The object id of the programme.
 * @returns {Promise<String>} A Promise that resolves to the file path of the exported Excel file.
 */
async function exportToExcel(regulationId, prgmId, userName) {
    try {
        let pipeline = courses.exportQuery(regulationId, prgmId);
        let programmeSchemes = await courses.aggregate(pipeline);
        let courseTypeEnum = await attributes.getEnumByName("type", "value");
        let courseCategoryEnum = await attributes.getEnumByName("category", "value");
        let partTypeEnum = await attributes.getEnumByName("partType", "value");

        programmeSchemes = programmeSchemes.map((course) => {
            return {
                ...course,
                "Course Type": courseTypeEnum.values[course["Course Type"]] || null,
                "Course Category": courseCategoryEnum.values[course["Course Category"]],
                "Part Type": partTypeEnum.values[course["Part Type"]],
                "Prerequisites": (course.Prerequisites && course.Prerequisites.length) ? course.Prerequisites.join(",") : null
            }
        });

        if (!programmeSchemes || !programmeSchemes.length) {
            throw new Error("No data found to export.");
        }

        let fileName = "Programme Scheme" + uuid() + ".xlsx";
        let filePath = await fileService.writeExcel(programmeSchemes, fileName, "Courses");

        return Promise.resolve(filePath);
    } catch (error) {
        return Promise.reject(error);
    }
}

/**
 * @description Validates whether a course code is unique within a set of schemes, considering category and semester.
 * @param {Array<Object>} schemes - An array of course schemes containing information about courses.
 * @param {String} code - The course code to be validated.
 * @param {String} category - The category of the course (PE: Professional Elective, OE: Open Elective, or others).
 * @param {number|null} semester - The semester in which the course is offered. Pass null for non-semester courses.
 * @returns {Boolean} A boolean indicating whether the course code is unique within the specified constraints.
 */
function courseCodeValidation(schemes, code, category, semester, isOneYear) {
    try {
        let count = 0;
        if (semesterCategories.has(category)) {
            if (!Boolean(semester)) {
                schemes.find((course) => {
                    if (course.code == code) {
                        count++;
                    }
                });
            }
        } else {
            schemes.find((course) => {
                if (course.code == code) {
                    if (isOneYear && !course.isOneYear) {
                        count++;
                    }
                    else {
                        if (!isOneYear || course.semester == semester) {
                            count++;
                        }
                    }
                }
            });
        }
        return count < 2; //schemes consist of existing and imported schemes. if no duplicates exists count will be 1
    } catch (e) {
        throw e;
    }
}

/**
 * @description Validate lecture hours, tutorial hours, practical hours, and credits.
 * @param {Array<Object>} creditPatterns - An array of credit patterns.
 * @param {Number} lectureHrs - The number of lecture hours.
 * @param {Number} tutorialHrs - The number of tutorial hours.
 * @param {Number} practicalHrs - The number of practical hours.
 * @param {Number} credit - The number of credits.
 * @returns {Object|Boolean} If a matching credit pattern is found, returns the _id of the pattern; otherwise, returns false.
 */
function creditValidation(creditPatterns, lectureHrs, tutorialHrs, practicalHrs, credit) {
    try {

        if (Number.isFinite(lectureHrs) && Number.isFinite(tutorialHrs) && Number.isFinite(practicalHrs) && Number.isFinite(credit)) {

            const creditPattern = creditPatterns.find(
                (creditRec) =>
                    creditRec.hoursPerWeek.lecture == lectureHrs &&
                    creditRec.hoursPerWeek.tutorial == tutorialHrs &&
                    creditRec.hoursPerWeek.practical == practicalHrs &&
                    creditRec.credits == credit
            );

            if (creditPattern) {
                return {
                    id: creditPattern._id,
                    name: creditPattern.name,
                    hoursPerWeek: {
                        lecture: lectureHrs,
                        tutorial: tutorialHrs,
                        practical: practicalHrs
                    },
                    credits: credit
                };
            }
        }

        return false;
    } catch (e) {
        throw e;
    }
}

/**
 * @description Validates whether a department exists based on its name and category.
 * @param {Array<Object>} department - An array of department records containing information about departments.
 * @param {String} departmentName - The name of the department.
 * @param {String} departmentCategory - The category of the department.
 * @returns {Object|boolean} If a matching department is found, returns an object containing the department's _id, name, and category; otherwise, returns false.
 */
function departmentValidation(departmentsArr, departmentName, departmentCategory) {
    try {
        const department = departmentsArr.find(
            (dept) =>
                dept.name == departmentName &&
                dept.category == departmentCategory
        );

        if (department) {
            return { id: department._id, name: department.name, category: department.category };
        }

        return false;
    } catch (e) {
        throw e;
    }
}

/**
 * @description Validates whether an evaluation scheme exists based on its name.
 * @param {Array<Object>} evaluationPatterns - An array of evaluation patterns containing information about evaluation methods.
 * @param {String} evaluationName - The name of the evaluation scheme.
 * @param {String} courseType - The course type.
 * @returns {Object|boolean} If a matching evaluation scheme is found, returns the pattern object; otherwise, returns false.
 */
function evaluationValidation(evaluationPatterns, evaluationName, courseType) {
    try {

        if (evaluationName) {
            const evaluationPattern = evaluationPatterns.find(
                (pattern) =>
                    pattern.name == evaluationName &&
                    pattern.courseType == courseType
            );

            if (evaluationPattern) {
                return {
                    id: evaluationPattern._id,
                    name: evaluationPattern.name,
                    markSplitUp: {
                        CA: evaluationPattern.markSplitUp.CA.scaled,
                        FE: evaluationPattern.markSplitUp.FE.scaled,
                        total: evaluationPattern.markSplitUp.total
                    }
                };

            }

        }
        return false;
    } catch (e) {
        throw e;
    }
}

/**
 * @description Validates whether prerequisites exist for a given course code.
 * @param {Array<Object>} courseCodes - An array of course codes.
 * @param {Object} courseCode - The course code object to validate.
 * @returns {Boolean} True if prerequisites exist for the given course code, otherwise false.
 */
function prerequisitesValidation(courseCodes, courseCode) {
    try {
        for (let i = 0; i < courseCodes.length; i++) {
            let course = {};
            course.courseId = courseCodes[i]._id ? courseCodes[i]._id : "";
            course.courseCode = courseCodes[i].code;
            if (!courseCodes[i].isPlaceholder && !semesterCategories.has(courseCodes[i].category) && !nonSemesterCategories.has(courseCodes[i].category)) {
                if (courseCodes[i].code == courseCode.code && courseCode.semester == null) {
                    return { isError: false, course };
                }
                if (courseCodes[i].code == courseCode.code && courseCode.semester != null && courseCodes[i].semester < courseCode.semester) {
                    return { isError: false, course };
                }
            }
        }

        return { isError: true };
    } catch (e) {
        throw e;
    }

}

/**
 * @description Validate regulation and programme ID.
 * @param {ObjectId} regulationId - The object id of the regulation.
 * @param {ObjectId} prgmId - The object id of the programme.
 * @returns {Promise<void>} A Promise that resolves if the IDs are valid.
 */
async function idExistValidation(regulationId, prgmId) {
    try {
        let regulationRecord = await regulations.get(regulationId, { status: 1, _id: 0 });

        if (!regulationRecord) {
            throw new Error("Regulation record not found.");
        }

        if (regulationRecord.status !== Regulations.status.APPROVED) {
            throw new Error("The courses can't be added, since the regulation is not yet approved.");
        }

        let programmeRegulationExist = Boolean(await programmeRegulations.count({ "regulationId": regulationId, "prgm.id": prgmId }));

        if (!programmeRegulationExist) {
            throw new Error("This programme is not comes under this regulation.");
        }
    } catch (e) {
        throw e;
    }
}

//middleware
async function validateUser(req, res, next) {
    try {
        let { username, userRoles } = req.headers.userDetails;
        let programmeId = req.body.prgmId || "";

        if (userRoles.has(ROLES.A) || userRoles.has(ROLES.SA2)) {
            return next();
        }

        let isExist = programmeId && Boolean(await programmeRegulations.count({ "prgm.id": ObjectId(programmeId) }));
        if (!isExist) {
            return res.status(403).json({ message: "Invalid programme id." });
        }

        let userData = await users.getOne({ userId: username });
        if (!userData || !Object.keys(userData).length) {
            return res.status(403).json({ message: "Failed to fetch user data." });
        }

        if (!userData.programmeIds || !userData.programmeIds.length) {
            return res.status(403).json({ message: "User not having access to this programme." });
        }

        userData.programmeIds = userData.programmeIds.map((id) => id.toString());
        if (!userData.programmeIds.includes(programmeId.toString())) {
            return res.status(403).json({ message: 'User not having access to this programme.' });
        }

        next()
    } catch (e) {
        throw e;
    }
}

/**
 * @description Validates course codes against scheme.
 * @param {Array} schemes - Array of courses.
 * @param {ObjectId} regulationId - Object id of regulation.
 * @param {ObjectId} programmeId - Object id of programme.
 * @returns {Promise<Array<Object>>} List of courses.
 */
async function validateCourses(schemes, regulationId, programmeId, fileName, excel) {
    try {
        let isError = false;
        let courseTypeEnum = await attributes.getEnumByName("type", "value");
        let courseCategoryEnum = await attributes.getEnumByName("category", "value");
        let partTypeEnum = await attributes.getEnumByName("partType", "value");
        let regulation = await regulations.get(regulationId, { creditIds: 1, evaluationIds: 1, _id: 0 });
        let creditPatterns = await credits.getBy({ _id: { $in: regulation.creditIds } }, { name: 1, _id: 1, hoursPerWeek: 1, credits: 1 });
        let evaluationPatterns = await evaluationSchemes.getBy({ _id: { $in: regulation.evaluationIds } }, { name: 1, markSplitUp: 1, courseType: 1 });

        let { duration, verticals, prgm, freeze } = await programmeRegulations.getOne(
            {
                "regulationId": regulationId,
                "prgm.id": programmeId
            },
            {
                duration: "$prgm.duration",
                verticals: 1,
                prgm: 1,
                freeze: 1
            }
        );

        verticals = verticals || [];

        let departmentsArr = await departments.getBy({ status: "A" }, { _id: 1, name: 1, category: 1 });

        let courseCodes = await courses.getBy({ regulationId: regulationId, "prgm.id": programmeId }, {
            "_id": 1,
            "semester": 1,
            "code": 1,
            "isPlaceholder": 1,
            "isOneYear": 1,
            "category": 1
        });

        schemes.map((course) => {
            courseCodes.push({ semester: course.semester, code: course.courseCode, isPlaceholder: course.isPlaceholder, category: courseCategoryEnum[course.courseCategory], isOneYear: course.isOneYear });
        });

        let result = [];


        for (let i = 0; i < schemes.length; i++) {

            let isPlaceholderCourse = Boolean(semesterCategories.has(courseCategoryEnum[schemes[i].courseCategory]) && schemes[i].semester);

            let obj = {
                "_id": new ObjectId(),
                "regulationId": regulationId,
                "prgm": { id: prgm.id, name: prgm.name, category: prgm.category },
                "semester": schemes[i].semester || null,
                "code": schemes[i].courseCode,
                "title": schemes[i].courseTitle,
                "type": schemes[i].courseType ? courseTypeEnum[schemes[i].courseType] : null,
                "category": courseCategoryEnum[schemes[i].courseCategory],
                "status": Courses.status.DRAFT,
                "mappingStatus": Mapping.status.DRAFT,
                "prerequisites": schemes[i].prerequisites ? schemes[i].prerequisites : [],
                "partType": schemes[i].partType ? partTypeEnum[schemes[i].partType] : "",
                "isVertical": schemes[i].isVertical,
                "vertical": schemes[i].vertical ? schemes[i].vertical : null,
                "isPlaceholder": schemes[i].isPlaceholder,
                "isOneYear": schemes[i].isOneYear,
                "co": {},
                "mapping": {}
            }

            let lectureHour = schemes[i].hoursPerWeek.lecture;
            let tutorialHour = schemes[i].hoursPerWeek.tutorial;
            let practicalHour = schemes[i].hoursPerWeek.practical;
            let credit = schemes[i].credits;

            let evaluationName = schemes[i].evaluationPattern;

            let departmentName = schemes[i].departmentName;
            let departmentCategory = schemes[i].departmentCategory;

            excel[i].Errors = [];

            const courseCodeRegEx = /^[a-zA-Z0-9_]+$/;

            if (obj.code && !courseCodeRegEx.test(obj.code)) {
                excel[i].Errors.push("The course code must contain only letters, numbers, and underscores.");
            }

            if (obj.isVertical && obj.isPlaceholder) {
                excel[i].Errors.push("Only one of 'Is Vertical' or 'Is Placeholder' can be set to 'YES', not both.");
            } else {
                if (obj.semester == null) {
                    if (!nonSemesterCategories.has(obj.category) && !semesterCategories.has(obj.category)) {
                        excel[i].Errors.push(`The semester cannot be null for categorie(s) other than '${getCategoryNames(courseCategoryEnum, Array.from(nonSemesterCategories).concat(Array.from(semesterCategories)))}'.`);
                    } else {
                        if (verticalPlaceHolderNotAllowed.has(obj.category) && (obj.isPlaceholder || obj.isVertical)) {
                            excel[i].Errors.push(`Course comes under '${getCategoryNames(courseCategoryEnum, Array.from(verticalPlaceHolderNotAllowed))}' categorie(s) without a semester must have 'Is Placeholder' and 'Is Vertical' set to 'NO'.`);
                        } else if ((nonSemesterCategories.has(obj.category) || semesterCategories.has(obj.category)) && obj.isOneYear) {
                            excel[i].Errors.push(`The 'Is one year course' cannot be 'YES' for categorie(s) ${getCategoryNames(courseCategoryEnum, Array.from(placeholderAllowedSet))}.`);
                        } else if (obj.isPlaceholder) {
                            excel[i].Errors.push(`Course without a semester must have 'Is Placeholder' set to 'NO'.`);
                        } else if (!verticalAllowedSet.has(obj.category) && obj.isVertical) {
                            excel[i].Errors.push(`The vertical is only applicable for ${getCategoryNames(courseCategoryEnum, Array.from(verticalAllowedSet))}.`);
                        }
                    }
                } else {
                    if (nonSemesterCategories.has(obj.category)) {
                        excel[i].Errors.push(`Semester should not be given for categories ${getCategoryNames(courseCategoryEnum, Array.from(nonSemesterCategories))}.`);
                    } else {
                        if (placeholderAllowedSet.has(obj.category) && obj.isPlaceholder == false) {
                            excel[i].Errors.push(`The 'Is Placeholder' must be set to 'YES' for a course in any semester under the categorie(s) ${getCategoryNames(courseCategoryEnum, Array.from(placeholderAllowedSet))}.`);
                        } else if (placeholderAllowedSet.has(obj.category) && obj.isVertical) {
                            excel[i].Errors.push(`Vertical cannot be given for placeholder course.`);
                        } else if (!semesterCategories.has(obj.category) && (obj.isPlaceholder || obj.isVertical)) {
                            excel[i].Errors.push(`'Is Placeholder' and 'Is Vertical' must be set to 'NO' for categorie(s) other than ${getCategoryNames(courseCategoryEnum, Array.from(semesterCategories))}.`);
                        }
                    }
                }
            }


            //vertical validation
            if (obj.isVertical) {
                if (!obj.vertical) {
                    excel[i].Errors.push(`Missing vertical name.`);
                }
                if (obj.vertical && !verticals.includes(getFormattedStr(obj.vertical))) {
                    excel[i].Errors.push(`The vertical name '${obj.vertical}' is not specified under this programme.`);
                }
            }

            //part type validation
            if (obj.partType == undefined) {
                excel[i].Errors.push(`Part type not present in the attributes.`);
            }

            if (obj.partType == '') {
                obj.partType = null;
            }

            if (obj.semester) {
                let isSemesterValid = validateSemester(obj.semester, duration);
                if (freeze && freeze.length && freeze.includes(obj.semester)) {
                    excel[i].Errors.push(`Course can't be created under semester '${obj.semester}', since it is freezed.`);
                } else if (!isSemesterValid) {
                    excel[i].Errors.push(`Semester must be less than or equal to ${duration * semesterCount}.`);
                }
            }

            //course code unique validation
            let validationResult = courseCodeValidation(courseCodes, obj.code, obj.category, obj.semester, obj.isOneYear);
            if (!validationResult) {
                excel[i].Errors.push(`Course code already exists.`);
            }

            //course prerequisites course codes validation
            let errorCodes = [];

            if (obj.prerequisites && obj.prerequisites.length) {
                if (obj.semester == 1) {
                    excel[i].Errors.push("Prerequisites can't be given in the first semester.");
                } else if (placeholderAllowedSet.has(obj.category) && obj.isPlaceholder) {
                    excel[i].Errors.push("For placeholder course, prerequisites can't be assigned.");
                } else {
                    for (let code = 0; code < obj.prerequisites.length; code++) {
                        let result = prerequisitesValidation(courseCodes, { code: obj.prerequisites[code], semester: obj.semester });
                        if (result.isError) {
                            errorCodes.push(obj.prerequisites[code]);
                        } else {
                            obj.prerequisites[code] = result.course;
                        }
                    }
                    if (errorCodes.length) {
                        excel[i].Errors.push(`Invalid prerequisite course codes ${errorCodes}.`);
                    }
                }
            }

            if (isPlaceholderCourse) {
                obj.offeringDept = {
                    id: null,
                    name: null,
                    category: null
                };

                obj.ltpc = {
                    id: null,
                    name: null,
                    hoursPerWeek: {
                        lecture: null,
                        tutorial: null,
                        practical: null
                    },
                    credits: null
                };

                obj.evalPattern = {
                    id: null,
                    name: null,
                    markSplitUp: {
                        CA: null,
                        FE: null,
                        total: null
                    }
                }
            } else {
                if (!departmentName || !departmentCategory) {
                    excel[i].Errors.push("Offering department name or Offering department category is missing.");
                } else {
                    let offeringDept = departmentValidation(departmentsArr, departmentName, departmentCategory);
                    if (typeof offeringDept !== 'object' && !offeringDept) {
                        excel[i].Errors.push(`Invalid department.`);
                    } else {
                        obj.offeringDept = offeringDept;
                    }
                }

                if (!Number.isFinite(lectureHour) || !Number.isFinite(tutorialHour) || !Number.isFinite(practicalHour) || !Number.isFinite(credit)) {
                    excel[i].Errors.push("Credit pattern is missing.");
                } else {
                    let creditData = creditValidation(creditPatterns, lectureHour, tutorialHour, practicalHour, credit);
                    if (typeof creditData !== 'object' && !creditData) {
                        excel[i].Errors.push(`Invalid credit.`);
                    } else {
                        obj.ltpc = creditData;
                    }
                }

                if (!evaluationName) {
                    excel[i].Errors.push("Evaluation scheme is missing.");
                } else {
                    let evaluationPattern = evaluationValidation(evaluationPatterns, evaluationName, obj.type);
                    if (typeof evaluationPattern !== 'object' && !evaluationPattern) {
                        excel[i].Errors.push(`Evaluation scheme not comes under this regulation or evaluation scheme not matched with given course type.`);
                    } else {
                        obj.evalPattern = evaluationPattern;
                    }
                }
            }

            //change error flag
            if (excel[i].Errors.length) {
                excel[i].Errors = excel[i].Errors.join();
                isError = true;
            }

            result.push(obj);
        }

        if (isError) {
            const workBook = xlsx.utils.book_new();
            let workSheet = xlsx.utils.json_to_sheet(excel);
            xlsx.utils.book_append_sheet(workBook, workSheet, "Courses");
            let filePath = await fileService.getPath(__dirname, config.paths.downloadDir, fileName);
            xlsx.writeFile(workBook, filePath);
            let e = new Error("Unable to import from Excel !. We found some error in attached files.");
            e.name = "file error";
            e.filePath = filePath;
            return Promise.reject(e);
        }
        return Promise.resolve(result);
    } catch (e) {
        throw e;
    }
}

/**
 * @description Creates multiple courses in the databases.
 * @param {Array<Object>} formattedCourses - Array of formatted course objects.
 * @param {String} regulationId - Object id of regulation.
 * @param {String} prgmId - Object id of programme.
 * @param {Array<String>} [userRoles=[]] - Array of user roles.
 * @returns {Promise<String>} A Promise that resolves to a success message.
 */
async function createCourses(formattedCourses, regulationId, prgmId, userName) {
    try {
        let courseMap = new Map();

        formattedCourses.map((course) => {
            if (!courseMap.has(course.code)) {
                courseMap.set(course.code, course._id)
            }
        });

        formattedCourses.map((course) => course.prerequisites.map((prerequisitesCourse) => {
            if (!prerequisitesCourse.courseId) {
                prerequisitesCourse.courseId = courseMap.get(prerequisitesCourse.courseCode);
            }
        }));

        let courseCodes = Array.from(courseMap.keys());

        const session = client.startSession();

        try {
            const transactionOptions = {
                readPreference: "primary",
                readConcern: { level: "local" },
                writeConcern: { w: "majority" },
                maxCommitTimeMS: 1000,
            };

            await session.withTransaction(async () => {


                let result = await courses.createMany(formattedCourses, { session });

                if (!result || !result.insertedIds) {
                    throw new Error("Error while adding the courses.");
                }

            }, transactionOptions);


        } catch (e) {
            return Promise.reject(e);
        } finally {
            await session.endSession();
        }

        await log(regulationId, prgmId, "excel import", courseCodes, userName, "Created new courses");

        return Promise.resolve(`Courses created successfully.`);
    }
    catch (error) {
        return Promise.reject("Error while creating courses.", error.message);
    }
}

/**
 * @description function used to lock importDetails.
 * @param {String} path - Path to the Excel file.
 * @param {ObjectId} regulationId - Object id of regulation.
 * @param {ObjectId} programmeId - Object id of programme.
 * @returns {Promise<String>} A Promise that resolves to a success message.
 */
async function importDetails(path, regulationId, programmeId, fileName, userName) {
    try {
        let regPrgmId = regulationId.toString().concat(programmeId.toString());
        let result = await courses.mutex(regPrgmId).runExclusive(async () => {
            try {
                //Basic excel file validation
                let columns = await excelTemplateService.getSchemeImportColumns(regulationId);

                let validationResult = await validateExcelSheet(path, "Courses", columns, 1, false).catch(error => {
                    if (error) {
                        throw new Error(error);
                    }
                });

                if (validationResult && validationResult.errors && validationResult.errors.length > 0) {
                    let error = new Error(JSON.stringify(validationResult.errors));
                    error.name = "data type mismatch found";
                    throw error;
                }

                let { formattedJsons, errors } = formatJson(validationResult.data, columns);

                // schemes validation
                let validateCoursesResult = await validateCourses(formattedJsons, regulationId, programmeId, fileName, errors);

                let result = await createCourses(validateCoursesResult, regulationId, programmeId, userName);
                return Promise.resolve(result);

            } catch (e) {
                throw e;
            }
        });
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description Formats an array of courses objects into a standardized format.
 * @param {Array<Object>} programmes - Array of courses objects to be formatted.
 * @returns {Array<Object>} An array of formatted courses objects.
 */
function formatJson(programmes, columns) {
    try {
        if (!programmes || !programmes.length) {
            return [];
        }

        let formattedJsons = [];
        let errors = [];

        programmes.forEach(programme => {

            let formattedJson = {};
            let error = {};

            //write error file
            for (let { displayName, dataType } of Object.values(columns)) {
                if (dataType == "n") {
                    error[displayName] = programme[displayName] ? parseInt(programme[displayName]) : programme[displayName];
                } else if (dataType == "b") {
                    error[displayName] = programme[displayName] != "FALSE";
                } else {
                    error[displayName] = programme[displayName];
                }
            }

            formattedJson.semester = programme.Semester ? parseInt(programme["Semester"]) : null;
            formattedJson.courseCode = getFormattedStr(programme["Course Code"]);
            formattedJson.courseTitle = getFormattedStr(programme["Course Title"]);
            formattedJson.courseCategory = getFormattedStr(programme["Course Category"]);
            formattedJson.courseType = programme["Course Type"] ? getFormattedStr(programme["Course Type"]) : null;
            formattedJson.partType = programme["Part Type"];
            formattedJson.hoursPerWeek = {
                lecture: Number.isFinite(programme["Lecture Hours"]) ? parseInt(programme["Lecture Hours"]) : null,
                tutorial: Number.isFinite(programme["Tutorial Hours"]) ? parseInt(programme["Tutorial Hours"]) : null,
                practical: Number.isFinite(programme["Practical Hours"]) ? parseInt(programme["Practical Hours"]) : null
            };
            formattedJson.credits = Number.isFinite(programme["Credits"]) ? parseFloat(programme["Credits"]) : null;
            formattedJson.departmentName = programme["Offering Department Name"] ? getFormattedStr(programme["Offering Department Name"]) : null;
            formattedJson.departmentCategory = programme["Offering Department Category"] ? getFormattedStr(programme["Offering Department Category"]) : null;
            formattedJson.evaluationPattern = programme["Evaluation Scheme"] ? getFormattedStr(programme["Evaluation Scheme"]) : null;
            formattedJson.prerequisites = programme["Prerequisites"] ? programme["Prerequisites"].split(",").map((course) => getFormattedStr(course)) : [];

            formattedJson.isVertical = false;
            formattedJson.isPlaceholder = false;
            formattedJson.isOneYear = false;

            if (getFormattedStr(programme["Is Vertical"]) == "YES") {
                formattedJson.isVertical = true;
            }

            if (getFormattedStr(programme["Is Placeholder"]) == "YES") {
                formattedJson.isPlaceholder = true;
            }

            if (getFormattedStr(programme["Is One Year"]) == "YES") {
                formattedJson.isOneYear = true;
            }

            formattedJson.vertical = programme["Vertical"] || "";

            formattedJsons.push(formattedJson);
            errors.push(error);
        });

        return { formattedJsons, errors };
    } catch (e) {
        throw e;
    }
}

/**
 * @description Checks the validity of course-related data against regulation and programme information.
 * @param {String} regulationId - Object Id of Regulation.
 * @param {String} prgmId - Object id of Programme.
 * @param {String} evaluationId - Object id of evaluation scheme.
 * @param {String} creditId - Object id of Credit Pattern.
 * @param {String} code - The code of the course.
 * @param {string|null} id - Object id of course.
 * @returns {Promise<String>} If any errors.
 */
async function check(data, isAdmin) {
    try {
        let regulationId = data.regulationId;
        let prgmId = data.prgmId;
        let evaluationId = data.evaluationId;
        let creditId = data.creditId;
        let code = data.code;
        let semester = data.semester;
        let isPlaceholder = data.isPlaceholder;
        let category = data.category;
        let id = data.id;
        let isPlaceholderCourse = Boolean(semesterCategories.has(data.category) && semester);

        let regulationRecord = await regulations.get(regulationId, { evaluationIds: 1, creditIds: 1, status: 1 });

        if (!regulationRecord || !regulationRecord.evaluationIds
            || !regulationRecord.evaluationIds.length || !regulationRecord.creditIds || !regulationRecord.creditIds.length) {
            throw new Error("Regulation record not found.");
        }

        regulationRecord.evaluationIds = regulationRecord.evaluationIds.map((id) => id.toString());

        regulationRecord.creditIds = regulationRecord.creditIds.map((id) => id.toString());


        if (regulationRecord.status !== Regulations.status.APPROVED) {
            throw new Error("Course can't be added, since regulation is not yet approved.");
        }

        if (!isPlaceholderCourse && (!regulationRecord.evaluationIds || !regulationRecord.evaluationIds.length || !regulationRecord.evaluationIds.includes(evaluationId.toString()))) {
            throw new Error("The evaluation scheme is not mapped under this regulation.");
        }

        if ((!isPlaceholderCourse && (!regulationRecord.creditIds || !regulationRecord.creditIds.length || !regulationRecord.creditIds.includes(creditId.toString())))) {
            throw new Error("The credit pattern is not mapped under this regulation.");
        }

        let programmeRegulationExist = Boolean(await programmeRegulations.count({ "regulationId": regulationId, "prgm.id": prgmId }));

        if (!programmeRegulationExist) {
            throw new Error("The programme is not mapped under this regulation.");
        }

        const courseCodeRegEx = /^[a-zA-Z0-9_]+$/;

        if (code && !courseCodeRegEx.test(code)) {
            throw new Error("The course code must contain only letters, numbers, and underscores.");
        }

        if (id) {
            let courseExist = await courses.get(id, { regulationId: 1, prgmId: "$prgm.id", status: 1, semester: 1, code: 1, isPlaceholder: 1, category: 1 });

            if (!courseExist || !Object.keys(courseExist).length) {
                throw new Error("Course not found.");
            }

            let statusSet = new Set([Courses.status.APPROVED, Courses.status.CONFIRMED]);

            if (!isAdmin && statusSet.has(courseExist.status)) {
                throw new Error("The Course can't be updated since it is in Approved or Confirmed state.");
            }

            let isPrerequisiteExist = Boolean(await courses.count(
                {
                    "regulationId": courseExist.regulationId,
                    "prgm.id": courseExist.prgmId,
                    "prerequisites.courseId": id
                }
            ));

            if (isPrerequisiteExist && (
                (courseExist.code != code) ||
                (courseExist.semester != semester) ||
                (courseExist.isPlaceholder != isPlaceholder) ||
                (courseExist.category != category))
            ) {
                throw new Error(`The 'semester' / 'course code' / 'course category' / 'placeholder' can't be updated since it is specified as a prerequisite course.`);
            }
        }

        return Promise.resolve(true);

    } catch (e) {
        throw e;
    }
}

/**
 * @description Function to validate the semester is less than or equal to total number of semester for the programme.
 * @param {Number} semester - semester of the course.
 * @param {Number} programmeDuration - Duration of the programme.
 * @returns {Boolean} Returns true if the semester is less than or equal to total number of semester for the programme or false .
 */
function validateSemester(semester, programmeDuration) {
    try {
        if (Boolean(semester <= programmeDuration * semesterCount)) {
            return true;
        }
        return false;
    } catch (e) {
        throw e;
    }
}

/**
 * @description Function to fetch credit data with the given credit id.
 * @param {ObjectId} creditId - Objected Id of a credit pattern.
 * @returns {Object} Returns a object of credit data.
 */
async function getCreditData(creditId) {
    try {
        let creditData = {
            id: null,
            name: null,
            hoursPerWeek: {
                lecture: null,
                tutorial: null,
                practical: null
            },
            credits: null
        }
        if (creditId != null) {
            creditData = await credits.get(creditId,
                {
                    _id: 0,
                    id: "$_id",
                    name: 1,
                    hoursPerWeek: 1,
                    credits: 1
                }
            );

            if (!creditData || !Object.keys(creditData).length) {
                throw new Error("Credit pattern not found.");
            }
        }


        return creditData;
    } catch (e) {
        throw e;
    }
}

/**
 * @description Function to fetch programme data with the given prgm id.
 * @param {ObjectId} regulationId - Objected Id of a regulation.
 * @param {ObjectId} prgmId - Objected Id of a programme.
 * @returns {Object} Returns a object of programme data.
 */
async function getPrgmData(regulationId, prgmId) {
    try {
        let prgmData = await programmeRegulations.getOne(
            {
                regulationId: regulationId,
                "prgm.id": prgmId
            },
            {
                _id: 0,
                id: "$prgm.id",
                name: "$prgm.name",
                category: "$prgm.category"
            }
        );

        if (!prgmData || !Object.keys(prgmData).length) {
            throw new Error("Programme name not found.");
        }

        return prgmData;
    } catch (e) {
        throw e;
    }
}

/**
 * @description Function to fetch evaluation data with the given evaluation id.
 * @param {ObjectId} evaluationId - Objected Id of a evaluation scheme.
 * @returns {Object} Returns a object of evaluation data.
 */
async function getEvaluationData(evaluationId, type) {
    try {

        let evaluationData = {
            id: null,
            name: null,
            markSplitUp: {
                CA: null,
                FE: null,
                total: null
            }
        }

        if (evaluationId != null) {
            evaluationData = await evaluationSchemes.get(evaluationId,
                {
                    _id: 0,
                    id: "$_id",
                    name: 1,
                    "markSplitUp.CA": "$markSplitUp.CA.scaled",
                    "markSplitUp.FE": "$markSplitUp.FE.scaled",
                    "markSplitUp.total": "$markSplitUp.total"
                }
            );

            if (!evaluationData || !Object.keys(evaluationData).length) {
                throw new Error("The evaluation scheme not appropriate for this course type and the regulation or Evaluation scheme not found.");
            }
        }

        return evaluationData;
    } catch (e) {
        throw e;
    }
}

/**
 * @description Checks if a department with the given name and category exists.
 * @param {String} name - The name of the department.
 * @param {String} category - The category of the department.
 * @returns {Promise<{Object}>} A Promise that resolves to an object..
 */
async function departmentData(name, category) {
    try {
        let offeringDept = {
            id: null,
            name: null,
            category: null
        }
        if (name != null && category != null) {
            offeringDept = await departments.getOne({ name: name, category: category, status: "A" }, {
                _id: 0,
                id: "$_id",
                name: 1,
                category: 1
            });

            if (!offeringDept || !Object.keys(offeringDept).length) {
                throw new Error("Invalid department name and category");
            }
        }

        return offeringDept;
    } catch (e) {
        throw e;
    }
}

/**
 * @description Checks if a course exists under the specified regulation and program.
 * @param {String} regulationId - Object of the regulation.
 * @param {String} prgmId - Object of the program.
 * @param {String} code - The code of the course.
 * @param {String} category - The category of the course.
 * @param {number|null} semester - The semester of the course.
 * @param {Array<String>} errors - Array to store error messages.
 * @param {string|null} id - Optional. Object ID of the course.
 */
async function courseExist(regulationId, prgmId, code, category, semester, isPlaceholder, errors, id = null, isOneYear) {
    try {
        let query = {
            "regulationId": regulationId, "prgm.id": prgmId, "code": code
        };

        if (id) {
            query._id = { "$ne": id };
        }

        if (semesterCategories.has(category) && semester != null && isPlaceholder) {
            query.semester = semester
            query.category = { $nin: Array.from(semesterCategories).concat(Array.from(nonSemesterCategories)) }
            let courseCodeExistInOtherCategories = Boolean(await courses.count(query));
            if (courseCodeExistInOtherCategories) {
                errors.push(`The course code ${code} is already exists under semester '${semester}'.`);
            }
            return;
        }

        let message = "";

        if (isOneYear) {
            query["isOneYear"] = { "$ne": true }
            let courseExists = Boolean(await courses.count(query));

            if (courseExists) {
                errors.push(`The course code ${code} is already exists under this programme and regulation.`);
            }

            return;
        }

        if (!semesterCategories.has(category) && semester !== null && isOneYear) {
            query.semester = semester;
            message = `under semester ${semester}`;
        }

        let courseExists = Boolean(await courses.count(query));

        if (courseExists) {
            errors.push(`The course code ${code} is already exists ${message}.`);
        }

    } catch (e) {
        throw e;
    }
}

/**
 * @description Validates the course.
 * @param {Object} data The data object containing course information.
 * @returns {Promise<Array<String>>} A Promise that resolves to an array of errors found during validation.
 */
async function validateData(data, isAdmin) {
    try {
        let errors = [];

        await check(data, isAdmin);

        let categoriesEnum = await attributes.getEnumByName("category", "value");

        let isPlaceholderCourse = Boolean(semesterCategories.has(data.category) && data.semester);

        if (data.isOneYear) {
            let obj = {
                "regulationId": data.regulationId,
                "prgm.id": data.prgmId,
                "code": data.code,
                "title": data.title,
                "type": data.type,
                "category": data.category,
                "evalPattern.id": data.evaluationId,
                "ltpc.id": data.creditId,
                "partType": data.partType,
                "isVertical": data.isVertical,
                "vertical": data.vertical,
                "isPlaceholder": data.isPlaceholder,
                "isOneYear": data.isOneYear
            }

            if (data.deptName && data.deptCategory) {
                obj["offeringDept.name"] = data.deptName;
                obj["offeringDept.category"] = data.deptCategory;
            } else {
                obj["offeringDept"] = {};
            }

            try {
                let query = {
                    "regulationId": data.regulationId,
                    "prgm.id": data.prgmId,
                    "code": data.code,
                    "isOneYear": true
                }

                if (data.id) {
                    query._id = { $ne: data.id };
                }

                let existingCourse = await courses.getOne(query);

                if (existingCourse) {

                    let isMatchFound = Boolean(await courses.count(obj));

                    if (!isMatchFound) {
                        throw new Error("Data mismatch found for one year course.");
                    }
                }

            } catch (err) {
                errors.push(err.message);
            }
        }

        if (data.semester) {
            let { duration, freeze } = await programmeRegulations.getOne({ "regulationId": data.regulationId, "prgm.id": data.prgmId }, { duration: "$prgm.duration", freeze: 1 });
            let isSemesterValid = validateSemester(data.semester, duration);
            if (!isAdmin && (freeze && freeze.length && freeze.includes(data.semester))) {
                errors.push(`Course can't be created or updated under this semester, since it is freezed.`);
            } else if (!isSemesterValid) {
                errors.push(`Semester must be less than or equal to ${duration * semesterCount}.`);
            }
        }

        data["creditData"] = await getCreditData(data.creditId);

        data["evaluationData"] = await getEvaluationData(data.evaluationId, data.type, data.category, data.semester);

        data["prgmData"] = await getPrgmData(data.regulationId, data.prgmId);

        data["offeringDept"] = await departmentData(data.deptName, data.deptCategory);

        const [courseTypeValues, courseCategoryValues, partTypeValues, { verticals }] = await Promise.all([
            attributes.distinctValues("values.shortName", { "name": "type", "module": "regulations" }),
            attributes.distinctValues("values.shortName", { "name": "category", "module": "regulations" }),
            attributes.distinctValues("values.shortName", { "name": "partType", "module": "regulations" }),
            programmeRegulations.getOne({ regulationId: data.regulationId, "prgm.id": data.prgmId }, { verticals: 1 })
        ]);

        if (!isPlaceholderCourse && (courseTypeValues && !courseTypeValues.includes(data.type))) {
            errors.push("Invalid course type.");
        }

        if (courseCategoryValues && !courseCategoryValues.includes(data.category)) {
            errors.push("Invalid course category.");
        }

        if (data.partType != null && partTypeValues && !partTypeValues.includes(data.partType)) {
            errors.push("Invalid part type.");
        }

        if (data.isVertical && data.isPlaceholder) {
            errors.push("Only one of 'Is Vertical' or 'Is Placeholder' can be set to 'YES', not both.");
        } else {
            if (data.semester == null) {
                if (!nonSemesterCategories.has(data.category) && !semesterCategories.has(data.category)) {
                    errors.push(`The semester cannot be null for categorie(s) other than '${getCategoryNames(categoriesEnum, Array.from(nonSemesterCategories).concat(Array.from(semesterCategories)))}'.`);
                } else {
                    if (verticalPlaceHolderNotAllowed.has(data.category) && (data.isPlaceholder || data.isVertical)) {
                        errors.push(`Course comes under '${getCategoryNames(categoriesEnum, Array.from(verticalPlaceHolderNotAllowed))}' categorie(s) without a semester must have 'Is Placeholder' and 'Is Vertical' set to 'NO'.`);
                    } else if (data.isPlaceholder) {
                        errors.push(`Course without a semester must have 'Is Placeholder' set to 'NO'.`);
                    } else if (!verticalAllowedSet.has(data.category) && data.isVertical) {
                        errors.push(`The vertical is only applicable for ${getCategoryNames(categoriesEnum, Array.from(verticalAllowedSet))}.`);
                    }
                }
            } else {
                if (nonSemesterCategories.has(data.category)) {
                    errors.push(`Semester should not be given for categories ${getCategoryNames(categoriesEnum, Array.from(nonSemesterCategories))}.`);
                } else {
                    if (placeholderAllowedSet.has(data.category) && data.isPlaceholder == false) {
                        errors.push(`The 'Is Placeholder' must be set to 'YES' for a course in any semester under the categorie(s) ${getCategoryNames(categoriesEnum, Array.from(nonSemesterCategories).concat(Array.from(semesterCategories)))}.`);
                    } else if ((nonSemesterCategories.has(data.category) || semesterCategories.has(data.category)) && data.isOneYear) {
                        errors.push(`The 'Is One year course' cannot be set to 'YES' for a course in any semester under the categorie(s) ${getCategoryNames(categoriesEnum, Array.from(placeholderAllowedSet))}.`);
                    } else if (placeholderAllowedSet.has(data.category) && data.isVertical) {
                        errors.push(`Vertical cannot be given for placeholder course.`);
                    } else if (!semesterCategories.has(data.category) && (data.isPlaceholder || data.isVertical)) {
                        errors.push(`'Is Placeholder' and 'Is Vertical' must be set to 'NO' for categorie(s) other than ${getCategoryNames(categoriesEnum, Array.from(semesterCategories))}.`);
                    }
                }
            }
        }

        //vertical validation
        if (data.isVertical) {
            if (data.vertical && !verticals.includes(getFormattedStr(data.vertical))) {
                errors.push(`The vertical name '${data.vertical}' is not specified under this programme.`);
            }
        }

        await courseExist(data.regulationId, data.prgmId, data.code, data.category, data.semester, data.isPlaceholder, errors, data.id, data.isOneYear);

        if (data.prerequisites && data.prerequisites.length) {

            if (nonSemesterCategories.has(data.category) && data.isPlaceholder) {
                throw new Error("For placeholder course, prerequisites can't be assigned.");
            }

            if (data.semester == 1) {
                throw new Error("Prerequisites can't be given in the first semester.");
            }

            let courseData = await courses.getBy(
                {
                    "regulationId": data.regulationId,
                    "prgm.id": data.prgmId,
                    "_id": { "$in": data.prerequisites }
                },
                {
                    "_id": 1,
                    "code": 1
                }
            );

            let prerequisitesCourseCodeMap = new Map();

            courseData.forEach((value) => {
                prerequisitesCourseCodeMap.set(value._id.toString(), value.code);
            })

            let queries = [];

            data.prerequisites.forEach(value => {
                queries.push(
                    {
                        "regulationId": data.regulationId,
                        "prgm.id": data.prgmId,
                        "_id": value,
                        category: { $nin: Array.from(nonSemesterCategories).concat(Array.from(semesterCategories)) },
                        isPlaceholder: { $ne: true }
                    }
                );
            });

            if (!nonSemesterCategories.has(data.category) && data.semester != null) {
                queries.map(query => {
                    query["semester"] = { "$lt": data.semester }
                });
            }

            let previousSemesterCounts = await Promise.all(queries.map(async query => Boolean(await courses.count(query))));

            let courseCodeNotInThisRegulation = [];

            let inValidCourseCodes = [];

            let prerequisitesArray = data.prerequisites.map((value, index) => {
                let obj = {};
                let isValid = true;

                let correspondingCourse = courseData.find(course => course._id.toString() === value.toString());

                if (!correspondingCourse) {
                    isValid = false;
                    courseCodeNotInThisRegulation.push(prerequisitesCourseCodeMap.get(value.toString()));
                }

                if (previousSemesterCounts.length && !previousSemesterCounts[index]) {
                    isValid = false;
                    inValidCourseCodes.push(prerequisitesCourseCodeMap.get(value.toString()));
                }

                if (isValid) {
                    obj.courseId = correspondingCourse._id;
                    obj.courseCode = correspondingCourse.code;
                }

                return obj;
            }).filter(obj => Object.keys(obj).length !== 0);

            if (courseCodeNotInThisRegulation && courseCodeNotInThisRegulation.length) {
                errors.push(`The prerequisite course code ${courseCodeNotInThisRegulation.join(",")} is not under this regulation and programme.`);
            }

            if (inValidCourseCodes && inValidCourseCodes.length) {
                errors.push(
                    "The prerequisite course code '" + inValidCourseCodes.join(",") + "' " +
                    "is either not found in any of the previous semesters, " +
                    "is a placeholder, or belongs to one of these categories: " +
                    getCategoryNames(categoriesEnum, Array.from(nonSemesterCategories).concat(Array.from(semesterCategories))) + "."
                );
            }

            data.prerequisites = prerequisitesArray;
        }

        return errors;
    } catch (e) {
        throw e;
    }
}

/**
 * @description creates a new course.
 * @param {Object} data - Course data.
 * @param {Array<String>} userRoles - Array of user roles.
 * @returns {Promise<String>} A Promise that resolves to a success message.
 */
async function create(data, userName) {
    try {
        let regPrgmId = data.regulationId.toString().concat(data.prgmId.toString());
        let result = await courses.mutex(regPrgmId).runExclusive(async () => {
            try {
                let errors = await validateData(data);

                if (errors && errors.length) {
                    throw { "name": "multiErr", "message": errors };
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

                        data.status = Courses.status.DRAFT;

                        data.mappingStatus = Mapping.status.DRAFT;

                        let obj = courses.constructObj(data);

                        let result = await courses.create(obj, { session });

                        if (!result || !result.insertedId) {
                            throw new Error("Error while adding the course.");
                        }

                    }, transactionOptions);

                } catch (e) {
                    return Promise.reject(e);
                } finally {
                    await session.endSession();
                }

                await log(data.regulationId, data.prgmId, "create", data.code, userName, "Created a new course");

                return Promise.resolve(`Scheme for the course code - '${data.code}' has been added successfully.`);
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
 * @description - updates an existing course.
 * @param {Object} data - Course data.
 * @param {Array<String>} userRoles - Array of user roles.
 * @returns {Promise<string|Array<String>>} - A Promise that resolves to a success message.
 */
async function update(data, userName, isAdmin) {
    try {
        let regPrgmId = data.regulationId.toString().concat(data.prgmId.toString());
        let result = await courses.mutex(regPrgmId).runExclusive(async () => {
            try {
                let errors = await validateData(data, isAdmin);

                if (errors && errors.length) {
                    throw { "name": "multiErr", "message": errors };
                }

                let obj = courses.constructUpdateObj(data);

                let result = await courses.update(data.id, "SET", obj);

                if (!result || !result.modifiedCount) {
                    throw new Error("No modifications found.");
                }

                await log(data.regulationId, data.prgmId, "update", data.code, userName, "Updated a course");

                return Promise.resolve(`Scheme for the course code - '${data.code}' has been updated successfully.`);
            } catch (e) {
                return Promise.reject(e);
            }
        });
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

function constructMatchQuery(regulationId, programmeId, userRoles, allowedPrgmIds) {
    try {
        let prgmIdStr = programmeId.toString();

        let matchQuery = {
            regulationId: regulationId,
            "prgm.id": programmeId
        };

        let statusArray = [Courses.status.CONFIRMED];

        if (userRoles.has(ROLES.A) || (userRoles.has(ROLES.SF) && allowedPrgmIds.includes(prgmIdStr))) {
            statusArray = [...statusArray, Courses.status.DRAFT, Courses.status.WAITING_FOR_APPROVAL, Courses.status.APPROVED, Courses.status.REQUESTED_CHANGES];
        }

        if (userRoles.has(ROLES.A) || (userRoles.has(ROLES.SA1) && allowedPrgmIds.includes(prgmIdStr))) {
            statusArray = [...statusArray, Courses.status.APPROVED, Courses.status.WAITING_FOR_APPROVAL];
        }

        if (userRoles.has(ROLES.A) || userRoles.has(ROLES.SA2)) {
            statusArray = [...statusArray, Courses.status.APPROVED];
        }

        statusArray = Array.from(new Set(statusArray));

        matchQuery.status = { $in: statusArray };

        return matchQuery;
    } catch (e) {
        throw e;
    }
}

/**
 * @description Retrieves distinct courses based on regulation and programme IDs.
 * @param {Object} regulationId - Object id of regulation.
 * @param {Object} programmeId - Object id of programme.
 * @returns {Promise<Array<Object>>} A Promise that resolves to an array of distinct courses.
 */
async function viewCourses(regulationId, programmeId, { userRoles, username }) {
    try {
        let isCloneAllowed = false;

        let prgmIds = await getUserProgramIds(username);

        let matchQuery = constructMatchQuery(regulationId, programmeId, userRoles, prgmIds);

        let { freeze, verticals } = await programmeRegulations.getOne({ "regulationId": regulationId, "prgm.id": programmeId }, { freeze: 1, verticals: 1 });

        let pipeline = courses.constructPipeline(matchQuery);

        let [result] = await courses.aggregate(pipeline);

        let courseCategoryEnum = await attributes.getEnumByName("category", "value");

        if (!result.categoryWise || !result.semWise) {
            throw new Error("Failed to fetch courses.");
        }

        result.categoryWise.map((value) => {
            value._id = courseCategoryEnum.values[value._id];
        });

        let coursesData = result.semWise.concat(result.categoryWise);
        let courseTypeEnum = await attributes.getEnumByName("type", "value");

        coursesData.forEach((record) => {
            if (record.semester) {
                if (freeze.includes(record.semester)) {
                    record.status = Courses.displayStatus.FREEZED;
                } else {
                    record.status = Courses.displayStatus.NOT_FREEZED;
                }
            }


            let count = { type: {}, category: {} };

            record.courseTypes.forEach(courseType => {
                if (!count["type"][courseTypeEnum.values[courseType]]) {
                    count["type"][courseTypeEnum.values[courseType]] = 1;
                } else {
                    count["type"][courseTypeEnum.values[courseType]]++;
                }
            });

            record.categories.forEach(category => {
                if (!count["category"][courseCategoryEnum.values[category]]) {
                    count["category"][courseCategoryEnum.values[category]] = 1;
                } else {
                    count["category"][courseCategoryEnum.values[category]]++;
                }
            });

            record.courses.map((course) => {
                course.category = courseCategoryEnum.values[course.category];
            });

            delete record.categories;
            delete record.courseTypes;
            delete record.statuses;
            record.count = count;
        });

        if (coursesData && coursesData.length == 0 && verticals && verticals.length == 0) {
            isCloneAllowed = true;
        }

        return Promise.resolve({ coursesData, isCloneAllowed });
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - Removes a course by its object id.
 * @param {Object} id - Object id of the course.
 * @returns {Promise<String>} - A Promise that resolves to a success message.
 */
async function remove(id, userName) {
    try {
        let courseRec = await courses.get(id);

        if (!courseRec) {
            throw new Error("Course record not found.");
        }

        let regPrgmId = courseRec.regulationId.toString().concat(courseRec.prgm.id.toString());
        let result = await courses.mutex(regPrgmId).runExclusive(async () => {
            try {

                let freeze = await programmeRegulations.distinct("freeze", { "regulationId": courseRec.regulationId, "prgm.id": courseRec.prgm.id });

                if (freeze.includes(courseRec.semester)) {
                    throw new Error(`Course can't be deleted under this semester, since it is freezed.`);
                }

                if (courseRec.status == Courses.status.CONFIRMED) {
                    throw new Error("The course can't be deleted since it is in confirmed state.");
                }

                let preReqs = await courses.distinct("code", {
                    "regulationId": courseRec.regulationId, "prgm.id": courseRec.prgm.id,
                    "prerequisites": { $elemMatch: { "courseId": id } }
                });

                if (preReqs && preReqs.length) {
                    throw new Error(`The course can't be deleted since it is used as a prerequisite for the courses ${preReqs.join(" , ")}.`);
                }

                let result = await courses.remove(id);

                if (!result || !result.deletedCount) {
                    throw new Error("Failed to delete the course.");
                }

                await log(courseRec.regulationId, courseRec.prgm.id, "delete", courseRec.code, userName, "Deleted a course");

                return Promise.resolve(`Scheme for the course code - '${courseRec.code}' has been deleted successfully.`);
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
 * @description - Function to update offering department.
 * @param {String} deptCategory This the department category.
 * @param {String} deptName This is the department name.
 * @param {Object} items Contains the selected or unselected id's of the courses(Bulk Select).
 * @returns {Promise<String>} - A Promise that resolves to a success message.
 */
async function updateOfferingDepartment(deptName, deptCategory, items, userName, isAdmin) {
    try {

        let coursesWithWrongStatus = [];

        let coursesWithPlaceholders = [];

        let filterQuery = courses.bulkSelectQuery(items);

        let records = await courses.getBy(filterQuery);

        if (!records || (records && !records.length)) {
            throw new Error("Error while fetching courses when updating the offering department.");
        }

        records.forEach((record) => {
            if (![Courses.status.DRAFT, Courses.status.WAITING_FOR_APPROVAL, Courses.status.REQUESTED_CHANGES].includes(record.status)) {
                coursesWithWrongStatus.push(record.code);
            }
            if (semesterCategories.has(record.category) && record.semester != null) {
                coursesWithPlaceholders.push(record.code);
            }
        });


        if (!isAdmin && (coursesWithWrongStatus && coursesWithWrongStatus.length)) {
            throw new Error(`The offering department cannot be updated for the following course codes as they are designated as ${Courses.status.descriptions.AP} or  ${Courses.status.descriptions.CO} - '${coursesWithWrongStatus}'.`);
        }

        if (coursesWithPlaceholders && coursesWithPlaceholders.length) {
            throw new Error(`The offering department cannot be updated for the following course codes as they are placeholder courses - '${coursesWithPlaceholders}'.`);
        }

        let offeringDept = await departmentData(deptName, deptCategory);

        let courseIds = records.map(courseId => courseId._id);

        let courseCodes = records.map(course => course.code);

        let result = await courses.updateMany({ "_id": { "$in": courseIds } }, "SET", { "offeringDept.id": offeringDept.id, "offeringDept.name": offeringDept.name, "offeringDept.category": offeringDept.category });

        if (!result || !result.modifiedCount) {
            throw new Error("No modifications found.");
        }

        let msg = `Updated the offering department i.e., deptName -'${deptName}' and deptCategory -'${deptCategory}'
        for the courses '${courseCodes}', course id's - '${courseIds}'`;

        await regulationLog("courses", "update offering department", userName, msg);

        return Promise.resolve(`Updated the offering department as deptName -'${deptName}'
            and deptCategory -'${deptCategory}' for the course code(s) '${courseCodes}'.`);

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
function validateCoPo(mapping, po, co) {
    try {
        let programmeOutcomes = Object.keys(po);
        let courseOutcomes = Object.keys(co);
        let levels = Object.keys(Mapping.level.values);

        for (let poMap in mapping) {

            if (!programmeOutcomes.includes(poMap)) {
                throw new Error(`Invalid programme outcome - ${poMap}`);
            }

            for (let coMap in mapping[poMap]) {

                if (!courseOutcomes.includes(coMap)) {
                    throw new Error(`Invalid course outcome - ${coMap} of programme outcome - ${poMap}`);
                }

                mapping[poMap][coMap] = mapping[poMap][coMap].trim().toString().trim().toUpperCase();

                if (!levels.includes(mapping[poMap][coMap])) {
                    throw new Error(`Invalid level of course outcome - ${mapping[poMap][coMap]} of co - ${coMap} , po - ${poMap}`);
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
async function coPoMapping(id, mapping, userName) {
    try {
        let courseRecord = await courses.get(id, { co: 1, regulationId: 1, "prgm.id": 1, status: 1, mappingStatus: 1, code: 1 });

        if (!courseRecord || !Object.keys(courseRecord).length) {
            throw new Error("Invalid course id received.");
        }

        let prgmRegRec = await programmeRegulations.getOne(
            {
                regulationId: courseRecord.regulationId,
                "prgm.id": courseRecord.prgm.id,
                poStatus: Mapping.status.APPROVED
            },
            {
                pso: 1, po: 1, _id: 0
            }
        );

        if (!prgmRegRec || !Object.keys(prgmRegRec).length) {
            throw new Error("The programme outcome is not in approved state.");
        }

        let regPrgmId = courseRecord.regulationId.toString().concat(courseRecord.prgm.id.toString());

        let result = await courses.mutex(regPrgmId).runExclusive(async () => {
            try {
                if (!courseRecord.co || !Object.keys(courseRecord.co).length) {
                    throw new Error("The course outcomes doesn't exist for the course.");
                }

                if (courseRecord.status != Courses.status.CONFIRMED) {
                    throw new Error("Course is not yet confirmed.");
                }

                if (courseRecord.mappingStatus == Mapping.status.APPROVED) {
                    throw new Error("Can't update the CO-PO mapping since it is already approved.");
                }

                validateCoPo(mapping, Object.assign({}, prgmRegRec.po, prgmRegRec.pso), courseRecord.co);

                let result = await courses.update(id, "SET", { mapping });

                if (!result || !result.modifiedCount) {
                    throw new Error("No modifications found.");
                }

                let msg = `Course outcome and programme outcome have been mapped for the course code ${courseRecord.code}`;

                await regulationLog("courses", "co po mapping", userName, msg);

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
 * @description Uploads attachments for a specific course.
 * @param {ObjectId} courseId - The ID of the course to which the documents will be uploaded.
 * @param {Array} attachments - An array of attachment objects to be uploaded.
 * @returns {Promise<Object>} - A promise that resolves with the result of the update operation.
 * @throws {Error} - Throws an error if the course does not exist, if there are missing fields in attachments, or if the update operation fails.
 */
async function uploadDoc(courseId, attachment) {
    try {
        let courseRecord = await courses.get(courseId);

        if (!courseRecord && !Object.keys(courseRecord).length) {
            throw new Error("Course record not found.");
        }

        if (courseRecord.status == Courses.status.CONFIRMED || courseRecord.status == Courses.status.APPROVED) {
            throw new Error("The syllabus cannot be uploaded because the course has already been confirmed or approved.");
        }

        let result = await courses.updateOne({ _id: courseId }, "SET", { attachment });

        if (!result || !result.modifiedCount) {
            throw new Error("Failed to save the syllabus.");
        }

        return Promise.resolve(`Course code - '${courseRecord.code}' syllabus uploaded successfully.`);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description Add course outcomes to courses.
 * @param {ObjectId} id - Object id of course.
 * @param {Array<String>}  - Array of course outcomes
 * @returns {Promise<String>} A Promise that resolves to a success message.
 */
async function updateCO(id, courseOutcomes, userName) {
    try {
        let courseRec = await courses.get(id);

        if (!courseRec) {
            throw new Error("Course record not found.");
        }

        let regPrgmId = courseRec.regulationId.toString().concat(courseRec.prgm.id.toString());

        let result = courses.mutex(regPrgmId).runExclusive(async () => {
            try {

                if (courseRec.status != Courses.status.CONFIRMED) {
                    throw new Error("Course not yet confirmed.");
                }

                if (courseRec.mappingStatus == Mapping.status.APPROVED) {
                    throw new Error("Can't update course outcome since the CO-PO mapping is in approved state.");
                }

                let obj = {};
                let weightage = 0;

                courseOutcomes.forEach((courseOutcome, index) => {
                    let key = `CO${index + 1}`;

                    obj[key] = {
                        description: courseOutcome.description?.toString().trim() || "",
                        taxonomy: courseOutcome?.taxonomy?.map(taxonomy => taxonomy.value) || [],
                        weightage: isFinite(courseOutcome.weightage) ? (weightage += parseFloat(courseOutcome.weightage.toFixed(2)), parseFloat(courseOutcome.weightage.toFixed(2))) : 0
                    };
                });

                if (parseFloat(weightage.toFixed(2)) != 1) {
                    throw new Error("Total Weightage of course outcomes must be exactly 1.");
                }

                let result = await courses.updateOne({ _id: id }, "SET", { co: obj, mapping: {} });

                if (!result || !result.modifiedCount) {
                    throw new Error("No modifications found.");
                }

                let msg = `Course outcome(s) have been updated for the course code ${courseRec.code}.`;

                await regulationLog("courses", "updated co", userName, msg);

                return Promise.resolve("Successfully updated course outcomes.");

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
 * @description - To fetch course outcomes for the given course id.
 * @param {ObjectId} courseId - Object id of course.
 * @returns {Promise<Array<String>>} - A Promise that resolves to an array of course outcomes.
 */
async function assignCoUploaders(courseId, facultyIds = []) {
    try {
        let courseRec = await courses.get(courseId);
        if (!courseRec) {
            throw new Error("course record not found.");
        }

        let result = await faculty.getEmails(facultyIds) || [];
        if (result.length != facultyIds.length) {
            throw new Error("Received some invalid faculty ids.");
        }

        await courses.updateOne({ _id: courseId }, "SET", { coUploaders: facultyIds });

        return Promise.resolve(`Successfully assigned Course Outcome uploaders for the course ${courseRec.code}- ${courseRec.title}`);
    } catch (e) {
        throw e;
    }
}


export default {
    get,
    create,
    update,
    remove,
    getConstants,
    changeStatus,
    importDetails,
    validatePayload,
    idExistValidation,
    exportToExcel,
    viewCourses,
    actionItems,
    coActionItems,
    uploadDoc,
    getMapping,
    updateCO,
    updateOfferingDepartment,
    getOutcomes,
    getOutcomesAccess,
    getCoursesForMapping,
    getTemplate,
    changeMappingStatus,
    coPoMapping,
    fetchDetailsForAdd,
    getPrerequisites,
    validateUser,
    getOfferingDept,
    bulkActionItems,
    setIsFreezeActive,
    assignCoUploaders
}
