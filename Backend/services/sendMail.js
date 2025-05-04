import users from "../daos/users.js";
import emailUtility from "../utilities/emailUtility.js";
import { ROLES } from "../middleware/auth.js";
import { Regulations, Courses, Mapping, Jobs } from "../enums/enums.js";
import jobs from "../daos/jobs.js";

/**
 * @description Function to get faculty mail ids and sends the mail.
 * @param {String} destination The status change that is done now.
 * @param {String} year Year of the regulation.
 * @param {String} version Version of the regulation.
 * @param {String} title Title of the regulation.
 * @param {String} msg message.
 * @param {String} reason reason if the status change is RC.
 */
async function regulationMailService(destination, year, version, title, msg, jobId, userName, userId, reason) {
    try {
        await jobs.update(jobId, "SET", {
            "dates.started": new Date(),
            "status": Jobs.status.InProgress
        });

        let params = {
            year: year,
            version: version,
            description: title,
            facultyId: userName,
            msg: msg
        };

        let query = {};
        if (destination == Regulations.status.WAITING_FOR_APPROVAL) {
            params.header = `Requested for approval`;
            params.subject = `Pending Approval Request for Regulation ${year}-${version}`;
            params.message = `This is to remind you about the pending approval
            request for the regulation ${year}-${version}. Please find the details below.`;
            query = { roles: { $elemMatch: { $eq: ROLES.RA } } };

        }

        if (destination == Regulations.status.REQUESTED_CHANGES) {
            params.header = `Needs correction`;
            params.subject = ` Correction Needed for Regulation ${year}-${version}`;
            params.reason = reason;
            params.message = `This is to inform you that the regulation ${year}-${version}.
            needs correction. Please find the details below.`;
            query = { roles: { $elemMatch: { $eq: ROLES.RF } } };
        }

        if (destination == Regulations.status.APPROVED) {
            params.header = `Approved`;
            params.subject = `Approval for Regulation  ${year}-${version}`;
            params.message = `We are pleased to inform you that the regulation ${year}-${version}.
            has been approved. Please find the details below.`;
            query = { userId: { "$ne": userId }, roles: { $in: [ROLES.RF, ROLES.RA] } };
        }

        let facultyIds = await users.distinct("userId", query);

        let success = [];
        let failed = [];

        if (facultyIds && facultyIds.length) {
            await emailUtility.mailService(facultyIds, params, "regChangeStatus.handlebars", success, failed);
        }

        await jobs.update(jobId, "SET", {
            "dates.finished": new Date(),
            "status": Jobs.status.Completed,
            "recordCount": facultyIds.length,
            "completionPercentage": 100,
            "summary.success": success,
            "summary.failed": failed
        });
    } catch (e) {
        await jobs.update(jobId, "SET", {
            "status": Jobs.status.Errored,
            "reason": e.message
        });
    }
}

/**
 * @description Function to sends the mail.
 * @param {Object} params Params data for template.
 * @param {Object} query Query for filter faculty Ids.

 * @param {String} reason reason if the status change is RC.
 */
async function sendMail(params, query, success, failed) {

    try {
        let facultyIds = await users.distinct("userId", query);

        if (facultyIds && facultyIds.length) {
            return await emailUtility.mailService(facultyIds, params, "coursesChangeStatus.handlebars", success, failed);
        }
    } catch (error) {
        throw error;
    }
}

/**
 * @description Function to get faculty mail ids and sends the mail.
 * @param {String} destination The status change that is done now.
 * @param {Object} regRec The regulation record.
 * @param {Object} prgmRec The programme regulation record.
 * @param {String} msg message.
 * @param {String} reason reason if the status change is RC.
 */
