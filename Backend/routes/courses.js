import { Router } from 'express';
const router = Router();

import { authorize, ROLES } from '../middleware/auth.js';
import { getRootLevel } from '../services/fileService.js';
import appLogger from "../logging/appLogger.js";
import courses from '../services/courses.js';
import faculty from '../services/remote/faculty.js';
import { Courses, Mapping } from "../enums/enums.js";

import { resolve } from 'path';
import { mkdirSync, existsSync } from 'fs';
import multer from 'multer';
import uuid from 'uuid-random';
import { createRequire } from "module";
import { ObjectId } from "mongodb";

const require = createRequire(import.meta.url);
const config = require('../config/config.' + process.env.NODE_ENV);
const __dirname = resolve();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, resolve(__dirname, getRootLevel(__dirname), config.paths.uploadDir));
    },
    filename: (req, file, cb) => {
        cb(null, uuid() + ".xlsx");
    }
});
const upload = multer({ storage: storage });

if (config.paths.uploadDir) {
    if (!existsSync(resolve(__dirname, getRootLevel(__dirname), config.paths.uploadDir))) {
        mkdirSync(resolve(__dirname, getRootLevel(__dirname), config.paths.uploadDir));
    }
}

//Import courses of a program under the regulation
router.post('/export/error', authorize([ROLES.A, ROLES.SF]), async function (req, res) {
    try {
        let filePath = req.body.filePath;

        if (!filePath) {
            throw new Error("Required fields are missing.");
        }

        res.sendFile(filePath);

    } catch (error) {
        appLogger.error("Error while exporting errors while importing courses.", error);
        res.status("500").send({ name: error.name, message: error.message });
    }
});

//Load all dropdowns while adding a course
router.post('/fetch/add', authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res) {
    try {
        let regId = req.body.regId;
        let prgmId = req.body.prgmId;

        if (!regId || !prgmId) {
            throw new Error("Mandatory fields are missing.");
        }

        let result = await courses.fetchDetailsForAdd(ObjectId(regId), ObjectId(prgmId));
        res.send(result);

    } catch (error) {
        appLogger.error("Error while fetching data for dropdown while adding a course.", error);
        res.status(500).send({ name: error.name, message: error.message });
    }
});

//Import courses of a program under a regulation
router.post('/import', authorize([ROLES.A, ROLES.SF]), upload.single("coursesImport"), courses.validateUser, async function (req, res) {
    try {
        let regulationId = req.body.regulationId;
        let programmeId = req.body.prgmId;
        let userName = req.headers.userDetails.username;
        if (!regulationId || !programmeId || !req.file || !req.file.filename) {
            throw new Error("Required fields are missing.");
        }

        await courses.idExistValidation(ObjectId(regulationId), ObjectId(programmeId));

        let path = resolve(__dirname, getRootLevel(__dirname), config.paths.uploadDir, req.file.filename);

        if (!existsSync(path)) {
            throw new Error("File not found in the directory.");
        }

        let result = await courses.importDetails(path, ObjectId(regulationId), ObjectId(programmeId), req.file.filename, userName);
        res.send(result);
    } catch (error) {
        appLogger.error("Error while importing courses", error);
        res.status("500").send({ name: error.name, message: error.message, filePath: error.filePath });
    }
});

//Export courses of a program under a regulation
router.post('/export', authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2]), async function (req, res) {
    try {
        let regulationId = req.body.regulationId;
        let prgmId = req.body.prgmId;
        let userName = req.headers.userDetails.username;

        if (!regulationId || !prgmId) {
            throw new Error("Mandatory fields are missing.");
        }
        let response = await courses.exportToExcel(ObjectId(regulationId), ObjectId(prgmId), userName);
        res.sendFile(response);

    } catch (error) {
        appLogger.error("Error while exporting Programme Schemes", error);
        res.status(500).send({ name: error.name, message: error.message });
    }
});

