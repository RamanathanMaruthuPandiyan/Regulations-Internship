import { Router } from "express";
const router = Router();

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const config = require("../config/config." + process.env.NODE_ENV);
const clientInfo = config.clientInfo;

//To get college info
router.get("/client/info", function (req, res) {
    try {
        res.send(clientInfo);
    } catch (e) {
        appLogger.error("Error while fetching client info", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;