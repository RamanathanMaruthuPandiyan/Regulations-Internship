import evaluationSchemes from "../daos/evaluationSchemes.js";
import attributes from "../daos/attributes.js";

import { booleanSet, distributionTypes, validModes } from "../constants.js";

/**
 * @description - Function to check whether all fields have been received or not in routes.
 * @param {Object} data All the data from the req.body.
 * @returns {Object} Throws error if any fields are missing.
 */
export function validatePayload(data) {
    try {
        let errors = [];

        if (!data.name) {
            errors.push("Missing name of the distribution.");
        }

        if (!data.courseType) {
            errors.push("Missing Course type.");
        }

        if (!data.distributionType || !distributionTypes.has(data.distributionType.toString().trim().toUpperCase())) {
            errors.push("Missing distribution type or Distribution type not from the list.");
        }

        if (!data.markSplitUp || !Object.keys(data.markSplitUp).length) {
            errors.push("Missing mark split up.");
        }

        if (data.markSplitUp && (!data.markSplitUp.total || !Number.isFinite(data.markSplitUp.total))) {
            errors.push("Total marks must be a positive number.");
        }

        if (errors.length) {
            throw { "name": "multiErr", "message": errors };
        }

        return formatData(data);
    } catch (e) {
        throw e;
    }
}

/**
 *
 * @param {Object} data
 * @returns {Object} formatted data
 */
function formatData(data) {
    try {

        if (!data.CA_Components) {
            data.CA_Components = [];
        }

        if (!data.FE_Components) {
            data.FE_Components = [];
        }

        switch (data.distributionType) {
            case "CA":
                data.markSplitUp.FE = { "actual": 0, "scaled": 0 };
                data.FE_Components = [];
                break;

            case "FE":
                data.markSplitUp.CA = { "actual": 0, "scaled": 0 };
                data.CA_Components = [];
                break;
        };

        data.markSplitUp.CA.actual = parseFloat((data.markSplitUp.CA.actual).toFixed(1));
        data.markSplitUp.CA.scaled = parseFloat((data.markSplitUp.CA.scaled).toFixed(1));

        data.markSplitUp.FE.actual = parseFloat((data.markSplitUp.FE.actual).toFixed(1));
        data.markSplitUp.FE.scaled = parseFloat((data.markSplitUp.FE.scaled).toFixed(1));

        data.CA_Components = formatComponents(data.CA_Components);
        data.FE_Components = formatComponents(data.FE_Components);

        return data;
    } catch (e) {
        return data;
    }
}

/**
 *
 * @param {Array<Object>} components
 * @returns {Array<Object>} components
 */
function formatComponents(components) {
    try {
        components.forEach(component => {

            component.marks.actual = parseFloat((component.marks.actual).toFixed(1));
            component.marks.scaled = parseFloat((component.marks.scaled).toFixed(1));

            //update hasConversion field for component
            if (component.marks && (component.marks.actual == component.marks.scaled)) {
                component.hasConversion = false;
            } else {
                component.hasConversion = true;
            }

            if (!component.hasSubComponent) {
                component.sub = [];
            }

            //update hasConversion field for all sub components
            component.sub.forEach(subComponent => {

                subComponent.marks.actual = parseFloat((subComponent.marks.actual).toFixed(1));
                subComponent.marks.scaled = parseFloat((subComponent.marks.scaled).toFixed(1));

                //update hasConversion field for all CA components
                if (subComponent.marks && (subComponent.marks.actual == subComponent.marks.scaled)) {
                    subComponent.hasConversion = false;
                } else {
                    subComponent.hasConversion = true;
                }

                subComponent.hasSubComponent = false;
            });
        });

        return components;

    } catch (e) {
        return components;
    }
}

/**
 * @description to get component in the structure
 * @param {Array<Object>} components
 * @returns {Array<Object>} components
 */
function buildComponent(components) {
    return components.map(component => {
        let match = {
            name: component.name,
            "marks.actual": component.marks.actual,
            "marks.scaled": component.marks.scaled,
            hasSubComponent: component.hasSubComponent,
            hasConversion: component.hasConversion
        };
        if (component.hasSubComponent && component.marks.mode) {
            match["marks.mode"] = component.marks.mode;
        }
        if (component.sub && component.sub.length) {
            match["sub"] = { $all: buildComponent(component.sub), $size: component.sub.length };
        }
        return { $elemMatch: match };
    });
}

