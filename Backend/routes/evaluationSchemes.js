import { Router } from "express";
import { ObjectId } from "mongodb";
import appLogger from "../logging/appLogger.js";
import { authorize, ROLES } from '../middleware/auth.js';
import evaluationSchemes from "../services/evaluationSchemes.js";
import { validatePayload } from "../services/validateEvaluationScheme.js";

const router = Router();

//Get info of selected evaluation scheme
router.post("/info", authorize([ROLES.A, ROLES.RF, ROLES.RA]), async function (req, res) {
    try {

        let evaluationIds = req.body.evaluationIds;

        if (!evaluationIds || !evaluationIds.length) {
            throw new error("Requested evaluation ids missing.");
        }

        evaluationIds = evaluationIds.map((evaluationId) => ObjectId(evaluationId));
        let result = await evaluationSchemes.explore(evaluationIds);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching evaluation patterns for explore.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Table data
router.post("/pagination", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let filter = req.body.filter || {};
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 15;
        let search = req.body.search || "";
        let sort = req.body.sort || { _id: -1 };

        let result = await evaluationSchemes.pagination(filter, skip, limit, search, sort);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching data for pagination.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Create evaluation scheme
router.post("/", authorize([ROLES.A, ROLES.DM]), async (req, res) => {
    try {
        let { name, courseType, distributionType, markSplitUp, CA_Components, FE_Components } = validatePayload(req.body);
        let userName = req.headers.userDetails.username;
        let result = await evaluationSchemes.create(name, courseType.toString().trim().toUpperCase(), distributionType, markSplitUp, CA_Components, FE_Components, userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while creating evaluation scheme", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Load evaluation schemes in a regulation based on courseType
router.get("/course/type/:courseType/:regulationId", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2]), async function (req, res) {
    try {
        let courseType = req.params.courseType;
        let regId = req.params.regulationId;

        if (!courseType || !regId) {
            throw new Error("Mandatory fields are missing.");
        }

        let result = await evaluationSchemes.getEvalNameByCourseType(ObjectId(regId), courseType);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching evaluation name under the given course type and regulation.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//check evaluation scheme is used
router.get("/check/usage/:id", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let id = req.params.id;

        if (!id) {
            throw new error("Requested id missing.");
        }

        let result = await evaluationSchemes.checkUsage(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while checking evaluation scheme is used.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Load action items
router.get("/action/items/:id", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let id = req.params.id;
        let user = req.headers.userDetails;

        if (!id) {
            throw new Error("Requested id is missing.");
        }

        let result = await evaluationSchemes.actionItems(ObjectId(id), user.userRoles);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching action items for evaluation.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Load all evaluation scheme while creating regulation
router.get("/distinct", authorize([ROLES.A, ROLES.RF, ROLES.RA, ROLES.SF]), async function (req, res) {
    try {
        const result = await evaluationSchemes.distinct();
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching evaluation scheme name and course types.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//view evaluation scheme
router.get("/:id", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let id = req.params.id;

        if (!id) {
            throw new error("Requested id missing.");
        }
        const result = await evaluationSchemes.get(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching data from evaluation scheme.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Update evaluation scheme
router.put("/", authorize([ROLES.A, ROLES.DM]), async (req, res) => {
    try {
        let id = req.body.id;
        let userName = req.headers.userDetails.username;

        if (!id) {
            throw new Error("Requested id missing.");
        }

        let { name, courseType, markSplitUp, distributionType, CA_Components, FE_Components } = validatePayload(req.body);

        let result = await evaluationSchemes.update(ObjectId(id), name, courseType.toString().trim().toUpperCase(), distributionType, markSplitUp, CA_Components, FE_Components, userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while updating evaluation scheme.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Delete evaluation scheme
router.delete("/:id", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let id = req.params.id;
        let userName = req.headers.userDetails.username;

        if (!id) {
            throw new error("Requested id missing.");
        }

        let result = await evaluationSchemes.remove(ObjectId(id), userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while deleting evaluation scheme.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;
