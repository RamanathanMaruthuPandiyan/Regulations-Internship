function defineEnum(enumFields) {
    const enumType = {
        values: {},
        descriptions: {},
    };

    for (let enumField of enumFields) {
        enumType[enumField.name] = enumField.value;
        enumType.values[enumField.value] = enumField.name;
        enumType.descriptions[enumField.value] = enumField.description
            ? enumField.description
            : enumField.name;
    }

    enumType.isValidValue = function (value) {
        return this.values[value] ? true : false;
    };

    enumType.isValidValueName = function (valueName) {
        return this[valueName] ? true : false;
    };

    enumType.length = Object.keys(enumType.values).length;

    Object.freeze(enumType);

    return enumType;
}
export default defineEnum;
