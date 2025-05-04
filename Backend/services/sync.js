import batchYear from "../daos/batchYears.js";
import department from "../daos/departments.js";
import programme from "../daos/programmes.js";
import courses from "../daos/courses.js";
import programmeRegulation from "../daos/programmeRegulations.js";
import regulationBatchYear from "../daos/regulationBatchYear.js";
import jobs from "../daos/jobs.js";
import { ObjectId } from "mongodb";
import groups from "./remote/groups.js";
import { client } from "../daos/MongoDbUtil.js";
import { regulationLog } from "../daos/log.js";
import { setDifference } from "./common.js";
import { Jobs } from "../enums/enums.js";

/**
 * @description Updates the programmes collection based on new data.
 * @param {Object} res - route response
 * @param {String} userName - user who initiated the sync
 * @returns {Promise} A promise resolving to the result of the bulk write operation.
 */
async function programmes(res, userName) {
    try {

        var jobId = await jobs.createJob(Jobs.names.Sync_Programmes);

        res.send("Process initiated to sync programmes from Laudea-Groups. Please check the job status after sometime.");

        let records = await groups.getProgrammes();

        if (!records || !records.length) {
            throw new Error("Error while fetching programmes from groups.");
        }

        let newPrgmIds = records.map((record) => {
            return ObjectId(record._id);
        });

        let oldPrgmIds = await programme.distinct("_id");

        let { deleted } = setDifference(oldPrgmIds, newPrgmIds, true);

        let prgmId = await programmeRegulation.distinct("prgm.id", { "prgm.id": { $in: deleted } });

        let { deleted: removedIds } = setDifference(deleted, prgmId, true);

        await jobs.update(jobId, "SET", {
            "dates.started": new Date(),
            status: Jobs.status.InProgress,
        })

        const session = client.startSession();
        let result;
        try {
            const transactionOptions = {
                readPreference: "primary",
                readConcern: { level: "local" },
                writeConcern: { w: "majority" },
                maxCommitTimeMS: 1000,
            };
            await session.withTransaction(async () => {
                let bulkOps = records.map((record) => (
                    {
                        updateOne:
                        {
                            filter: { "_id": ObjectId(record._id) },
                            update: {
                                $set: {
                                    "category": record.category,
                                    "name": record.prgm,
                                    "shortName": record.shortName,
                                    "type": record.type,
                                    "mode": record.mode,
                                    "duration": record.duration,
                                    "stream": record.stream,
                                    "status": record.status,
                                    "dept": {
                                        "id": ObjectId(record.deptId),
                                        "name": record.dept,
                                        "category": record.category
                                    }
                                }
                            },
                            upsert: true
                        }
                    })
                );

                if (removedIds && removedIds.length) {
                    bulkOps.push({
                        deleteMany: {
                            filter: { _id: { $in: removedIds } }
                        }
                    });
                }

                result = await programme.bulkWrite(bulkOps, { session });

                let bulkOps1 = records.map((record) => (
                    {
                        updateOne:
                        {
                            filter: { "prgm.id": ObjectId(record._id) },
                            update: {
                                $set: {
                                    "prgm": {
                                        "id": ObjectId(record._id),
                                        "category": record.category,
                                        "name": record.prgm,
                                        "shortName": record.shortName,
                                        "type": record.type,
                                        "mode": record.mode,
                                        "duration": record.duration,
                                        "stream": record.stream
                                    },
                                    "dept": {
                                        "id": ObjectId(record.deptId),
                                        "name": record.dept,
                                        "category": record.category
                                    }
                                }
                            }
                        }
                    })
                );

                await programmeRegulation.bulkWrite(bulkOps1, { session });

                await regulationBatchYear.bulkWrite(bulkOps1, { session });

                let bulkOps2 = records.map((record) => (
                    {
                        updateOne: {
                            filter: { "prgm.id": ObjectId(record._id) },
                            update: {
                                $set: {
                                    "prgm.category": record.category,
                                    "prgm.name": record.prgm,
                                }
                            }
                        }
                    })
                );

                await courses.bulkWrite(bulkOps2, { session });

            }, transactionOptions);



        } catch (e) {
            await jobs.update(jobId, "SET", {
                status: Jobs.status.Errored,
                reason: e.message
            });
        } finally {
            await session.endSession();
        }

        result = result.result;
        await jobs.update(jobId, "SET", {
            "dates.finished": new Date(),
            status: Jobs.status.Completed,
            completionPercentage: 100,
            recordCount: result.nRemoved + result.nUpserted + result.nModified,
            "summary.inserted": result.nUpserted,
            "summary.modified": result.nModified,
            "summary.removed": result.nRemoved,
            "summary.matched": result.nMatched
        });

        if (removedIds && removedIds.length) {
            let msg = `Bulk write operation on programmes collection - removed ids '${removedIds}'.`;
            await regulationLog("sync programmes", "sync", userName, msg);
        }

    } catch (e) {
        await jobs.update(jobId, "SET", {
            status: Jobs.status.Errored,
            reason: e.message
        });
    }
}

/**
 * @description Updates the batchYears collection based on new data.
 * @returns {Promise} A promise resolving to the result of the bulk write operation.
 */
