import { Router } from "express";
import appLogger from "../logging/appLogger.js";
import { ObjectId } from "mongodb";
import regulations from "../services/regulations.js";
import { Regulations } from "../enums/enums.js";
import { authorize, ROLES } from "../middleware/auth.js";

const router = Router();

//Table load
router.post("/pagination", authorize([ROLES.A, ROLES.RA, ROLES.RF]), async function (req, res) {
    try {
        let filter = req.body.filter || {};
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 15;
        let search = req.body.search || "";
        let sort = req.body.sort || { _id: -1 };

        let user = req.headers.userDetails;

        let result = await regulations.pagination(filter, skip, limit, search, sort, user);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching data for pagination.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Create regulation
router.post("/", authorize([ROLES.A, ROLES.RF]), async (req, res) => {
    try {
        let year = req.body.year;
        let userName = req.headers.userDetails.username;

        if (!year) {
            throw new Error("Mandatory fields are missing.");
        }

        let { title, creditIds, gradeIds, evaluationIds, programmeIds, attachments } = regulations.validatePayload(req.body);
        let result = await regulations.create(title, year, creditIds, gradeIds, evaluationIds, programmeIds, attachments, userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while creating regulation.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Load action items
router.get("/action/items/:id", authorize([ROLES.A, ROLES.RF, ROLES.RA]), async function (req, res) {
    try {
        let id = req.params.id;
        let user = req.headers.userDetails;

        if (!id) {
            throw new Error("Missing regulation id.");
        }

        let result = await regulations.actionItems(ObjectId(id), user.userRoles);
        res.send(result);
    } catch (err) {
        appLogger.error("Error while fetching action items.", err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});

//Clone a regulation
router.post("/clone/:id", authorize([ROLES.A, ROLES.RF]), async function (req, res) {
    try {
        let year = req.body.year;
        let userName = req.headers.userDetails.username;
        let cloneId = req.params.id;

        if (!year || !cloneId) {
            throw new Error("Mandatory fields are missing.");
        }

        let { title, creditIds, gradeIds, evaluationIds, programmeIds, attachments } = regulations.validatePayload(req.body);

        let result = await regulations.create(title, year, creditIds, gradeIds, evaluationIds, programmeIds, attachments, userName, ObjectId(cloneId));

        res.send(result);
    } catch (e) {
        appLogger.error("Error while cloning the regulation.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Distinct fields for filter
router.get("/distinct/:field", authorize([ROLES.A, ROLES.RF, ROLES.RA]), async function (req, res) {
    try {
        let field = req.params.field;
        let user = req.headers.userDetails;

        if (!field) {
            throw new Error("Requested field missing.");
        }

        let result = await regulations.distinct(field, user);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching distinct values for filter.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Distinct programmes for filter
router.get("/role/programmes", authorize([ROLES.A, ROLES.RF, ROLES.RA]), async function (req, res) {
    try {
        let user = req.headers.userDetails;

        if (!user) {
            throw new Error("Requested field missing.");
        }

        let result = await regulations.programNamesByRole(user);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching distinct programme names for filter.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//View regulation attachments
router.get("/attachments/:id", authorize([ROLES.A, ROLES.RF, ROLES.RA]), async function (req, res) {
    try {
        let regulationId = req.params.id;

        if (!regulationId) {
            throw new Error("Requested field missing.");
        }

        let result = await regulations.getAttachments(ObjectId(regulationId));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching the attachments.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//To show all approved regulation names with year and version
router.get("/approved", authorize([ROLES.A, ROLES.RF, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res) {
    try {
        let result = await regulations.fetchApprovedRegulations();
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching approved regulation names.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//View regulation
router.get("/:id", authorize([ROLES.A, ROLES.RF, ROLES.RA]), async function (req, res) {
    try {
        let id = req.params.id;
        if (!id) {
            throw new error("Requested regulation id missing.");
        }
        const result = await regulations.get(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching regulation.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Update status -> Sent for Approval, Approve, Request Changes
router.put("/status/:id", authorize([ROLES.A, ROLES.RF, ROLES.RA]), async function (req, res) {
    try {
        let id = req.params.id;
        let destination = req.body.destination;
        let user = req.headers.userDetails;
        let reason = req.body.reason;
        let userName = req.headers.userDetails.name ? (req.headers.userDetails.preferred_username + " - " + req.headers.userDetails.name) : req.headers.userDetails.preferred_username;;
        let userId = req.headers.userDetails.preferred_username.toUpperCase();

        if (!id || !destination) {
            throw new Error("Detail missing to change status.");
        }

        if (destination == Regulations.status.REQUESTED_CHANGES && !reason) {
            throw new Error(`Since changing status to ${Regulations.status.values[destination]}, need to provide the reason or mention what change have to be done.`);
        }

        let result = await regulations.changeStatus(ObjectId(id), destination, user.userRoles, userName.toUpperCase(), userId, reason);
        res.send(result);
    } catch (err) {
        appLogger.error("Error while changing regulation status", err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});

//Update regulation
router.put("/", authorize([ROLES.A, ROLES.RF, ROLES.RA]), async function (req, res) {
    try {
        let id = req.body.id;
        let userName = req.headers.userDetails.username;
        if (!id) {
            throw new error("Requested id missing.");
        }

        let { title, creditIds, gradeIds, evaluationIds, programmeIds, attachments } = regulations.validatePayload(req.body);
        let result = await regulations.update(ObjectId(id), title, creditIds, gradeIds, evaluationIds, programmeIds, attachments, userName);

        res.send(result);
    } catch (e) {
        appLogger.error("Error while updating regulation.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Delete regulation
router.delete("/:id", authorize([ROLES.A, ROLES.RF]), async function (req, res) {
    try {
        let id = req.params.id;
        let userName = req.headers.userDetails.username;

        if (!id) {
            throw new error("Requested id missing.");
        }

        let result = await regulations.remove(ObjectId(id), userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while deleting regulation.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;