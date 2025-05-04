import { Router } from "express";
import { authorize, ROLES } from "../middleware/auth.js"
import appLogger from "../logging/appLogger.js";
import enums from "../services/enums.js";
const router = Router();

//Get enums values by name : regulations , courses , actionItems, programmes
router.get("/:name", authorize([ROLES.A, ROLES.DM, ROLES.RA, ROLES.RF, ROLES.SA1, ROLES.SA2, ROLES.SF, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res) {
    try {
        let name = req.params.name;

        if (!name) {
            throw new Error("Mandatory field missing.")
        }

        let result = enums.getEnums(name);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching enum.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});



export default router;