/**
 * @description Function to check whether the pattern exist or not.
 * @param {String} name PatternName
 * @param {String} courseType Course type.
 * @param {String} distributionType Distribution type.
 * @param {Object} markSplitUp Overall mark split up for the evaluation scheme.
 * @param {Array<Object>} CA_Components CA split up.
 * @param {Array<Object>} FE_Components FE split up.
 * @param {ObjectId} id Id of the evaluation scheme.
 * @returns {Promise<Boolean>} - Throws error if any.
 */
async function patternExist(name, courseType, distributionType, markSplitUp, CA_Components, FE_Components, id) {
    try {
        let query = {};
        if (id) {
            query._id = { $ne: id };
        }

        let isNameExist = Boolean(await evaluationSchemes.count({ ...query, name }));
        if (isNameExist) {
            throw new Error("The given name already exists.");
        }

        query["markSplitUp.CA.scaled"] = markSplitUp.CA.scaled;
        query["markSplitUp.CA.actual"] = markSplitUp.CA.actual;
        query["markSplitUp.FE.scaled"] = markSplitUp.FE.scaled;
        query["markSplitUp.FE.actual"] = markSplitUp.FE.actual;
        query["markSplitUp.total"] = markSplitUp.total;
        query.courseType = courseType;
        query.distributionType = distributionType;

        query.CA_Components = { $all: buildComponent(CA_Components), $size: CA_Components.length };

        query.FE_Components = { $all: buildComponent(FE_Components), $size: FE_Components.length };



        let isExist = Boolean(await evaluationSchemes.count(query));
        if (isExist) {
            throw new Error("The evaluation scheme already exist.");
        }

        return Promise.resolve(true);

    } catch (e) {
        throw e;
    }
}

/**
 * @description Function to validate mark split up
 * @param {String} distributionType
 * @param {Object} markSplitUp
 * @param {Array<String>} errors
 */
function validateMarkSplitUp(distributionType, markSplitUp, errors) {
    try {
        if (distributionType == "CA" || distributionType == "BOTH") {
            if (!markSplitUp.CA.actual || !Number.isFinite(markSplitUp.CA.actual)) {
                errors.push("Total conducting marks for CA Distribution is missing.");
            } else if (!markSplitUp.CA.scaled || !Number.isFinite(markSplitUp.CA.scaled)) {
                errors.push("Total out of marks for CA Distribution is missing.");
            }
        }

        if (distributionType == "FE" || distributionType == "BOTH") {
            if (!markSplitUp.FE.actual || !Number.isFinite(markSplitUp.FE.actual)) {
                errors.push("Total conducting marks for FE Distribution is missing.");
            } else if (!markSplitUp.FE.scaled || !Number.isFinite(markSplitUp.FE.scaled)) {
                errors.push("Total out of marks for FE Distribution is missing.");
            }
        }

        if (markSplitUp.CA.actual && ((markSplitUp.CA.actual % 0.5) != 0)) {
            errors.push("Total conducting marks for CA Distribution can only be in increments of 0.5.");
        }

        if (markSplitUp.CA.scaled && ((markSplitUp.CA.scaled % 0.5) != 0)) {
            errors.push("Total out of marks for CA Distribution can only be in increments of 0.5.");
        }

        if (markSplitUp.FE.actual && ((markSplitUp.FE.actual % 0.5) != 0)) {
            errors.push("Total conducting marks for FE Distribution can only be in increments of 0.5.");
        }

        if (markSplitUp.FE.scaled && ((markSplitUp.FE.scaled % 0.5) != 0)) {
            errors.push("Total out of marks for FE Distribution can only be in increments of 0.5.");
        }

    } catch (e) {
        throw e;
    }
}

/**
 * @description To validate missing fields in a component
 * @param {String} componentType
 * @param {Array<Object>} component
 * @param {Number} index
 * @param {Array} errors
 */
