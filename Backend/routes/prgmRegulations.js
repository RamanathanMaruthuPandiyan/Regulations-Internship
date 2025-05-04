import { Router } from "express";
import appLogger from "../logging/appLogger.js";
import { ObjectId } from "mongodb";
import { authorize, ROLES } from '../middleware/auth.js';
import { Mapping } from "../enums/enums.js";
import prgmRegulations from "../services/prgmRegulations.js";
import regulations from "../services/regulations.js";
import { booleanSet } from "../constants.js";

const router = Router();

//Table load
router.post("/pagination", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async (req, res) => {
	try {
		let regulationId = req.body.regulationId;
		let filter = req.body.filter || {};
		let skip = req.body.skip || 0;
		let limit = req.body.limit || 15;
		let search = req.body.search || "";
		let sort = req.body.sort || { _id: 1 };

		if (!regulationId) {
			throw new Error("Requested regulation id missing.");
		}

		let result = await prgmRegulations.pagination(ObjectId(regulationId), filter, skip, limit, search, sort);
		res.send(result);

	} catch (e) {
		appLogger.error("Error while fetching programmes.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Show distinct programme names in a department
router.post("/distinct", authorize([ROLES.A, ROLES.RF, ROLES.RA, ROLES.UM]), async function (req, res) {
	try {
		let departments = req.body.departments;
		departments = departments.map((departmentId) => ObjectId(departmentId));
		let result = await prgmRegulations.distinct(departments);
		res.send(result);
	} catch (e) {
		appLogger.error("Error while fetching programmes.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Load programme basic info
router.get("/basic/info/:regId/:prgmId", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res, next) {
	try {
		let regulationId = req.params.regId;
		let programmeId = req.params.prgmId;

		let result = await prgmRegulations.basicInfo(ObjectId(regulationId), ObjectId(programmeId));
		res.send(result)
	} catch (e) {
		appLogger.error("Error while fetching basic info of programmes.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Load action items
router.get("/po/action/items/:id", authorize([ROLES.A, ROLES.PU, ROLES.FA, ROLES.OA, ROLES.SF, ROLES.SA1, ROLES.SA2]), async function (req, res) {
	try {
		let id = req.params.id;
		let user = req.headers.userDetails;

		if (!id) {
			throw new Error("Missing programme regulation id.");
		}

		let result = await prgmRegulations.actionItems(ObjectId(id), user.username, user.userRoles);
		res.send(result);
	} catch (err) {
		appLogger.error("Error while fetching action items.", err);
		res.status(500).send({ name: err.name, message: err.message });
	}
});

//Load educational objectives of a programme
router.get("/educational/objectives/:id", authorize([ROLES.A, ROLES.PU, ROLES.FA, ROLES.OA, ROLES.SF, ROLES.SA1, ROLES.SA2]), async function (req, res) {
	try {
		let id = req.params.id;
		if (!id) {
			throw new Error("Mandatory fields missing.");
		}

		let { peo } = await prgmRegulations.getOutcomes(ObjectId(id), { peo: 1 });
		res.send(peo);
	} catch (e) {
		appLogger.error("Error while fetching programme educational objectives.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Load programme specific objectives of a programme
router.get("/specific/objectives/:id", authorize([ROLES.A, ROLES.OA, ROLES.PU, ROLES.FA, ROLES.SF, ROLES.SA1, ROLES.SA2]), async function (req, res) {
	try {
		let id = req.params.id;
		if (!id) {
			throw new Error("Mandatory fields missing.");
		}

		let { pso } = await prgmRegulations.getOutcomes(ObjectId(id), { pso: 1 });
		res.send(pso);
	} catch (e) {
		appLogger.error("Error while fetching programme specific objectives.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Get applicable programmes of user
router.get("/allowed/programmes", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res) {
	try {
		let userDetails = req.headers.userDetails;
		let result = await prgmRegulations.allowedPrgms(userDetails.username);
		res.send(result);
	} catch (e) {
		appLogger.error("Error while fetching user's allowed programmes.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Load programme outcomes
router.get("/outcomes/:id", authorize([ROLES.A, ROLES.PU, ROLES.OA, ROLES.FA, ROLES.SF, ROLES.SA1, ROLES.SA2]), async function (req, res) {
	try {
		let id = req.params.id;
		if (!id) {
			throw new Error("Mandatory fields missing.");
		}

		let result = await prgmRegulations.getOutcomes(ObjectId(id), { po: 1, pso: 1, poStatus: 1, reason: 1 });
		res.send(result);
	} catch (e) {
		appLogger.error("Error while fetching programme outcomes.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Load distinct fields for filters
router.get("/distinct", authorize([ROLES.A, ROLES.RF, ROLES.RA, ROLES.UM, ROLES.RM]), async function (req, res) {
	try {
		let result = await prgmRegulations.distinct();
		res.send(result);
	} catch (e) {
		appLogger.error("Error while fetching programmes.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Load Data For Filters
router.get("/filter/:regId", authorize([ROLES.A, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res) {
	try {
		let regId = req.params.regId;

		if (!regId) {
			throw new Error("Missing regulation id while fetching filter.");
		}

		let result = await prgmRegulations.filterData(ObjectId(regId));
		res.send(result);

	} catch (e) {
		appLogger.error("Error while fetching data for filters.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//To show all approved regulation names with year and version for clone
router.get("/approved/:regulationId/:programmeId", authorize([ROLES.A, ROLES.RF, ROLES.SF, ROLES.SA1, ROLES.SA2, ROLES.FA, ROLES.OA, ROLES.PU]), async function (req, res) {
	try {

		let programmeId = req.params?.programmeId;
		let regulationId = req.params?.regulationId;
		if (!regulationId || !programmeId) {
			throw new Error("Mandatory fields missing.");
		}

		let result = await regulations.fetchApprovedRegulations(ObjectId(regulationId), ObjectId(programmeId));
		res.send(result);
	} catch (e) {
		appLogger.error("Error while fetching approved regulation names for clone.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Update course code substring
router.put("/clone/:prgmRegId", authorize([ROLES.A, ROLES.SF]), async function (req, res) {
	try {
		let prgmRegId = req.params?.prgmRegId;
		let regulationId = req.body?.regulationId;
		let username = req.headers.userDetails.username;

		if (!regulationId || !prgmRegId) {
			throw new Error("Mandatory fields missing.");
		}

		let result = await prgmRegulations.clone(ObjectId(regulationId), ObjectId(prgmRegId), username);
		res.send(result);
	} catch (e) {
		appLogger.error("Error while cloning courses.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Update course code substring
router.put("/course/code/substring", authorize([ROLES.A, ROLES.SF]), async function (req, res) {
	try {
		let regulationId = req.body.regulationId;
		let prgmId = req.body.prgmId;
		let courseCodeSubStr = req.body.courseCodeSubStr;
		let username = req.headers.userDetails.username;
		let isAdmin = req.headers.userDetails.isAdmin;

		if (!regulationId || !prgmId || !courseCodeSubStr) {
			throw new Error("Mandatory fields missing.");
		}

		let result = await prgmRegulations.courseCodeSubstring(ObjectId(regulationId), ObjectId(prgmId), courseCodeSubStr.toString().trim().toUpperCase(), username, isAdmin);
		res.send(result);
	} catch (e) {
		appLogger.error("Error while adding course code sub string.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Update minimum credits to be earned
router.put("/minimum/credits", authorize([ROLES.A, ROLES.SF]), async (req, res) => {
	try {
		let regulationId = req.body.regulationId;
		let prgmId = req.body.prgmId;
		let isLateral = req.body.isLateral;
		let regularCredits = req.body.regularCredits;
		let lateralCredits = req.body.lateralCredits;
		let username = req.headers.userDetails.username;
		let isAdmin = req.headers.userDetails.isAdmin;

		if (!regulationId || !prgmId || !booleanSet.has(isLateral) || !regularCredits) {
			throw new Error("Mandatory fields missing.");
		}

		if (isLateral && !lateralCredits) {
			throw new Error("The lateral entry is enabled for this programme, but lateral credits are missing.");
		}

		let result = await prgmRegulations.minimumCredits(ObjectId(regulationId), ObjectId(prgmId), isLateral, regularCredits, lateralCredits, username, isAdmin);
		res.send(result);
	} catch (e) {
		appLogger.error("Error while adding minimum credits.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//To map PO with PEO
router.put("/mapping", authorize([ROLES.A, ROLES.PU]), async function (req, res) {
	try {
		let { id, mapping } = req.body;
		let userName = req.headers.userDetails.username;
		if (!courseId || !mapping || !(Object.keys(mapping).length)) {
			throw new Error("Mandatory fields are missing.");
		}
		let result = await prgmRegulations.mapping(ObjectId(id), mapping, userName);
		res.send(result);
	} catch (e) {
		appLogger.error("Error while mapping programme outcomes and programme education objectives.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Add programme specific objectives for programme regulation
router.put("/specific/objectives", authorize([ROLES.A, ROLES.PU]), async function (req, res) {
	try {
		let { id, specificObjectives } = req.body;
		let userName = req.headers.userDetails.username;
		let isAdmin = req.headers.userDetails.isAdmin;

		if (!id || !specificObjectives || !(specificObjectives instanceof Array) || !specificObjectives.length) {
			throw new Error("Mandatory fields missing.");
		}

		let result = await prgmRegulations.updatePSO(ObjectId(id), specificObjectives, userName, isAdmin);
		res.send(result);
	} catch (e) {
		appLogger.error("Error while updating specific objectives.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Add programme educational objectives for programme regulation
router.put("/educational/objectives", authorize([ROLES.A, ROLES.PU]), async function (req, res) {
	try {
		let { id, educationalObjectives } = req.body;
		let userName = req.headers.userDetails.username;
		let isAdmin = req.headers.userDetails.isAdmin;

		if (!id || !educationalObjectives || !(educationalObjectives instanceof Array) || !educationalObjectives.length) {
			throw new Error("Mandatory fields missing.");
		}

		let result = await prgmRegulations.updatePEO(ObjectId(id), educationalObjectives, userName, isAdmin);
		res.send(result);
	} catch (e) {
		appLogger.error("Error while updating educational objectives.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Update status -> Sent for Approval, Approve, Request Changes
router.put("/status/:id", authorize([ROLES.A, ROLES.OA, ROLES.PU]), async function (req, res) {
	try {
		let id = req.params.id;
		let destination = req.body.destination;
		let userRoles = req.headers.userDetails.userRoles;
		let userName = req.headers.userDetails.name ? (req.headers.userDetails.preferred_username + " - " + req.headers.userDetails.name) : req.headers.userDetails.preferred_username;
		let userId = req.headers.userDetails.preferred_username.toUpperCase();
		let reason = req.body.reason;

		if (!id || !destination) {
			throw new Error("Detail missing to change status.");
		}

		if (destination == Mapping.status.REQUESTED_CHANGES && !reason) {
			throw new Error(`Since changing status to ${Mapping.status.values[destination]}, need to provide the reason or mention what change have to be done.`);
		}

		let result = await prgmRegulations.changeStatus(ObjectId(id), destination, userRoles, userName.toUpperCase(), userId, reason);
		res.send(result);
	} catch (err) {
		appLogger.error("Error while changing programme outcome status", err);
		res.status(500).send({ name: err.name, message: err.message });
	}
});

//Freeze a semester
router.put('/freeze/semester', authorize([ROLES.A, ROLES.SA2]), async function (req, res) {
	try {
		let regulationId = req.body.regulationId;
		let prgmId = req.body.prgmId;
		let semester = req.body.semester;
		let userName = req.headers.userDetails.username;

		if (!regulationId || !prgmId || !Number.isFinite(semester)) {
			throw new Error("Required fields are missing.");
		}

		let result = await prgmRegulations.freezeSemester(ObjectId(regulationId), ObjectId(prgmId), semester, userName);

		res.send(result);

	} catch (error) {
		appLogger.error("Error while freezing the semester.", error);
		res.status("500").send({ name: error.name, message: error.message });
	}
});

//Update verticals
router.put("/verticals", authorize([ROLES.A, ROLES.SF]), async function (req, res) {
	try {
		let { regulationId, prgmId, verticals } = req.body;
		let userName = req.headers.userDetails.username;
		let isAdmin = req.headers.userDetails.isAdmin;

		if (!regulationId || !prgmId || !verticals) {
			throw new Error("Mandatory fields missing.");
		}

		if (verticals.length) {
			verticals = verticals.map((vertical) => vertical.toString().trim().toUpperCase());
		}

		let result = await prgmRegulations.verticals(ObjectId(regulationId), ObjectId(prgmId), verticals, userName, isAdmin);
		res.send(result);
	} catch (e) {
		appLogger.error("Error while adding verticals.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

//Add programme outcomes for programme regulation
router.put("/outcomes", authorize([ROLES.A, ROLES.PU]), async function (req, res) {
	try {
		let { id, programmeOutcomes } = req.body;
		let userName = req.headers.userDetails.username;
		let isAdmin = req.headers.userDetails.isAdmin;

		if (!id || !programmeOutcomes || !(programmeOutcomes instanceof Array) || !programmeOutcomes.length) {
			throw new Error("Mandatory fields missing.");
		}

		let result = await prgmRegulations.updatePO(ObjectId(id), programmeOutcomes, userName, isAdmin);
		res.send(result);
	} catch (e) {
		appLogger.error("Error while updating programme outcomes.", e);
		res.status(500).send({ name: e.name, message: e.message });
	}
});

export default router;