//Load prerequisites based on semester under a regulation and a programme
router.post('/prerequisites', authorize([ROLES.A, ROLES.SF]), async function (req, res) {
    try {
        let semester = req.body.semester;
        let regId = req.body.regId;
        let prgmId = req.body.prgmId;
        let id = req.body.id;

        if (!regId || !prgmId) {
            throw new Error("Mandatory fields are missing.");
        }

        if (id) {
            id = ObjectId(id);
        }

        let result = await courses.getPrerequisites(ObjectId(regId), ObjectId(prgmId), semester, id);
        res.send(result);

    } catch (error) {
        appLogger.error("Error while fetching prerequisites courses codes.", error);
        res.status(500).send({ name: error.name, message: error.message });
    }
});

//Add course
router.post("/", authorize([ROLES.A, ROLES.SF]), courses.validateUser, async function (req, res) {
    try {
        let userName = req.headers.userDetails.username;
        let data = courses.validatePayload(req.body, "ADD");
        let result = await courses.create(data, userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while adding course.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Get bulk actions based on user role
router.post("/bulk/action/items/:prgmId", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res) {
    try {
        let prgmId = req.params.prgmId;
        let selectedItems = req.body.selectedItems;
        let user = req.headers.userDetails;

        if (!prgmId || !selectedItems || !selectedItems.length) {
            throw new Error("Mandatory fields are missing.");
        }
        selectedItems = selectedItems.map(id => ObjectId(id));
        let result = await courses.bulkActionItems(prgmId, selectedItems, user);
        res.send(result);
    } catch (err) {
        appLogger.error("Error while fetching bulk action items for courses.", err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});

router.get("/is/freeze/active/:semester/:regId/:prgmId", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.PU, ROLES.OA]), async function (req, res) {
    try {
        let semester = req.params.semester;
        let regulationId = req.params.regId;
        let prgmId = req.params.prgmId;
        let user = req.headers.userDetails;
        if (!semester || !regulationId || !prgmId) {
            throw new Error("Mandatory fields are missing.");
        }

        let result = await courses.setIsFreezeActive(ObjectId(regulationId), ObjectId(prgmId), parseInt(semester), user.userRoles);
        res.send(result);
    } catch (e) {
        appLogger.error("Error occurred while checking for confirmed courses under the semester.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.get("/access/outcomes/:regId/:prgmId", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.PU, ROLES.OA]), async function (req, res) {
    try {
        let regulationId = req.params.regId;
        let prgmId = req.params.prgmId;
        let user = req.headers.userDetails;
        if (!regulationId || !prgmId) {
            throw new Error("Mandatory fields are missing.");
        }

        let result = await courses.getOutcomesAccess(ObjectId(regulationId), ObjectId(prgmId), user.username, user.userRoles);
        res.send(result);
    } catch (e) {
        appLogger.error("An error occurred while checking access for the Outcomes.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//To get scheme import template
router.get("/scheme/template/:regulationId/:programmeId", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2]), async function (req, res) {
    try {
        let { regulationId, programmeId } = req.params;

        if (!regulationId || !programmeId) {
            throw new Error("Mandatory fields are missing.");
        }

        let result = await courses.getTemplate(ObjectId(regulationId), ObjectId(programmeId));
        res.sendFile(result);
    } catch (e) {
        appLogger.error("Error while fetching programme scheme template.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//To get CO-PO mapping for a course
router.get("/co/po/mapping/:id", authorize([ROLES.A, ROLES.FA, ROLES.OA, ROLES.PU, ROLES.SF, ROLES.SA1, ROLES.SA2]), async function (req, res) {
    try {
        let id = req.params.id;
        if (!id) {
            throw new Error("Mandatory fields are missing.");
        }

        let result = await courses.getMapping(ObjectId(id));
        res.send(result);

    } catch (e) {
        appLogger.error("Error while fetching CO-PO mapping for the course.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//To get courses for co po mapping
router.get("/mapping/:programmeRegulationId", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res) {
    try {
        let programmeRegulationId = req.params?.programmeRegulationId;
        let user = req.headers.userDetails;

        if (!programmeRegulationId) {
            throw new Error("Mandatory fields are missing.");
        }

        let result = await courses.getCoursesForMapping(ObjectId(programmeRegulationId), user.userRoles, user.username);
        res.send(result);

    } catch (e) {
        appLogger.error("Error while fetching programme schemes.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//To get offering department of a course
router.get('/offering/dept/:id', authorize([ROLES.A, ROLES.SF]), async function (req, res) {
    try {
        let id = req.params.id;

        if (!id) {
            throw new Error("Mandatory fields are missing.");
        }

        let result = await courses.getOfferingDept(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching offering department for the course.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Load action items
router.get("/action/items/:id", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res) {
    try {
        let id = req.params.id;
        let user = req.headers.userDetails;

        if (!id) {
            throw new Error("Requested id is missing.");
        }

        let result = await courses.actionItems(ObjectId(id), user);
        res.send(result);
    } catch (err) {
        appLogger.error("Error while fetching action items for courses.", err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});

//Load action items for course outcomes
router.get("/co/action/items/:id", authorize([ROLES.A, ROLES.FA, ROLES.OA, ROLES.PU, ROLES.SF, ROLES.SA1, ROLES.SA2]), async function (req, res) {
    try {
        let id = req.params.id;
        let user = req.headers.userDetails;

        if (!id) {
            throw new Error("Requested id is missing.");
        }

        let result = await courses.coActionItems(ObjectId(id), user.username, user.userRoles);
        res.send(result);
    } catch (err) {
        appLogger.error("Error while fetching action items for course outcomes.", err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});

//Get attachments of course
router.get("/attachments/:courseId", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2]), async function (req, res) {
    try {
        let courseId = req.params.courseId;

        if (!courseId) {
            throw new Error("Requested field missing.");
        }

        let { attachment } = await courses.get(courseId, { attachment: 1 });
        res.send(attachment);
    } catch (e) {
        appLogger.error("Error while fetching attachments.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Get course outcomes of a course
router.get("/outcomes/:courseId", authorize([ROLES.A, ROLES.FA, ROLES.OA, ROLES.PU, ROLES.SF, ROLES.SA1, ROLES.SA2]), async function (req, res) {
    try {
        let courseId = req.params.courseId;

        if (!courseId) {
            throw new Error("Mandatory fields missing.");
        }

        let result = await courses.getOutcomes(ObjectId(courseId));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching course outcomes.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Get course outcome uploaders
router.get("/co/uploaders", authorize([ROLES.A, ROLES.SA1]), async function (req, res) {
    try {
        let result = await faculty.filter(false);
        res.status(200).send(result);
    } catch (e) {
        appLogger.error("Error while fetching faculty details for dropdown.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//View programme scheme
router.get("/:regId/:prgmId", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res, next) {
    try {
        let regulationId = req.params.regId;
        let programmeId = req.params.prgmId;
        let user = req.headers.userDetails;

        if (!regulationId || !programmeId) {
            throw new Error("Mandatory fields are missing.");
        }

        let result = await courses.viewCourses(ObjectId(regulationId), ObjectId(programmeId), user);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching course under this regulation and programme.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Get Constants
router.get("/constants", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res) {
    try {
        const result = await courses.getConstants();
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching constant values.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//View course
router.get("/:id", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res) {
    try {
        let id = req.params.id;
        if (!id) {
            throw new error("Requested course id missing.");
        }
        const result = await courses.get(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching course.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});


//Change CO mapping status
router.put("/mapping/status/:id", authorize([ROLES.A, ROLES.OA, ROLES.FA]), async function (req, res) {
    try {
        let id = req.params.id;
        let destination = req.body.destination;
        let userName = req.headers.userDetails.name ? (req.headers.userDetails.preferred_username + " - " + req.headers.userDetails.name) : req.headers.userDetails.preferred_username;
        let userRoles = req.headers.userDetails.userRoles;
        let reason = req.body.reason;

        if (!id || !destination) {
            throw new Error("Detail missing to change status.");
        }

        if (destination == Mapping.status.REQUESTED_CHANGES && !reason) {
            throw new Error(`Since changing status to ${Mapping.status.values[destination]}, need to provide the reason or mention what change have to be done.`);
        }

        let result = await courses.changeMappingStatus(ObjectId(id), destination, userRoles, userName.toUpperCase(), reason);
        res.send(result);
    } catch (err) {
        appLogger.error("Error while changing mapping status", err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});

//Update co uploaders
router.put('/co/uploader/:courseId', authorize([ROLES.A, ROLES.SA1]), async (req, res) => {
    try {
        let facultyIds = req.body.facultyIds || [];
        let courseId = req.params.courseId;

        if (!facultyIds.length || !courseId) {
            throw new Error("Mandatory fields are missing.");
        }

        let response = await courses.assignCoUploaders(ObjectId(courseId), facultyIds);
        res.send(response);
    } catch (e) {
        appLogger.error("Error while assigning co uploaders", e);
        res.status(500).send({ error: e.name, message: e.message });
    }
});

//Update offering department
router.put("/offering/department", authorize([ROLES.A, ROLES.SF]), courses.validateUser, async function (req, res, next) {
    try {
        let deptName = req.body.deptName;
        let deptCategory = req.body.deptCategory;
        let items = req.body.items;
        let { isAdmin, username } = req.headers.userDetails;

        if (!deptCategory || !deptName || !items) {
            throw new Error("Mandatory fields missing.");
        }

        let result = await courses.updateOfferingDepartment(deptName, deptCategory, items, username, isAdmin);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while updating the offering department for the selected courses.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//State change - Send for approval, approve, requested changes, confirm
router.put("/status", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2]), courses.validateUser, async function (req, res, next) {
    try {
        let destination = req.body.destination;
        let regulationId = req.body.regulationId;
        let prgmId = req.body.prgmId;
        let user = req.headers.userDetails;
        let userName = req.headers.userDetails.name ? (req.headers.userDetails.preferred_username + " - " + req.headers.userDetails.name) : req.headers.userDetails.preferred_username;
        let userId = req.headers.userDetails.preferred_username.toUpperCase();
        let items = req.body.items;
        let reason = req.body.reason;

        if (!destination || !user || !items || !regulationId || !prgmId) {
            throw new Error("Mandatory fields missing.");
        }

        if (destination == Courses.status.REQUESTED_CHANGES && !reason) {
            throw new Error(`Since changing status to ${Courses.status.values[destination]}, need to provide the reason or mention what change have to be done.`);
        }
        let result = await courses.changeStatus(items, ObjectId(regulationId), ObjectId(prgmId), destination, user.userRoles, userName.toUpperCase(), userId, reason);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while changing the status for the selected courses.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Upload syllabus for a course
router.put("/upload", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2]), courses.validateUser, async function (req, res) {
    try {
        let courseId = req.body.courseId;
        let attachments = req.body.attachments;

        if (!courseId || !attachments || !(Object.keys(attachments).length)) {
            throw new Error("Requested field missing.");
        }

        let result = await courses.uploadDoc(ObjectId(courseId), attachments);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while uploading the file.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Update CO for a course
router.put("/outcomes", authorize([ROLES.A, ROLES.FA]), async function (req, res) {
    try {
        let { courseId, courseOutcomes } = req.body;
        let userName = req.headers.userDetails.username;
        if (!courseId || !courseOutcomes || !(courseOutcomes instanceof Array) || !courseOutcomes.length) {
            throw new Error("Mandatory fields missing.");
        }

        let result = await courses.updateCO(ObjectId(courseId), courseOutcomes, userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while updating course outcomes.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//To map CO with PO
router.put("/mapping", authorize([ROLES.A, ROLES.FA]), async function (req, res) {
    try {
        let { courseId, mapping } = req.body;
        let userName = req.headers.userDetails.username;
        if (!courseId || !mapping || !(Object.keys(mapping).length)) {
            throw new Error("Mandatory fields are missing.");
        }
        let result = await courses.coPoMapping(ObjectId(courseId), mapping, userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while mapping course outcomes and programme outcomes.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Update a course
router.put("/", authorize([ROLES.A, ROLES.SF]), courses.validateUser, async function (req, res, next) {
    try {

        let { isAdmin, username } = req.headers.userDetails;
        let data = courses.validatePayload(req.body, "EDIT");
        let result = await courses.update(data, username, isAdmin);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while updating course.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

//Delete a course
router.delete("/:id", authorize([ROLES.A, ROLES.SF]), courses.validateUser, async function (req, res, next) {
    try {
        let userName = req.headers.userDetails.username;
        let id = req.params.id;

        if (!id) {
            throw new Error("Requested id missing.");
        }

        let result = await courses.remove(ObjectId(id), userName);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while deleting course.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;