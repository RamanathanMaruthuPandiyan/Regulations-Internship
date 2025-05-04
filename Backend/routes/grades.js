import { Router } from "express";
import appLogger from "../logging/appLogger.js";
import { ObjectId } from "mongodb";
import { authorize, ROLES } from '../middleware/auth.js';
import grades from "../services/grades.js";

const router = Router();

//Show info of the selected grades
router.post("/info", authorize([ROLES.A, ROLES.RF, ROLES.RA]), async function (req, res) {
    try {
        let gradeIds = req.body.gradeIds;

        if (!gradeIds || !gradeIds.length) {
            throw new error("Requested grade ids missing.");
        }

        gradeIds = gradeIds.map((gradeId) => ObjectId(gradeId));
        let result = await grades.explore(gradeIds);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching grade patterns for explore.", e);
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

        let result = await grades.pagination(filter, skip, limit, search, sort);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching grade patterns for pagination.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Create a grade pattern
router.post("/", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let name = req.body.name;
        let gradeType = req.body.gradeType;
        let courseType = req.body.courseType;
        let grade = req.body.grades;
        let userName = req.headers.userDetails.username;

        if (!name || !gradeType || !courseType || !grade || !grade.length) {
            throw new Error("Mandatory fields are missing.");
        }

        let result = await grades.create(name, gradeType.toString().trim().toUpperCase(), courseType.toString().trim().toUpperCase(), grade, userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while creating grade pattern.", e);
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

        let result = await grades.actionItems(ObjectId(id), user.userRoles);
        res.send(result);
    } catch (err) {
        appLogger.error("Error while fetching action items for grades.", err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});

//check usage of grades
router.get("/check/usage/:id", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let id = req.params.id;

        if (!id) {
            throw new Error("Requested id missing.");
        }

        let result = await grades.checkUsage(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while checking grade pattern is used.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Load all grades while creating regulation
router.get("/distinct", authorize([ROLES.A, ROLES.RF, ROLES.RA]), async function (req, res) {
    try {
        const result = await grades.distinct();
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching distinct grade names.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//View grade
router.get("/:id", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let id = req.params.id;

        if (!id) {
            throw new error("Requested grade id missing.");
        }

        const result = await grades.get(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching grade pattern.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//update a grade
router.put("/", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let id = req.body.id;
        let name = req.body.name;
        let gradeType = req.body.gradeType;
        let courseType = req.body.courseType;
        let grade = req.body.grades;
        let userName = req.headers.userDetails.username;

        if (!id || !name || !gradeType || !courseType || !grade || !grade.length) {
            throw new Error("Mandatory fields are missing.");
        }

        let result = await grades.update(ObjectId(id), name, gradeType.toString().trim().toUpperCase(), courseType.toString().trim().toUpperCase(), grade, userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while updating grade pattern", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Delete a grade
router.delete("/:id", authorize([ROLES.A, ROLES.DM]), async function (req, res) {
    try {
        let id = req.params.id;
        let userName = req.headers.userDetails.username;

        if (!id) {
            throw new Error("Requested id missing.");
        }

        let result = await grades.remove(ObjectId(id), userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while deleting grade pattern.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;