function validateMissingFields(componentType, component, index, errors) {
    try {
        if (!component.name) {
            errors.push(`Missing component name for component ${index + 1} in ${componentType} distribution.`);
        }

        if (!component.marks) {
            errors.push(`Missing component marks for component ${index + 1} in ${componentType} distribution.`);
        }

        if (component.marks && !component.marks.actual) {
            errors.push(`Missing conducting marks for component ${index + 1} in ${componentType} distribution.`);
        }

        if (component.marks && !component.marks.scaled) {
            errors.push(`Missing scalable marks for component ${index + 1} in ${componentType} distribution.`);
        }

        if (component.marks && component.marks.actual && ((component.marks.actual % 0.5) != 0)) {
            errors.push(`Conducting marks for component ${index + 1} in ${componentType} distribution can only be in increments of 0.5.`);
        }

        if (component.marks && component.marks.scaled && ((component.marks.scaled % 0.5) != 0)) {
            errors.push(`Scalable marks for component ${index + 1} in ${componentType} distribution can only be in increments of 0.5.`);
        }

        if (!booleanSet.has(component.hasSubComponent)) {
            errors.push(`Missing Do you want to create sub component field for component ${index + 1} in ${componentType} distribution.`);
        }

        if (!booleanSet.has(component.hasConversion)) {
            errors.push(`Missing conversion required field for component ${index + 1} in ${componentType} distribution.`);
        }

    } catch (e) {
        throw e;
    }
}

/**
 * @description validate mode is given
 * @param {String} componentType
 * @param {Object} component
 * @param {Number} index
 * @param {Array} errors
 */
function validateMode(componentType, component, index, errors) {
    try {

        const mode = component.marks.mode.toString().trim().toUpperCase();

        if (!validModes.has(mode)) {
            errors.push(`Invalid mode given for component ${index + 1} in ${componentType} distribution.`);
        }

        if (mode == "SUM" || mode == "AVERAGE") {
            if (component.sub.length < 2) {
                errors.push(`Minimum 2 components required for component ${index + 1} in ${componentType} distribution.`);
            }

            let sum = 0;
            component.sub.forEach((subComp) => {
                sum += subComp.marks.scaled;
            });

            if (mode == "SUM" && component.marks.actual != sum) {
                errors.push(`Sum of scaled marks of sub components must be equal to the conducting marks for component ${index + 1} in ${componentType} distribution.`);
            }

            if (mode == "AVERAGE") {
                let average = parseFloat((sum / component.sub.length).toFixed(1));
                if (component.marks.actual != average) {
                    errors.push(`Average of scaled marks of sub components must be equal to the conducting marks for component ${index + 1} in ${componentType} distribution.`);
                }
            }
        }

        if (mode == "BEST") {
            if (!component.marks.count) {
                errors.push(`Best (Test Count) is missing for component ${index + 1} in ${componentType} distribution.`);
            }

            if (component.marks.count >= component.sub.length) {
                errors.push(`Best - Test Count must be lesser than the length of the sub components for component ${index + 1} in ${componentType} distribution.`);
            }

            const firstScaledMark = component.sub[0]?.marks?.scaled;

            const isMarksSame = component.sub.every(subComponent => subComponent.marks.scaled == firstScaledMark);

            if (!isMarksSame) {
                errors.push(`For component ${index + 1} in ${componentType} distribution, all subcomponents must have the same scaled marks.`);
            }

            if (component.marks.actual != (firstScaledMark * component.marks.count)) {
                errors.push(`Best of ${component.marks.count} sub components marks not matched with conducting marks for component ${index + 1} in ${componentType} distribution.`);
            }
        }
    } catch (e) {
        throw e;
    }
}

/**
 * @description validate sub components
 * @param {String} componentType
 * @param {Object} component
 * @param {Number} index
 * @param {Array} errors
 */
function validateSubComponents(componentType, component, index, errors) {
    try {
        if (component.hasSubComponent && (!component.sub || !component.sub.length)) {
            errors.push(`Missing sub components for the component ${index + 1} under ${componentType} distribution.`);
        }

        component.sub.forEach((subComponent, index) => {
            validateMissingFields(componentType, subComponent, index, errors);
        });

        if (component.hasSubComponent) {
            validateMode(componentType, component, index, errors);
        }

    } catch (e) {
        throw e;
    }
}

