const semesterCount = 2;

const distributionTypes = new Set(["CA", "FE", "BOTH"]);

const validModes = new Set(["AVERAGE", "SUM", "BEST"]);

const booleanSet = new Set([true, false]);

const semesterCategories = new Set(["PE", "OE", "MC"]);

const nonSemesterCategories = new Set(["TC", "OC", "NP"]);

const verticalPlaceHolderNotAllowed = new Set(["OE", "TC", "OC", "NP", "MC"]);

const verticalAllowedSet = new Set(["PE"]);

const placeholderAllowedSet = new Set(["PE", "OE", "MC"]);

export {
    semesterCount,
    distributionTypes,
    validModes,
    booleanSet,
    nonSemesterCategories,
    verticalPlaceHolderNotAllowed,
    verticalAllowedSet,
    placeholderAllowedSet,
    semesterCategories
}