async function coursesMailService(source, destination, regRec, prgmRec, msg, jobId, userName, userId, reason) {
    try {

        await jobs.update(jobId, "SET", {
            "dates.started": new Date(),
            "status": Jobs.status.InProgress
        });

        let params = {
            year: regRec.year,
            version: regRec.version,
            title: regRec.title,
            programme: prgmRec.programme,
            category: prgmRec.category,
            type: prgmRec.type,
            mode: prgmRec.mode,
            facultyId: userName,
            msg
        };

        let query = {};
        let success = [];
        let failed = [];

        if (destination == Courses.status.WAITING_FOR_APPROVAL) {
            params.header = `Requested for approval`;
            params.subject = `Pending Approval Request for Programme Scheme`;
            params.message = `This is a reminder about the pending approval request for the programme scheme. Please find the details below.`;
            query = { roles: ROLES.SA1, programmeIds: prgmRec.prgmId };

            await sendMail(params, query, success, failed);
        }

        if (destination == Courses.status.REQUESTED_CHANGES) {
            params.header = `Needs correction`;
            params.subject = `Correction Needed for Programme Scheme`;
            params.reason = reason;
            params.message = `This is to inform you about the corrections needed for the programme scheme. Please find the details below.`;
            query = {
                programmeIds: prgmRec.prgmId,
                $or: [
                    { roles: ROLES.SF },
                    { userId: { "$ne": userId }, roles: ROLES.SA1 }
                ]
            }

            if (source == Courses.status.APPROVED) {
                query.$or.push({ roles: ROLES.SA2 });
            }

            await sendMail(params, query, success, failed);

        }

        if (destination == Courses.status.APPROVED) {

            //mail for confirmation of approved
            params.header = `Approved`;
            params.subject = `Approval of Programme Scheme`;
            params.message = `We are pleased to inform you that the programme scheme(s), have been approved. Please find the details below.`;
            query = {
                programmeIds: prgmRec.prgmId,
                $or: [
                    { roles: ROLES.SF },
                    { userId: { "$ne": userId }, roles: ROLES.SA1 }
                ]
            }

            await sendMail(params, query, success, failed);

            //mail for pending confirmation
            params.header = `Requested for confirmation`;
            params.subject = `Pending Confirmation Request for Programme Scheme`;
            params.message = `This is a reminder about the pending confirmation request for the programme scheme. Please find the details below.`;
            query = {
                $or: [
                    { roles: ROLES.SA2 }
                ]
            }

            await sendMail(params, query, success, failed);

        }

        if (destination == Courses.status.CONFIRMED) {
            params.header = `Confirmed`;
            params.subject = `Confirmation of Programme Scheme`;
            params.message = `We are pleased to inform you that the programme scheme(s), have been confirmed. Please find the details below.`;

            query = {
                $or: [
                    { roles: ROLES.SF, programmeIds: prgmRec.prgmId },
                    { roles: ROLES.SA1, programmeIds: prgmRec.prgmId },
                    { userId: { "$ne": userId }, roles: ROLES.SA2 }
                ]
            };

            await sendMail(params, query, success, failed);
        }



        await jobs.update(jobId, "SET", {
            "dates.finished": new Date(),
            "status": Jobs.status.Completed,
            "recordCount": success.length + failed.length,
            "completionPercentage": 100,
            "summary.success": success,
            "summary.failed": failed

        });
    } catch (e) {
        await jobs.update(jobId, "SET", {
            "status": Jobs.status.Errored,
            "reason": e.message
        });
    }
}

/**
 * @description Function to get faculty mail ids and sends the mail.
 * @param {String} destination The status change that is done now.
 * @param {Object} prgmRec The programme regulation record.
 * @param {Object} regRec The regulation record.
 * @param {String} msg message.
 * @param {String} reason reason if the status change is RC.
 */
