import xlsx from "xlsx";
import fileService from '../services/fileService.js';

export async function validateExcelSheet(filePath, sheetName, sheetColConfig, initRowIndex = 1, removeFile = true, contentRaw = true) {
    try {
        let workBook = xlsx.readFile(filePath, { cellDates: true, cellNF: false, cellText: false });
        let workSheet = workBook.Sheets[sheetName];

        if (!workSheet) {
            throw new Error(`Sheet name "${sheetName}" not found in the imported excel file.`);
        }

        let excelData = xlsx.utils.sheet_to_json(workSheet, { raw: contentRaw, dateNF: "YYYY-MM-DD HH:MM:SS" });
        if (!excelData || !excelData.length) {
            throw new Error(`No data found in sheet "${sheetName}"`);
        }

        let headerValidation = await validateHeader(workSheet, sheetColConfig, initRowIndex);
        let dataValidation = await validateCellData(workSheet, sheetColConfig, excelData.length + 1, initRowIndex + 1);
        let errors = headerValidation.concat(dataValidation);

        return Promise.resolve({ "data": excelData, "errors": errors });

    } catch (err) {
        if (err.message == "Cannot read property 'v' of undefined") {
            err.message = "Please check the imported file matched with the template.";
        }
        return Promise.reject(err);
    } finally {
        if (removeFile) {
            fileService.remove(filePath);
        }
    }
}

function validateHeader(workSheet, sheetColConfig, rowIndex) {
    try {
        let errors = [];

        for (let [excelColHeader, property] of Object.entries(sheetColConfig)) {
            let headerName = workSheet[excelColHeader + rowIndex].v;

            if (headerName != property.displayName) {
                errors.push(`Header name is different at ${excelColHeader + rowIndex}, header name should be ${property.displayName}`);
            }
        }

        return Promise.resolve(errors);
    } catch (err) {
        return Promise.reject(err);
    }
}

function validateCellData(workSheet, columns, totalRows, rowIndex) {
    try {

        let errorCells = { "empty": [] }, dataTypes = new Set(), optionRequiredColumn = new Set(), errors = [], optionRequired = {};
        dataTypes.add("empty");

        // initialize empty array to store datatype mismatch cells

        for (let [column, property] of Object.entries(columns)) {
            errorCells[property.dataTypeMeta] = [];
            dataTypes.add(property.dataTypeMeta);
            if (property.option) {
                optionRequired[property.option.join(" | ")] = [];
                optionRequiredColumn.add(property.option.join(" | "));
            }
        }

        for (let row = rowIndex; row <= totalRows; row++) {
            for (let [column, property] of Object.entries(columns)) {
                let cell = column + row;
                let cellContent = workSheet[cell];
                // check the datatype of cell content
                if (!property.optional && !cellContent) {
                    errorCells[property.dataTypeMeta].push(cell);
                }
                if (cellContent && !(property.dataType.includes(cellContent.t))) {
                    errorCells[property.dataTypeMeta].push(cell);
                }

                // Check String in non empty

                if (cellContent && (cellContent.t == "s" && (property.dataType.includes(cellContent.t)))) {
                    let value = (cellContent) ? ((cellContent.t == 's') ? (cellContent.v).trim() : (cellContent.v)) : '';
                    if (!value) {
                        errorCells["empty"].push(cell);
                    }
                }

                // Check values are form options given in Excel

                if (cellContent && property.option) {
                    if (workSheet[cell] && workSheet[cell].t == "s") {
                        if (!property.option.includes((workSheet[cell].v).toString().trim().toUpperCase())) {
                            optionRequired[property.option.join(" | ")].push(cell)
                        }
                    }
                    else {
                        if (workSheet[cell] && workSheet[cell].v && !property.option.includes(workSheet[cell].v)) {
                            optionRequired[property.option.join(" | ")].push(cell)
                        }
                    }
                }
            }
        }

        
        let errorTypes = [...dataTypes], optionalTypes = [...optionRequiredColumn];

        for (let errorType of errorTypes) {
            if (errorCells[errorType].length) {
                if (errorType != "empty") {
                    errors.push(`Cannot import from Excel! The values for the cells ${errorCells[errorType].toString()} in the excel document should be in the ${errorType} format.`)
                }
                else {
                    errors.push(`Cannot import from Excel! There are missing values for the cell numbers ${errorCells[errorType].toString()} in the excel document.`)
                }
            }
        }

        for (let type of optionalTypes) {
            if (optionRequired[type].length) {
                errors.push(`Cannot import from Excel! The values for the cells ${optionRequired[type].toString()} in the excel document should be from the option [${type}].`)
            }
        }

        return Promise.resolve(errors);
    } catch (e) {
        return Promise.reject(e);
    }
}

export default validateExcelSheet;