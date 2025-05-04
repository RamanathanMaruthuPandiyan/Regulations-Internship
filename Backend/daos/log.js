import { BaseDao } from './base.js';
const dao = BaseDao("logs_regulations");

/**
 * @description A function to record all the logs of this module.
 * @param {String} entity Collection name.
 * @param {String} action The performed action such as CREATE,DELETE,UPDATE.
 * @param {String} by The user.
 * @param {String} msg The message in detail.
 */
async function regulationLog(entity, action, by, msg) {
    try {
        let info = {
            entity: entity?.toString().trim().toUpperCase(),
            action: action?.toString().trim().toUpperCase(),
            on: new Date(),
            by: by,
            msg: msg
        }
        await dao.create(info);
    } catch (e) {
    }
}

export {
    regulationLog
}