async function programmeOutcomeMailService(destination, regRec, prgmRec, msg, jobId, userName, userId, reason) {
    try {

        await jobs.update(jobId, "SET", {
            "dates.started": new Date(),
            "status": Jobs.status.InProgress
        });


        let params = {
            year: regRec.year,
            version: regRec.version,
            title: regRec.title,
            programme: prgmRec.programme,
            category: prgmRec.category,
            type: prgmRec.type,
            mode: prgmRec.mode,
            facultyId: userName,
            msg
        };

        let query = {};

        if (destination == Mapping.status.WAITING_FOR_APPROVAL) {
            params.header = `Requested for approval`;
            params.subject = `Pending Approval Request for Programme Outcomes`;
            params.message = `This is a reminder about the pending approval request for the programme outcomes. Please find the details below.`;
            query = {
                programmeIds: prgmRec.prgmId,
                roles: ROLES.OA
            };
        }

        if (destination == Mapping.status.REQUESTED_CHANGES) {
            params.header = `Needs correction`;
            params.subject = `Correction Needed for Programme Outcomes`;
            params.reason = reason;
            params.message = `This is to inform you about the corrections needed for the programme outcomes. Please find the details below.`;
            query = {
                programmeIds: prgmRec.prgmId,
                roles: ROLES.PU
            };
        }

        if (destination == Mapping.status.APPROVED) {
            params.header = `Approved`;
            params.subject = `Approval of Programme Outcomes`;
            params.message = `We are pleased to inform you that the programme outcomes have been approved. Please find the details below.`;
            query = { userId: { "$ne": userId }, programmeIds: prgmRec.prgmId, roles: { $in: [ROLES.PU, ROLES.OA] } };
        }

        let facultyIds = await users.distinct("userId", query);

        let success = [];
        let failed = [];

        if (facultyIds && facultyIds.length) {
            await emailUtility.mailService(facultyIds, params, "poChangeStatus.handlebars", success, failed);
        }

        await jobs.update(jobId, "SET", {
            "dates.finished": new Date(),
            "status": Jobs.status.Completed,
            "completionPercentage": 100,
            "recordCount": facultyIds.length,
            "summary.success": success,
            "summary.failed": failed
        });

    } catch (e) {
        await jobs.update(jobId, "SET", {
            "status": Jobs.status.Errored,
            "reason": e.message
        });
    }
}

/**
 * @description Function to get faculty mail ids and sends the mail.
 * @param {String} destination The status change that is done now.
 * @param {Object} prgmRec The programme regulation record.
 * @param {Object} regRec The regulation record.
 * @param {String} msg message.
 * @param {String} reason reason if the status change is RC.
 */
async function coPoMappingMailService(destination, regRec, prgmRec, msg, jobId, userName, reason, coUploaders = []) {
    try {
        await jobs.update(jobId, "SET", {
            "dates.started": new Date(),
            "status": Jobs.status.InProgress
        });

        let params = {
            year: regRec.year,
            version: regRec.version,
            title: regRec.title,
            programme: prgmRec.programme,
            category: prgmRec.category,
            type: prgmRec.type,
            mode: prgmRec.mode,
            facultyId: userName,
            msg
        };

        let facultyIds = []

        if (destination == Mapping.status.WAITING_FOR_APPROVAL) {
            params.header = `Requested for approval`;
            params.subject = `Pending Approval Request for Course Outcomes`;
            params.message = `This is a reminder about the pending approval request. Please find the details below.`;

            facultyIds = await users.distinct("userId", {
                programmeIds: prgmRec.prgmId,
                roles: ROLES.OA
            });
        }

        if (destination == Mapping.status.REQUESTED_CHANGES) {
            params.header = `Needs correction`;
            params.subject = `Correction Needed for Course Outcomes`;
            params.reason = reason;
            params.message = `This is to inform you about the needed corrections for the course outcomes. Please find the details below.`;
            facultyIds = coUploaders
        }

        if (destination == Mapping.status.APPROVED) {
            params.header = `Approved`;
            params.subject = `Approval of Course Outcomes`;
            params.message = `We are pleased to inform you that the course outcomes, has been approved. Please find the details below.`;
            facultyIds = await users.distinct("userId", {
                programmeIds: prgmRec.prgmId,
                roles: ROLES.OA
            });
            facultyIds = facultyIds.concat(coUploaders);
        }



        let success = [];
        let failed = [];

        if (facultyIds && facultyIds.length) {
            await emailUtility.mailService(Array.from(new Set(facultyIds)), params, "mappingChangeStatus.handlebars", success, failed);
        }

        await jobs.update(jobId, "SET", {
            "dates.finished": new Date(),
            "status": Jobs.status.Completed,
            "completionPercentage": 100,
            "recordCount": facultyIds.length,
            "summary.success": success,
            "summary.failed": failed
        });

    } catch (e) {
        await jobs.update(jobId, "SET", {
            "status": Jobs.status.Errored,
            "reason": e.message
        });
    }
}

export default { coursesMailService, coPoMappingMailService, regulationMailService, programmeOutcomeMailService };