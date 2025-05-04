import { BaseDao, readOnly } from "./base.js";
const dao = BaseDao("programmes");
const read = readOnly("programmes");

export default {
    ...dao,
    ...read
};
