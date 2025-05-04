import xlsx from 'xlsx';
import rmfr from 'rmfr';
import { platform } from 'os';
import { resolve, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const config = require('../config/config.' + process.env.NODE_ENV);
const __dirname = resolve();

/**
 * @description Determines the root level of a directory.
 * @param {String} dir The directory path.
 * @returns {String} The relative path to the root level.
 */
export function getRootLevel(dir) {
    try {
        let pathArray = (platform() == "win32") ? (dir.split("\\")) : (dir.split("/"));
        let index = pathArray.indexOf(config.rootFolderName);

        if (index == -1) {
            return dir;
        }

        let length = pathArray.splice(index).length;
        var levelUp = "";

        for (let i = 0; i < length; i++) {
            levelUp += "../";
        }

        return levelUp;
    } catch (e) {
        throw new Error("Failed to get root level");
    }
}

/**
 * @description Constructs the path for a file within a destination folder.
 * @param {String} dir The directory path.
 * @param {String} destinationFolder The destination folder.
 * @param {String} fileName The name of the file.
 * @returns {Promise<String>} A promise resolving to the constructed file path.
 */
function getPath(dir, destinationFolder, fileName) {
    try {
        let level = getRootLevel(dir);

        if (!existsSync(resolve(dir, level + destinationFolder))) {
            mkdirSync(resolve(dir, level + destinationFolder));
        }

        let address = join(dir, level, destinationFolder, fileName);
        return Promise.resolve(address);
    } catch (error) {
        return Promise.reject("Error while creating path to store the imported files");
    }
};

/**
 * @description Writes data to an Excel file.
 * @param {Array<Object>} excelData Array of objects representing data for the Excel file.
 * @param {String} fileName The name of the Excel file.
 * @param {String} [sheetName="Sheet1"] The name of the worksheet.
 * @returns {Promise<String>} A promise resolving to the file path of the written Excel file.
 */
export async function writeExcel(excelData, fileName, sheetName = "Sheet1") {
    try {
        const book = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(excelData);
        xlsx.utils.book_append_sheet(book, ws, sheetName);
        let filePath = await getPath(__dirname, config.paths.downloadDir, fileName);
        xlsx.writeFile(book, filePath);
        return Promise.resolve(filePath);
    } catch (err) {
        return Promise.reject(err);
    }
};

/**
 * @description Removes a file or directory.
 * @param {String} filePath The path to the file or directory to be removed.
 * @returns {Promise<void>} A promise resolving when the file or directory is removed successfully.
 */
async function remove(filePath) {
    try {
        let res = await rmfr(filePath);
        return Promise.resolve(res);
    } catch (err) {
        return Promise.reject(err);
    }
}

export default { getPath, remove, writeExcel };