import { Router } from "express";
import users from "../services/users.js";
import appLogger from "../logging/appLogger.js";
import faculty from "../services/remote/faculty.js";
import { ROLES, authorize } from "../middleware/auth.js";
import { Users } from '../utilities/keycloak.js';

const router = Router();

//Table data
router.post("/pagination", authorize([ROLES.A, ROLES.UM]), async function (req, res) {
    try {
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 15;
        let search = req.body.search || "";
        let sort = req.body.sort || { "_id": -1 };

        let result = await users.pagination(skip, limit, search, sort);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching data for pagination.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Add roles for a user in regulation client
router.post('/', authorize([ROLES.A, ROLES.UM]), async (req, res) => {
    try {
        let userDetails = req.body || {};
        userDetails = users.validate(userDetails);
        let response = await Users.addUser(userDetails);
        res.send(response);
    } catch (e) {
        appLogger.error("Error while creating user account : %s", JSON.stringify(e));
        res.status(500).send({ error: e.name, message: e.message });
    }
});

//Get roles can be assigned via application
router.get('/user/roles', authorize([ROLES.A, ROLES.UM]), async (req, res) => {
    try {
        let response = Users.roles();
        res.send(response);
    } catch (e) {
        appLogger.error("Error while fetching possible role : %s", JSON.stringify(e));
        res.status(500).send({ error: e.name, message: e.message });
    }
});

//Get all users from FIS
router.get("/filter", authorize([ROLES.A, ROLES.UM]), async (req, res) => {
    try {
        let result = await faculty.filter(true);
        res.status(200).send(result);
    } catch (e) {
        appLogger.error("Error while fetching faculty details for dropdown.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//View user
router.get("/:userId", authorize([ROLES.A, ROLES.UM]), async (req, res) => {
    try {
        let { userId } = req.params;
        let result = await users.get(userId.toString().trim().toUpperCase());
        res.status(200).send(result);
    } catch (e) {
        appLogger.error("Error while fetching user data.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Update roles of a user
router.put('/', authorize([ROLES.A, ROLES.UM]), async (req, res) => {
    try {
        let userDetails = req.body || {};
        userDetails = users.validate(userDetails);
        let response = await Users.update(userDetails);
        res.send(response);
    } catch (e) {
        appLogger.error("Error while updating user accounts : %s", JSON.stringify(e));
        res.status(500).send({ error: e.name, message: e.message });
    }
});

//Remove all roles of a user
router.delete('/:userId', authorize([ROLES.A, ROLES.UM]), async (req, res) => {
    try {
        let userId = req.params.userId;

        if (!userId) {
            throw new Error("User id not provided");
        }

        let response = await Users.remove(userId);
        res.send(response);
    } catch (e) {
        appLogger.error("Error while removing all roles for a user : %s", JSON.stringify(e));
        res.status(500).send({ error: e.name, message: e.message });
    }
});

export default router;