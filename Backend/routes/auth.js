import { Router } from 'express';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const config = require('../config/config.' + process.env.NODE_ENV);

const router = Router();

//To get authServerConfig
router.get('/config', function (req, res, next) {
    try {
        let authServerConfig = {
            clientId: config.authServerConfig.clientId,
            baseUrl: config.authServerConfig.baseUrl,
            realmName: config.authServerConfig.realmName
        }
        res.send(authServerConfig);
    } catch (e) {
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;