/**
 * @description Function to validate components and verifying the sum of scaled mark to the markSplitUp scaled mark.
 * @param {String} componentType
 * @param {Array<Object>} components
 * @param {Number} componentConductingMarks
 * @param {Array} errors
 */
function validateComponents(componentType, components, componentConductingMarks, errors) {
    try {
        if (!components || !components.length) {
            errors.push(`Missing components for ${componentType}.`);
        }

        if (!componentConductingMarks) {
            errors.push(`Missing total conducting marks for ${componentType} distribution.`);
        }

        let componentsTotal = 0;

        components.forEach((component, index) => {

            validateMissingFields(componentType, component, index, errors);

            componentsTotal += component.marks.scaled;

            validateSubComponents(componentType, component, index, errors);
        });

        if (componentsTotal != componentConductingMarks) {
            errors.push(`Sum of scalable marks of all components under ${componentType} distribution must be equal to the total conducting marks.`);
        }

    } catch (e) {
        throw e;
    }
}

function isValidComponentNames(components) {
    try {
        let componentNames = components.flatMap((component) => [component.name.toString().trim().toUpperCase(), ...component.sub.map((subComponent) => subComponent.name.toString().trim().toUpperCase())]);
        return new Set(componentNames).size == componentNames.length;
    } catch (e) {
        throw e;
    }
}

/**
 * @description Validates the evaluation scheme based on provided parameters.
 * Checks the course type, distribution type, and components, ensuring all values are consistent and valid.
 * @param {String} name - The name of the evaluation scheme.
 * @param {String} courseType - The type of the course.
 * @param {String} distributionType - The type of distribution (CA, FE, BOTH).
 * @param {Object} markSplitUp - The split up of marks for the course.
 * @param {Array} CA_Components - Continuous Assessment components.
 * @param {Array} FE_Components - Final Exam components.
 * @param {String} id - The ID of the evaluation scheme.
 * @returns {Object} - The validated evaluation scheme.
 * @throws {Error} - Throws an error if validation fails.
 */
export async function validate(name, courseType, distributionType, markSplitUp, CA_Components, FE_Components, id) {
    try {

        const courseTypeFound = Boolean(await attributes.count({ name: "type", "module": "regulations", values: { $elemMatch: { shortName: courseType } } }));
        if (!courseTypeFound) {
            throw new Error("Course type must be in attributes.");
        }

        await patternExist(name, courseType, distributionType, markSplitUp, CA_Components, FE_Components, id);

        let errors = [];

        validateMarkSplitUp(distributionType, markSplitUp, errors);

        switch (distributionType) {
            case "CA":
                validateComponents("CA", CA_Components, markSplitUp.CA.actual, errors);
                if (markSplitUp.CA.scaled != markSplitUp.total) {
                    errors.push("Total out of marks for CA Distribution is not equal to the overall mark distribution.");
                }
                if (!isValidComponentNames(CA_Components)) {
                    errors.push("CA Components name must be unique.");
                }
                break;

            case "FE":
                validateComponents("FE", FE_Components, markSplitUp.FE.actual, errors);
                if (markSplitUp.FE.scaled != markSplitUp.total) {
                    errors.push("Total out of marks for FE Distribution is not equal to the overall mark distribution.");
                }
                if (!isValidComponentNames(FE_Components)) {
                    errors.push("FE Components name must be unique.");
                }
                break;

            case "BOTH":
                validateComponents("CA", CA_Components, markSplitUp.CA.actual, errors);
                validateComponents("FE", FE_Components, markSplitUp.FE.actual, errors);
                if (markSplitUp.CA.scaled + markSplitUp.FE.scaled != markSplitUp.total) {
                    errors.push("Sum of out of marks for CA and FE distribution is not equal to the overall mark distribution.");
                }
                if (!isValidComponentNames([...CA_Components, ...FE_Components])) {
                    errors.push("Components name must be unique.");
                }
                break;
        }

        if (errors.length) {
            throw { "name": "multiErr", "message": errors };
        }

        return { name, courseType, distributionType, markSplitUp, CA_Components, FE_Components };

    } catch (e) {
        throw e;
    }
}