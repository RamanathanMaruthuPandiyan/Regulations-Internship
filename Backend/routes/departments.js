import { Router } from "express";
import appLogger from "../logging/appLogger.js";
import { authorize, ROLES } from '../middleware/auth.js';
import departments from "../services/departments.js";

const router = Router();

router.get("/distinct", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.UM, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res, next) {
    try {
        let result = await departments.distinct();
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching distinct department details.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;