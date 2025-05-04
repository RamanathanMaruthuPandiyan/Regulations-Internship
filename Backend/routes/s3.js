import { Router } from 'express';
const router = Router();
import { authorize, ROLES } from '../middleware/auth.js';
import s3Services from '../services/s3.js';
import appLogger from "../logging/appLogger.js";

//To get upload url for a file
router.get('/upload/url', authorize([ROLES.RF, ROLES.SF, ROLES.RA, ROLES.SA1, ROLES.SA2, ROLES.A]), async function (req, res) {
    try {
        const query = req.query;
        if (!query) {
            throw new Error("Mandatory Fields are Missing ");
        }
        let result = await s3Services.getS3SignedUrl(query);
        res.json(result);
    } catch (err) {
        appLogger.error("Error while fetching upload url", err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});

//To get download url
router.get('/download/url', authorize([ROLES.RF, ROLES.SF, ROLES.RA, ROLES.SA1, ROLES.SA2, ROLES.A]), async function (req, res) {
    try {
        const query = req.query;
        if (!query) {
            throw new Error("Mandatory Fields are Missing ");
        }
        let result = await s3Services.getSignedUrlForGetObject(query);
        res.json({ "signedUrl": result });
    } catch (err) {
        appLogger.error("Error while fetching download url", err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});

export default router;