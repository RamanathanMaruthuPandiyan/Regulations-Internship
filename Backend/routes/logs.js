import { Router } from "express";
import logs from "../services/logs.js";
import appLogger from "../logging/appLogger.js";
import { authorize, ROLES } from '../middleware/auth.js';
const router = Router();

//Table load
router.post("/pagination", authorize([ROLES.A]), async function (req, res) {
    try {
        let filter = req.body.filter || {};
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 15;
        let search = req.body.search || "";
        let sort = req.body.sort || { "on": -1 };

        let result = await logs.pagination(filter, skip, limit, search, sort);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching logs pagination.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Distinct fields for filter
router.get("/distinct/:field", authorize([ROLES.A]), async function (req, res) {
    try {
        let field = req.params.field;

        if (!field) {
            throw new Error("Requested field missing.");
        }

        let result = await logs.distinct(field);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching distinct values for filter.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;