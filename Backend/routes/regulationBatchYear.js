import { Router } from "express";
import appLogger from "../logging/appLogger.js";
import regulationBatchYear from "../services/regulationBatchYear.js";
import { authorize, ROLES } from '../middleware/auth.js';
import { ObjectId } from "mongodb";

const router = Router();

//List regulations while assigning
router.post("/list/regulations", authorize([ROLES.A, ROLES.RM]), async function (req, res) {
    try {
        let programmes = req.body.programmes || [];

        if (!programmes.length) {
            throw new Error("Mandatory fields missing.");
        }

        programmes = programmes.map((programme) => ({ semester: programme.semester, prgmId: ObjectId(programme.prgmId) }));

        let result = await regulationBatchYear.fetchRegulationsForPrgmBatchYears(programmes);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching the regulation for the given batch year.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Table data
router.post("/pagination", authorize([ROLES.A, ROLES.RM]), async function (req, res) {
    try {
        let filter = req.body.filter || {};
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 15;
        let search = req.body.search || "";
        let sort = req.body.sort || { _id: -1 };

        let result = await regulationBatchYear.pagination(filter, skip, limit, search, sort);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching data for pagination.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Re-assign to a different regulation
router.post("/reassign", authorize([ROLES.A, ROLES.RM]), async function (req, res) {
    try {
        let regulationId = req.body.regulationId;
        let userName = req.headers.userDetails.username;
        let id = req.body.id;

        if (!regulationId || !id) {
            throw new Error("Mandatory fields missing.");
        }

        let result = await regulationBatchYear.reassign(ObjectId(regulationId), ObjectId(id), userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while reassigning regulation.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Assign a regulation
router.post("/assign", authorize([ROLES.A, ROLES.RM]), async function (req, res) {
    try {
        let { regulationId, batches } = req.body;
        let userName = req.headers.userDetails.username;

        if (!regulationId || !batches || !batches.length) {
            throw new Error("Mandatory fields missing.");
        }

        batches = batches.map((batch) => ({ ...batch, batchIds: batch.batchIds.map((id) => ObjectId(id)), prgmId: ObjectId(batch.prgmId) }));

        let result = await regulationBatchYear.assign(ObjectId(regulationId), batches, userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while assigning a regulation.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.get("/check/group/exist/:id", authorize([ROLES.A, ROLES.RM]), async function (req, res) {
    try {
        let id = req.params.id;

        if (!id) {
            throw new Error("Invalid id received.");
        }

        let result = await regulationBatchYear.checkGroupExistBeforeReasign(ObjectId(id));

        res.send(result);
    } catch (e) {
        appLogger.error("Error while checking for group exist for the given regulation batch year id.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Load unassigned prgms while performing regulation mapping
router.get("/unassigned/prgms/:academicTermId", authorize([ROLES.A, ROLES.RM]), async function (req, res) {
    try {
        let academicTermId = req.params.academicTermId;
        if (!academicTermId) {
            throw new Error("Academic term id missing.");
        }
        let result = await regulationBatchYear.getPendingPrgms(ObjectId(academicTermId));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching regulation unassigned programmes.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.get("/active/academic/terms", authorize([ROLES.A, ROLES.RM]), async function (req, res, next) {
    try {
        let result = await regulationBatchYear.fetchActiveAcademicTerms();
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching active academic terms.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Load Data For Filters
router.get("/filter/:field", authorize([ROLES.A, ROLES.RM]), async function (req, res) {
    try {
        let field = req.params.field;

        if (!field) {
            throw new Error("Missing field while fetching filter.");
        }

        let result = await regulationBatchYear.filterData(field);
        res.send(result);

    } catch (e) {
        appLogger.error("Error while fetching data for filters.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Fetch regulations while re-assigning other than current regulation
router.get("/:id", authorize([ROLES.A, ROLES.RM]), async function (req, res, next) {
    try {
        let regBatchYearId = req.params.id;

        if (!regBatchYearId) {
            throw new Error("Mandatory fields missing.");
        }

        let result = await regulationBatchYear.fetchPossibleRegulations(ObjectId(regBatchYearId));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching regulations while reassigning.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Re-assign to a regulation to next semester
router.get("/execute/:id", authorize([ROLES.A]), async function (req, res) {
    try {
        let id = req.params.id;
        if (!id) {
            throw new Error("Mandatory fields missing.")
        }

        regulationBatchYear.execute(ObjectId(id));

        res.send("Process initiated to move regulation next semester. Please check the job status after sometime.");

    } catch (e) {
        appLogger.error("Error while reassigning regulation to next semester.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;
