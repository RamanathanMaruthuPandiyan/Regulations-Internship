import { Regulations, Courses, Action_Items, Jobs, Mapping } from "../enums/enums.js";

const enumMap = {
    regulations: Regulations,
    courses: Courses,
    actionItems: Action_Items,
    jobs: Jobs,
    mapping: Mapping

};

/**
 * @description to get enums
 * @param {String} name - enum name
 * @returns {Object} enum object
 */
function getEnums(name) {
    try {
        return enumMap[name] || null;
    } catch (e) {
        return e;
    }
}

export default { getEnums };
