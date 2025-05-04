import { readOnly } from "./base.js";
const dao = readOnly("academicTerms");

async function getCurrentBatchYear() {
    try {
        let result = await dao.aggregate(
            [
                {
                    $match: {
                        "isActive": true,
                    }
                },
                {
                    $project: {
                        "batchYear": { $arrayElemAt: [{ $split: ["$academicYear", "_"] }, 0] }, academicSemester: 1
                    }
                },
                {
                    $sort: { _id: -1 }
                }
            ]
        );

        if (!result || !result.length || !result[0].batchYear) {
            throw new Error("Academic term was not yet created.");
        }

        return Promise.resolve(result[0]);
    } catch (error) {
        return Promise.reject(error);
    }
}

export default {
    getCurrentBatchYear,
    ...dao
};
