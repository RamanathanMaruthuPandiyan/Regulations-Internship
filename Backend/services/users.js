import users from "../daos/users.js";
import { ObjectId } from 'mongodb';


let schemeRole = new Set(["SCHEME FACULTY", "SCHEME APPROVER I", "OBE APPROVER", "PO UPLOADER"]);

/**
 * @description validate user details.
 * @param {Object} userDetails - data about user.
 * @returns {Promise<Array<Object>>} A promise that resolves faculty information objects.
 */
function validate(userDetails) {
    try {

        if (Object.keys(userDetails).length == 0) {
            throw new Error("User details not provided");
        }

        let { userId, roles, departmentIds, programmeIds } = userDetails;

        if (!userId) {
            throw new Error("Please provide a valid userId.");
        }

        if (!roles || !roles.length) {
            throw new Error("Roles need to specified while creating user account");
        }

        let isSchemeRole = false;
        for (let role of roles) {
            if (schemeRole.has(role)) {
                isSchemeRole = true;
                break;
            }
        }

        userDetails.departmentIds = userDetails.programmeIds = [];

        if (isSchemeRole) {

            if (!departmentIds || !departmentIds.length || !programmeIds || !programmeIds.length) {
                throw new Error("Programmes and departments need to be specified.");
            }

            userDetails.departmentIds = departmentIds.map((id) => ObjectId(id));
            userDetails.programmeIds = programmeIds.map((id) => ObjectId(id));
        }

        return userDetails;
    }
    catch (e) {
        throw e;
    }
}

/**
 * @description Fetches information about faculty by username.
 * @param {Array<String>} username - userId of faculty.
 * @returns {Promise<Array<Object>>} A promise that resolves faculty information objects.
 */
async function get(userId) {
    try {
        let user = await users.getOne({ userId });

        if (!user) {
            throw new Error("Error while getting user data.")
        }

        return Promise.resolve(user);
    } catch (error) {
        return Promise.reject(error);
    }
}

/**
 * @description Pagination function for users.
 * @param {Number} skip Number of records to skip.
 * @param {Number} limit Maximum number of records to return.
 * @param {String} search Search criteria.
 * @param {Object} sort Sort criteria.
 * @returns {Promise<Object>} - Promise resolving to pagination result.
 */
async function pagination(skip, limit, search, sort) {
    try {
        let { preQuery, pipeline, postQuery } = users.paginationQuery(search);

        let result = await users.basicPagination(
            preQuery,
            {
                skip: skip,
                limit: limit,
            },
            sort,
            pipeline,
            postQuery
        );
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

export default { get, pagination, validate };