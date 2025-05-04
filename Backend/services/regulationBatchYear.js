import regulationBatchYear from "../daos/regulationBatchYear.js";
import registrationGroup from "../daos/registrationGroup.js";
import electiveGroup from "../daos/electiveGroup.js";
import additionalGroup from "../daos/additionalGroup.js";
import prgmRegulations from "../daos/programmeRegulations.js";
import academicTerms from "../daos/academicTerms.js";
import regulations from "../daos/regulations.js";
import batchYears from "../daos/batchYears.js";
import programmes from "../daos/programmes.js";
import { regulationLog } from "../daos/log.js"
import { Jobs } from "../enums/enums.js";
import jobs from "../daos/jobs.js";
import { Regulations } from "../enums/enums.js";
import { ObjectId } from "mongodb";

const fieldMap = new Map(
    [
        ["Department", "dept.name"],
        ["Programme", "prgm.id"],
        ["Batch Year", "batchYear"],
        ["Regulation Year", "regulation.year"]
    ]
);

async function fetchActiveAcademicTerms() {
    try {
        let result = await academicTerms.getBy({ "isActive": true }, { label: "$id", value: "$_id", _id: 0 });
        if (!result || !result.length) {
            throw new Error("There is no active academic terms.");
        }
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description Performs pagination based on provided parameters.
 * @param {Object} filter Filter object for pagination.
 * @param {Number} skip The number of documents to skip.
 * @param {Number} limit The maximum number of documents to return.
 * @param {String} search Search query.
 * @param {Object} sort Sorting criteria.
 * @returns {Promise<Object>} A promise resolving to paginated data.
 */
async function pagination(filter, skip, limit, search, sort) {
    try {
        let query = regulationBatchYear.paginationQuery(filter, search);
        let result = await regulationBatchYear.basicPagination(
            query,
            {
                skip: skip,
                limit: limit,
            },
            sort
        );
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description Function to fetch filter data
 * @param {String} field
 * @returns {Promise<String|Object>} - distinct data for filter
 */
async function filterData(field) {
    try {
        let fieldName = fieldMap.get(field);
        let result = await regulationBatchYear.distinct(fieldName);
        if (field == "Programme") {
            result = await programmes.getBy({ _id: { $in: result } }, { id: "$_id", category: 1, type: 1, name: 1, mode: 1, _id: 0 });
        }
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description Function to fetch possible regulations while reassigning
 * @param {ObjectId} regBatchYearId
 * @returns {Promise<Object>} possible regulations
 */
async function fetchPossibleRegulations(regBatchYearId) {
    try {
        let record = await regulationBatchYear.get(regBatchYearId);

        if (!record || !record.prgm || !record.prgm.id || !record.regulation.id) {
            throw new Error("Failed to fetch regulation batch year record.");
        }

        let regulationIds = await prgmRegulations.distinct("regulationId", {
            "prgm.id": ObjectId(record.prgm.id),
            "regulationId": { $ne: ObjectId(record.regulation.id) },
            freeze: record.semester
        });

        if (!regulationIds || !regulationIds.length) {
            throw new Error("No possible regulations found.");
        }

        let regulationNames = await regulations.getBy({ _id: { $in: regulationIds }, "status": Regulations.status.APPROVED },
            { _id: 1, title: 1, year: 1, version: 1 }
        );

        return Promise.resolve(regulationNames);

    } catch (e) {
        return Promise.reject(e);
    }
}

async function checkWheatherGroupExist(prgmId, batchYear, semester) {
    try {
        let query = { "class.prgm.id": prgmId, "class.batch.year": batchYear, "class.semester": semester }
        let isRegistrationGroupExist = Boolean(await registrationGroup.count(query));
        let isElectiveGroupExist = Boolean(await electiveGroup.count({
            $or: [
                {
                    "target": {
                        "$elemMatch": {
                            "class.prgm.id": prgmId, "class.batch.year": batchYear, "class.semester": semester
                        }
                    }
                },
                query
            ]
        }));
        let isAdditionalGroupExist = Boolean(await additionalGroup.count(query));

        if (isRegistrationGroupExist || isElectiveGroupExist || isAdditionalGroupExist) {
            return true;
        }

        return false;
    } catch (e) {
        throw e;
    }
}

async function checkGroupExistBeforeReasign(id) {
    try {
        let record = await regulationBatchYear.get(id);
        if (!record || !record.prgm || !record.prgm.id || !record.semester) {
            throw new Error("Failed to fetch batch year mapping record.");
        }

        let isGroupExist = await checkWheatherGroupExist(record.prgm.id, record.batchYear, record.semester);

        if (isGroupExist) {
            throw new Error(`Can't reasign the regulation for '${record.prgm.name}' - batchYear: '${record.batchYear}' - semester: '${record.semester}', since course group already created.`);
        }
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description Function to reassign regulation to another regulation.
 * @param {Object} regulationId Regulation id.
 * @param {Object} id Regulation batch year id.
 * @returns {Promise<String>} A promise resolving to a result.
 */
async function reassign(regulationId, id, userName) {
    try {
        let regulationData = await regulations.get(regulationId, { id: "$_id", year: 1, version: 1, title: 1, _id: 0, status: 1 });

        if (!regulationData || !Object.keys(regulationData).length) {
            throw new Error("Regulation record not found.");
        }

        if (regulationData.status && regulationData.status != Regulations.status.APPROVED) {
            throw new Error("Selected regulation is not in approved status.");
        }

        delete regulationData["status"];

        let record = await regulationBatchYear.get(id);

        if (!record || !record.prgm || !record.prgm.id || !record.semester) {
            throw new Error("Failed to fetch batch year mapping record.");
        }

        let isGroupExist = await checkWheatherGroupExist(record.prgm.id, record.batchYear, record.semester);

        if (isGroupExist) {
            throw new Error(`Can't reasign the regulation for ${record.prgm.name} -
                batchYear:${record.batchYear} - semester:${record.semester}, since course group already created.`);
        }

        let programme = await prgmRegulations.getOne({ regulationId: regulationId, "prgm.id": record.prgm.id });

        if (!programme || !Object.keys(programme).length) {
            throw new Error("Selected programme not comes under this regulation.");
        }

        if (!programme?.freeze.includes(record.semester)) {
            throw new Error(`Some of the semester ${record.semester} courses are not yet confirmed.`);
        }

        let result = await regulationBatchYear.updateOne({ "_id": id }, "SET", { regulation: regulationData });

        if (!result || !result.modifiedCount) {
            throw new Error("Error while reassigning the regulation.");
        }

        let msg = "Reassigned the regulation for the batch year : " + record.batchYear +
            " semester : " + record.semester + " programme : " + record.prgm.name +
            " into '" + regulationData.year + " - " + regulationData.version + " - " + regulationData.title + "'.";

        await regulationLog("regulation batch year", "reassign", userName, msg);

        return Promise.resolve(`Successfully reassigned regulation for the batch year : ${record.batchYear}
            semester : ${record.semester} programme : ${record.prgm.name} into
            '${regulationData.year} - ${regulationData.version} - ${regulationData.title}'.`);

    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description Function to fetch regulation unassigned programmes
 * @returns {Promise<Array<Object>>} programme details
 */
async function getPendingPrgms(academicTermId) {
    try {

        let approvedRegulations = await regulations.distinct("_id", { status: Regulations.status.APPROVED });

        if (!approvedRegulations || !approvedRegulations.length) {
            throw new Error("No approved regulations found.");
        }

        let projection = { semester: "$freeze", regulationId: 1, "prgmId": "$prgm.id", _id: 0 };


        let freezed = await prgmRegulations.getBy({ regulationId: { $in: approvedRegulations } }, projection);

        let { academicSemester, batchYear } = await academicTerms.get(academicTermId, { batchYear: { $arrayElemAt: [{ $split: ["$academicYear", "_"] }, 0] }, academicSemester: 1 });

        let unassignedPrgms = await batchYears.getPendingPrgms(parseInt(batchYear), parseInt(academicSemester), freezed);

        if (!unassignedPrgms || !unassignedPrgms.length) {
            throw new Error("No pending batch years found or all batch years have been already mapped into regulations.");
        }

        return Promise.resolve(unassignedPrgms);

    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description - to fetch regulations while assigning
 * @param {Array<ObjectId} programmes
 * @returns {Promise<Array<Object>>} regulations details
 */
async function fetchRegulationsForPrgmBatchYears(programmes) {
    try {
        let regulationIds = await prgmRegulations.getSchemeConfirmedRegulationIds(programmes);

        let regulationData = await regulations.getBy(
            {
                _id: { $in: regulationIds },
                status: Regulations.status.APPROVED
            },
            {
                _id: 1,
                regulation: { $concat: [{ $toString: "$year" }, ' - ', { $toString: "$version" }, ' - ', "$title"] }
            }
        );

        if (!regulationData || !regulationData.length) {
            throw new Error("No approved regulations found.");
        }

        let res = regulationData.map((regData) => ({ value: regData._id, label: regData.regulation }));

        return Promise.resolve(res);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description To assign a regulation to set of batchYears
 * @param {ObjectId} regulationId
 * @param {Array<ObjectId>} batches
 * @returns {Promise<String>} - success message
 */
async function assign(regulationId, batches, userName) {
    try {
        let regulationData = await regulations.get(regulationId, { title: 1, year: 1, version: 1, _id: 0, id: "$_id" });

        if (!regulationData || !Object.keys(regulationData).length) {
            throw new Error("Regulation record not found.");
        }

        let mappingRecords = await constructMappingRecords(regulationData, batches);

        let result = await regulationBatchYear.createMany(mappingRecords);

        if (!result) {
            throw new Error("Error while assigning the regulation for the batch years.");
        }

        let msg = "Assigned the regulation '" + regulationData.year + " - " +
            regulationData.version + " - " + regulationData.title + "' for " +
            mappingRecords.length + " batch years.";

        await regulationLog("regulation batch year", "assign", userName, msg);

        return Promise.resolve(`Successfully assigned the regulation '${regulationData.year} -
            ${regulationData.version} - ${regulationData.title}' for ${mappingRecords.length} batch years.`);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description function to construct regulation mapping records
 * @param {Object} regulationData
 * @param {Array<ObjectId>} batches
 * @returns {Promise<Array<Object>>} - constructed records
 */
async function constructMappingRecords(regulationData, batches) {
    try {

        const batchIds = batches.map(batch => batch.batchIds).flat();
        let batchYearRecords = await batchYears.getMappingRecords(regulationData, batchIds);

        let mappingRecords = [];

        batchYearRecords.forEach(record => {
            if (!record.programme || !record.programme.length || !record.programme[0].prgm) {
                return;
            }

            let obj = {
                "batchYearId": record._id,
                "regulation": {
                    "title": regulationData.title,
                    "year": regulationData.year,
                    "version": regulationData.version,
                    "id": regulationData.id
                },
                "prgm": {
                    "id": record.prgmId,
                    "category": record.category,
                    "name": record.prgm,
                    "duration": record.programme[0].prgm.duration,
                    "mode": record.programme[0].prgm.mode,
                    "type": record.programme[0].prgm.type,
                    "shortName": record.programme[0].prgm.shortName,
                    "stream": record.programme[0].prgm.stream
                },
                "dept": record.programme[0].dept,
                "prgmRegulationId": record.programme[0]._id,
                "semester": batches.find((batch) => (batch.prgmId.toString() == record.prgmId.toString() && batch.batchYear == record.batchYear)).semester,
                "batchYear": record.batchYear,
                "sectionName": record.sectionName
            };

            mappingRecords.push(obj);
        });

        return Promise.resolve(mappingRecords);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function execute(id) {
    try {

        var pendingJob = await jobs.getPending(id);

        if (Object.keys(pendingJob).length) {

            await jobs.updateOne({ _id: pendingJob._id }, "SET", {
                "dates.started": new Date(),
                "status": Jobs.status.InProgress
            });

            let pipeline = regulationBatchYear.constructPipeline();

            let regulationsBatchYear = await regulationBatchYear.aggregate(pipeline);

            let result = await regulationBatchYear.createMany(regulationsBatchYear);
            if (result) {
                await jobs.updateOne({ _id: pendingJob._id }, "SET", {
                    "dates.finished": new Date(),
                    "status": Jobs.status.Completed,
                    "recordCount": regulationsBatchYear.length,
                    "completionPercentage": 100,
                });
            }
        }

    } catch (e) {
        await jobs.updateOne({ _id: pendingJob._id }, "SET", {
            "status": Jobs.status.Errored,
            "reason": e.message
        });
    }
}

export default { pagination, reassign, filterData, fetchPossibleRegulations, getPendingPrgms, fetchRegulationsForPrgmBatchYears, assign, execute, checkGroupExistBeforeReasign, fetchActiveAcademicTerms };