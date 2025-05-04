import { Router } from "express";
import appLogger from "../logging/appLogger.js";
import attributes from "../services/attributes.js";
import { authorize, ROLES } from '../middleware/auth.js';
const router = Router();

//Table load
router.post("/pagination", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let filter = req.body.filter || {};
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 15;
        let search = req.body.search || "";
        let sort = req.body.sort || { "values": 1 };

        let result = await attributes.pagination(filter, skip, limit, search, sort);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching attributes pagination.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Add value to an attribute
router.post("/", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        const displayName = req.body.displayName;
        const name = req.body.name;
        const shortName = req.body.shortName;
        const userName = req.headers.userDetails.username;

        if (!displayName || !name || !shortName) {
            throw new Error("Missing required fields.");
        }
        const result = await attributes.addValue(displayName, name.toString().trim().toUpperCase(), shortName.toString().trim().toUpperCase(), userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while adding value for attribute.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Get attribute values as enum
router.get('/enums/by/:name', authorize([ROLES.A, ROLES.DM, ROLES.SF, ROLES.SA1, ROLES.SA2]), async function (req, res) {
    try {
        let name = req.params.name || "";
        if (!name) {
            throw new Error("Requested name is missing.");
        }
        let result = await attributes.getEnumByName(name, "value");
        res.send(result);
    }
    catch (err) {
        appLogger.error(`Error while fetching enum by name`, err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});

//Get all values of an attribute
router.get("/distinct/:name", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let name = req.params.name;
        if (!name) {
            throw new Error("Requested name is missing.");
        }
        const result = await attributes.distinctValues("values", { name });
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching attribute values.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Get all attribute names
router.get("/distinct", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        const result = await attributes.distinctNames();
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching attribute names.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Update an attribute value
router.put("/", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        const name = req.body.name;
        const oldValue = req.body.oldValue;
        const newValue = req.body.newValue;

        if (!name || !oldValue || !newValue) {
            throw new Error("Missing required fields while updating value.");
        }

        const result = await attributes.updateValue(name, oldValue.toString().trim().toUpperCase(), newValue.toString().trim().toUpperCase());
        res.send(result);
    } catch (e) {
        appLogger.error("Error while updating value", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Delete an attribute
router.delete("/", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        const name = req.body.name;
        const value = req.body.value;

        if (!name || !value) {
            throw new Error("Missing required fields while deleting value.");
        }

        const result = await attributes.deleteValue(name, value.toString().trim().toUpperCase());
        res.send(result);
    } catch (e) {
        appLogger.error("Error while deleting value.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;