async function batchYears(res, userName) {
    try {

        var jobId = await jobs.createJob(Jobs.names.Sync_BatchYears);

        res.send("Process initiated to sync batch years from Laudea-Groups. Please check the job status after sometime.");

        let records = await groups.getBatchYears();

        if (!records || !records.length) {
            throw new Error("Error while fetching batch years from groups.");
        }

        let newBatchIds = records.map((record) => {
            return ObjectId(record._id);
        });

        let oldBatchIds = await batchYear.distinct("_id");

        let { deleted } = setDifference(oldBatchIds, newBatchIds, true);

        let existingBatchYearId = await regulationBatchYear.distinct("batchYearId", { "batchYearId": { $in: deleted } });

        let { deleted: removedIds } = setDifference(deleted, existingBatchYearId, true);

        await jobs.update(jobId, "SET", {
            "dates.started": new Date(),
            status: Jobs.status.InProgress
        })


        let bulkOps = records.map((record) => (
            {
                updateOne: {
                    filter: {
                        "_id": ObjectId(record._id)
                    },
                    update: {
                        $set: {
                            "sectionId": ObjectId(record.sectionId),
                            "prgmId": ObjectId(record.prgmId),
                            "dept": record.dept,
                            "category": record.category,
                            "prgm": record.prgm,
                            "batchYear": record.batchYear,
                            "status": record.status,
                            "sectionName": record.sectionName
                        }
                    },
                    upsert: true
                }
            })
        );

        if (removedIds && removedIds.length) {
            bulkOps.push({
                deleteMany: {
                    filter: { _id: { $in: removedIds } }
                }
            });
        }
        let { result } = await batchYear.bulkWrite(bulkOps);

        await jobs.update(jobId, "SET", {
            "dates.finished": new Date(),
            status: Jobs.status.Completed,
            completionPercentage: 100,
            recordCount: result.nRemoved + result.nUpserted + result.nModified,
            "summary.inserted": result.nUpserted,
            "summary.modified": result.nModified,
            "summary.removed": result.nRemoved,
            "summary.matched": result.nMatched
        });

        if (removedIds && removedIds.length) {
            let msg = `Bulk write operation on batch year collection - removed ids '${removedIds}'.`;
            await regulationLog("sync batch years", "sync", userName, msg);
        }

    } catch (e) {

        await jobs.update(jobId, "SET", {
            status: Jobs.status.Errored,
            reason: e.message
        });
    }
}

/**
 * @description Updates the departments collection based on new data.
 * @returns {Promise} A promise resolving to the result of the bulk write operation.
 */
async function departments(res, userName) {
    try {

        var jobId = await jobs.createJob(Jobs.names.Sync_Departments);

        res.send("Process initiated to sync departments from Laudea-Groups. Please check the job status after sometime.");

        let records = await groups.getDepartments(res);

        if (!records || !records.length) {
            throw new Error("Error while fetching data from groups.");
        }

        let newDeptIds = records.map((record) => {
            return ObjectId(record._id);
        });

        let oldDeptIds = await department.distinct("_id");

        let { deleted: removedIds } = setDifference(oldDeptIds, newDeptIds, true);

        await jobs.update(jobId, "SET", {
            "dates.started": new Date(),
            status: Jobs.status.InProgress,
        });


        const session = client.startSession();
        let result;
        try {
            const transactionOptions = {
                readPreference: "primary",
                readConcern: { level: "local" },
                writeConcern: { w: "majority" },
                maxCommitTimeMS: 1000,
            };

            await session.withTransaction(async () => {
                let bulkOps = records.map((record) => (
                    {
                        updateOne:
                        {
                            filter:
                            {
                                "_id": ObjectId(record._id)
                            },
                            update:
                            {
                                $set:
                                {
                                    "name": record.dept,
                                    "status": record.status,
                                    "category": record.category
                                }
                            },
                            upsert: true
                        }
                    })
                );
                if (removedIds && removedIds.length) {
                    bulkOps.push({
                        deleteMany: {
                            filter: { _id: { $in: removedIds } }
                        }
                    });
                }
                result = await department.bulkWrite(bulkOps, { session });

                let bulkOps1 = records.map((record) => (
                    {
                        updateOne:
                        {
                            filter:
                            {
                                "offeringDept.id": ObjectId(record._id)
                            },
                            update:
                            {
                                $set:
                                {
                                    "offeringDept.name": record.dept,
                                    "offeringDept.category": record.category

                                }
                            }
                        }
                    })
                );

                await courses.bulkWrite(bulkOps1, { session })

            }, transactionOptions);


        } catch (e) {
            await jobs.update(jobId, "SET", {
                status: Jobs.status.Errored,
                reason: e.message
            });
        } finally {
            await session.endSession();
        }

        result = result.result;
        await jobs.update(jobId, "SET", {
            "dates.finished": new Date(),
            status: Jobs.status.Completed,
            completionPercentage: 100,
            recordCount: result.nRemoved + result.nUpserted + result.nModified,
            "summary.inserted": result.nUpserted,
            "summary.modified": result.nModified,
            "summary.removed": result.nRemoved,
            "summary.matched": result.nMatched
        });

        if (removedIds && removedIds.length) {
            let msg = `Bulk write operation on department collection - removed ids '${removedIds}'.`;
            await regulationLog("sync department", "sync", userName, msg);
        }

    } catch (e) {

        await jobs.update(jobId, "SET", {
            status: Jobs.status.Errored,
            reason: e.message
        });
    }
}

export default {
    programmes,
    departments,
    batchYears
}