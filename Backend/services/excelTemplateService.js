import xlsx from 'xlsx';
import { createRequire } from "module";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fileService from "./fileService.js";
import attributes from "./attributes.js";
import departments from "../daos/departments.js";
import regulations from "../daos/regulations.js";
import credits from "../daos/credits.js";
import evaluationSchemes from "../daos/evaluationSchemes.js";
import programmeRegulations from "../daos/programmeRegulations.js";

const require = createRequire(import.meta.url);
const config = require('../config/config.' + process.env.NODE_ENV);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @description Retrieves evaluation pattern names associated with a regulation.
 * @param {ObjectId} regulationId The ID of the regulation.
 * @returns {Promise<Array<String>>} A promise resolving to an array of evaluation pattern names.
 */
async function getEvaluationPatternNames(regulationId) {
    try {
        const evaluationIds = await regulations.distinct("evaluationIds", { _id: regulationId });
        const evaluationSchemeNames = await evaluationSchemes.distinct("name", { _id: { $in: evaluationIds } });
        return Promise.resolve(evaluationSchemeNames);
    } catch (error) {
        return Promise.reject("Failed to get evaluation pattern names.");
    }
}

/**
 * @description Retrieves scheme import column name configurations of a regulation.
 * @param {ObjectId} regulationId The ID of the regulation.
 * @returns {Promise<Object>} A promise resolving to an object representing course scheme columns.
 */
async function getSchemeImportColumns(regulationId) {
    try {

        let departmentNames = await departments.distinct("name");
        departmentNames = departmentNames.map((dept) => dept.toString().trim().toUpperCase());
        const departmentCategories = await departments.distinct("category");
        const courseCategories = await attributes.distinctValues("values.name", { "name": "category", "module": "regulations" });
        const courseTypes = await attributes.distinctValues("values.name", { "name": "type", "module": "regulations" });
        const evaluationSchemeNames = await getEvaluationPatternNames(regulationId);

        const programmeSchemesColumns = {
            "A": { header: "semester", displayName: "Semester", dataType: "n", dataTypeMeta: "number", optional: true },
            "B": { header: "courseCode", displayName: "Course Code", dataType: "s", dataTypeMeta: "string" },
            "C": { header: "courseTitle", displayName: "Course Title", dataType: "s", dataTypeMeta: "string" },
            "D": { header: "courseCategory", displayName: "Course Category", dataType: "s", dataTypeMeta: "string", option: courseCategories },
            "E": { header: "courseType", displayName: "Course Type", dataType: "s", dataTypeMeta: "string", option: courseTypes, optional: true },
            "F": { header: "partType", displayName: "Part Type", dataType: "s", dataTypeMeta: "string", optional: true },
            "G": { header: "lectureHours", displayName: "Lecture Hours", dataType: "n", dataTypeMeta: "number", optional: true },
            "H": { header: "tutorialHours", displayName: "Tutorial Hours", dataType: "n", dataTypeMeta: "number", optional: true },
            "I": { header: "practicalHours", displayName: "Practical Hours", dataType: "n", dataTypeMeta: "number", optional: true },
            "J": { header: "credits", displayName: "Credits", dataType: "n", dataTypeMeta: "number", optional: true },
            "K": { header: "evaluationPattern", displayName: "Evaluation Scheme", dataType: "s", dataTypeMeta: "string", option: evaluationSchemeNames, optional: true },
            "L": { header: "departmentName", displayName: "Offering Department Name", dataType: "s", dataTypeMeta: "string", option: departmentNames, optional: true },
            "M": { header: "departmentCategory", displayName: "Offering Department Category", dataType: "s", dataTypeMeta: "string", option: departmentCategories, optional: true },
            "N": { header: "prerequisites", displayName: "Prerequisites", dataType: "s", dataTypeMeta: "string", optional: true },
            "O": { header: "isVertical", displayName: "Is Vertical", dataType: "s", dataTypeMeta: "string", option: ["YES", "NO"] },
            "P": { header: "vertical", displayName: "Vertical", dataType: "s", dataTypeMeta: "string", optional: true },
            "Q": { header: "isPlaceholder", displayName: "Is Placeholder", dataType: "s", dataTypeMeta: "string", option: ["YES", "NO"] },
            "R": { header: "isOneYear", displayName: "Is One Year", dataType: "s", dataTypeMeta: "string", option: ["YES", "NO"] },
        };

        return Promise.resolve(programmeSchemesColumns);
    } catch (error) {
        return Promise.reject(error);
    }
}

/**
 * @description function to get column name by header
 * @param {Object} schemeColumns
 * @param {String} header
 * @returns {String} column name
*/
const getColumn = (schemeColumns, header) => Object.keys(schemeColumns).find((column) => schemeColumns[column].header == header);

/**
 * @description function to get scheme import template
 * @param {ObjectId} regulationId
 * @param {ObjectId} programmeId
 * @param {String} fileName
 * @returns {Promise<String>} filePath
 */
async function schemeTemplate(regulationId, programmeId, fileName) {
    try {

        const workBook = xlsx.utils.book_new();

        let schemeColumns = await getSchemeImportColumns(regulationId);

        //add vertical option on template
        let { verticals } = await programmeRegulations.getOne({ regulationId, "prgm.id": programmeId }, { verticals: 1 });
        schemeColumns[getColumn(schemeColumns, "vertical")].option = verticals || [];

        let partType = await attributes.distinctValues("values.name", { name: "partType", "module": "regulations" });
        schemeColumns[getColumn(schemeColumns, "partType")].option = partType || [];

        let creditIds = await regulations.distinct("creditIds", { _id: regulationId });

        let creditPatterns = await credits.getBy({ _id: { $in: creditIds } }, { _id: 0, lecture: "$hoursPerWeek.lecture", tutorial: "$hoursPerWeek.tutorial", practical: "$hoursPerWeek.practical", credits: 1 });

        let templateData = [];

        let headers = Object.keys(schemeColumns).map((key) => schemeColumns[key].displayName);

        templateData.push(headers);

        Object.keys(schemeColumns).map((key, index) => {

            if (Object.keys(schemeColumns[key]).includes("option")) {
                schemeColumns[key].option.map((value, row) => {
                    templateData[row + 1] ||= [];
                    templateData[row + 1][index] = value;
                });
            }

            if (['lectureHours', 'tutorialHours', 'practicalHours', 'credits'].includes(schemeColumns[key].header)) {
                creditPatterns.forEach((pattern, row) => {
                    let rowIndex = row + 1;

                    templateData[rowIndex] ||= [];

                    if (schemeColumns[key].header === "lectureHours") {
                        templateData[rowIndex][index] = pattern.lecture || 0;
                    } else if (schemeColumns[key].header === "tutorialHours") {
                        templateData[rowIndex][index] = pattern.tutorial || 0;
                    } else if (schemeColumns[key].header === "practicalHours") {
                        templateData[rowIndex][index] = pattern.practical || 0;
                    } else if (schemeColumns[key].header === "credits") {
                        templateData[rowIndex][index] = pattern.credits || 0;
                    }
                });
            }
        });

        let workSheet = xlsx.utils.aoa_to_sheet(templateData);
        xlsx.utils.book_append_sheet(workBook, workSheet, "Courses");
        let filePath = await fileService.getPath(__dirname, config.paths.downloadDir, fileName);
        xlsx.writeFile(workBook, filePath);
        return Promise.resolve(filePath);

    } catch (e) {
        return Promise.reject(e);
    }
}

export default { getSchemeImportColumns, schemeTemplate };
