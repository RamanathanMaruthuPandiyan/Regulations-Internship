import departments from "../daos/departments.js";

/**
 * @description Retrieves distinct values from a data source.
 * @returns {Promise<Array<Object>} A promise resolving to an array of department details.
 */
async function distinct() {
    try {
        let result = await departments.getBy({ status: "A" }, { status: 0 });
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

export default {
    distinct
}