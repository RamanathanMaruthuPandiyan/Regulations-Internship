import { Router } from "express";
import appLogger from "../logging/appLogger.js";
import sync from "../services/sync.js";
import { authorize, ROLES } from "../middleware/auth.js";

const router = Router();

//Sync batch years from groups
router.get("/batch/years", authorize([ROLES.A]), async function (req, res) {
    try {
        let userName = req.headers.userDetails.username;
        await sync.batchYears(res, userName);
    } catch (e) {
        appLogger.error("Error while executing sync batch years from groups.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Sync departments from groups
router.get("/departments", authorize([ROLES.A]), async function (req, res) {
    try {
        let userName = req.headers.userDetails.username;
        await sync.departments(res, userName);
    } catch (e) {
        appLogger.error("Error while executing sync departments from groups.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Sync programmes from groups
router.get("/programmes", authorize([ROLES.A]), async function (req, res) {
    try {
        let userName = req.headers.userDetails.username;
        await sync.programmes(res, userName);
    } catch (e) {
        appLogger.error("Error while executing sync programmes from groups.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;