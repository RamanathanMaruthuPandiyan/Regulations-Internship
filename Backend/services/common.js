import axios from "axios";
import { ObjectId } from "mongodb";

/**
 *
 * @param {String} url - remote url
 * @param {String} method - http method
 * @param {Object} body - request body contains query, filter
 * @param {String} authorizationId - accessKey to authorize
 * @returns {Object} result - response from remote api
 */

export async function httpRequest(
    url,
    method = "GET",
    body = null,
    authorizationId
) {
    try {
        var options = {
            url: url,
            method: method,
            headers: {
                "User-Agent": "Axios",
                Authorization: authorizationId,
                "Content-Type": "application/json",
            },
            responseType: "json",
        };

        if (method.toLowerCase() == "get") {
            if (body) {
                options.params = body; // treat body as query string
            }
        } else {
            if (body) {
                options.data = body;
            }
        }

        const result = await axios(options);
        return result;
    } catch (error) {
        return Promise.reject(error);
    }
}

/**
 * @description - Function to find the set difference between two arrays.
 * @param {Array} A - The first array.
 * @param {Array} B - The second array.
 * @param {Boolean} isIdField - to denote the field is id or not
 * @returns {Object} An object containing deleted , added values denotes the set difference.
 */
export function setDifference(A = [], B = [], isIdField) {
    try {
        let a = [...new Set(A)].map((value) => {
            return value.toString();
        });

        let b = [...new Set(B)].map((value) => {
            return value.toString();
        });

        let deleted = a.filter((value) => {
            if (!b.includes(value)) {
                return true;
            } else {
                return false;
            }
        });

        let added = b.filter((value) => {
            if (!a.includes(value)) {
                return true;
            } else {
                return false;
            }
        });

        if (isIdField) {
            deleted = deleted.map((id) => { return ObjectId(id); });
            added = added.map((id) => { return ObjectId(id); });
        }

        return { deleted, added };
    } catch (e) {
        throw e;
    }
}

/**
 * @description - Utility function to find the intersection of two arrays of numbers.
 * @param {number[]} A - The first array of numbers.
 * @param {number[]} B - The second array of numbers.
 * @returns {number[]} An array representing the intersection of A and B.
 */
export function intersection(A, B) {
    try {
        // Create sets from the arrays to remove duplicates
        let setA = new Set(A);
        let setB = new Set(B);

        // Find the intersection of the two sets
        let intersection = [...setA].filter((value) => setB.has(value));

        return intersection;

    } catch (e) {
        throw e;
    }
}

/**
 * @description Function to Construct the Search Query for All Jobs, Credits, Evaluation Schemes, and Grades.
 * @param {*} enums This is the enum array
 * @param {*} searchTerm This is the search value.
 * @returns {Array} An array of keys that match the search term.
 */
export function extractSearchKeys(enums, searchTerm) {
    try {
        let descriptionsArray = Object.values(enums.descriptions);
        let regex = new RegExp(searchTerm, "i");
        let filteredResults = descriptionsArray.filter(value => regex.test(value));
        let matchingKeys = filteredResults.map(description => {
            return Object.keys(enums.descriptions).find(key => enums.descriptions[key] === description);
        });
        return matchingKeys;
    } catch (e) {
        throw e;
    }
}