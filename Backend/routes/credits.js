import { Router } from "express";
import appLogger from "../logging/appLogger.js";
import credits from "../services/credits.js";
import { authorize, ROLES } from '../middleware/auth.js';
import { ObjectId } from "mongodb";

const router = Router();

function validate(name, lecture, tutorial, practical, credits) {
    try {
        if (!name || !Number.isFinite(lecture) || !Number.isFinite(tutorial) ||
            !Number.isFinite(practical) || !Number.isFinite(credits)) {
            throw new Error("Mandatory fields are missing.");
        }

        if (credits % 0.5 != 0) {
            throw new Error("Credits can only be in increments of 0.5.");
        }

    } catch (e) {
        throw e;
    }
}

//Load info
router.post("/info", authorize([ROLES.A, ROLES.RF, ROLES.RA]), async function (req, res) {
    try {
        let creditIds = req.body.creditIds;

        if (!creditIds || !creditIds.length) {
            throw new error("Requested credit ids missing.");
        }

        creditIds = creditIds.map((creditId) => ObjectId(creditId));
        let result = await credits.explore(creditIds);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching credit patterns for explore.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Table load
router.post("/pagination", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let filter = req.body.filter || {};
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 15;
        let search = req.body.search || "";
        let sort = req.body.sort || { _id: -1 };

        let result = await credits.pagination(filter, skip, limit, search, sort);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching data for pagination.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Create new credit pattern
router.post("/", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let name = req.body.name;
        let lecture = req.body.lecture;
        let tutorial = req.body.tutorial;
        let practical = req.body.practical;
        let credit = req.body.credits;
        let userName = req.headers.userDetails.username;

        validate(name, lecture, tutorial, practical, credit);

        let result = await credits.create(name.toString().trim().toUpperCase(), lecture, tutorial, practical, credit, userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while creating credit pattern.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Check a credit pattern is used
router.get("/check/usage/:id", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let id = req.params.id;

        if (!id) {
            throw new error("Requested id missing.");
        }

        let result = await credits.checkUsage(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while checking credit is used.", e);
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

        let result = await credits.actionItems(ObjectId(id), user.userRoles);
        res.send(result);
    } catch (err) {
        appLogger.error("Error while fetching action items for credits.", err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});

//Get credit names
router.get("/distinct", authorize([ROLES.A, ROLES.RF, ROLES.RA, ROLES.SF]), async function (req, res) {
    try {
        const result = await credits.distinct();
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching credits names.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//View credit pattern
router.get("/:id", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let id = req.params.id;
        if (!id) {
            throw new error("Requested id is missing.");
        }
        const result = await credits.get(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching data from credits.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Update a credit pattern
router.put("/", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let name = req.body.name;
        let lecture = req.body.lecture;
        let tutorial = req.body.tutorial;
        let practical = req.body.practical;
        let credit = req.body.credits;
        let id = req.body.id;
        let userName = req.headers.userDetails.username;

        validate(name, lecture, tutorial, practical, credit);

        if (!id) {
            throw new Error("Missing id in the input payload.");
        }

        let result = await credits.update(ObjectId(id), name.toString().trim().toUpperCase(), lecture, tutorial, practical, credit, userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while updating credits", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Delete a credit pattern
router.delete("/:id", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let id = req.params.id;
        let userName = req.headers.userDetails.username;

        if (!id) {
            throw new error("Requested id missing.");
        }

        let result = await credits.remove(ObjectId(id), userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while deleting credits.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;
