import { Router } from "express";
import jobs from "../services/jobs.js";
import appLogger from "../logging/appLogger.js";
import { authorize, ROLES } from '../middleware/auth.js';
import { ObjectId } from "mongodb";
const router = Router();

//Table load
router.post("/pagination", authorize([ROLES.A]), async function (req, res) {
    try {
        let filter = req.body.filter || {};
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 15;
        let search = req.body.search || "";
        let sort = req.body.sort || { "dates.created": -1 };

        let result = await jobs.pagination(filter, skip, limit, search, sort);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching jobs pagination.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//View job summary
router.get("/:id", authorize([ROLES.A]), async function (req, res) {
    try {
        let id = req.params.id;

        if (!id) {
            throw new error("Requested job id missing.");
        }

        const result = await jobs.get(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching job details.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Distinct fields for filter
router.get("/distinct/:field", authorize([ROLES.A, ROLES.RF, ROLES.RA]), async function (req, res) {
    try {
        let field = req.params.field;

        if (!field) {
            throw new Error("Requested field missing.");
        }

        let result = await jobs.distinct(field);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching distinct values for filter.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;