import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require(`../config/config.${process.env.NODE_ENV}.json`);
const clientInfo = config.clientInfo;
import sendgridmail from '../email/sendgridmail.js';
import faculty from "../services/remote/faculty.js";
import { getTemplate } from '../views/helper.js';

/**
 * @description function to fetch emails from FIS module and send email
 * @param {Array<String>} facultyIds
 * @param {Object} params - which contains subject and mail information
 * @param {String} templateName - mail template file name
 * @returns {Promise<Object>} - which contains success and failed
 */
async function mailService(facultyIds, params, templateName, success, failed) {
    try {

        let commonFields = {
            "logoUrl": clientInfo.logoUrl,
            "brandName": clientInfo.brandName,
            "url": clientInfo.url,
            "currentYear": new Date().getFullYear(),
        };

        params = Object.assign({}, commonFields, params);

        let faculties = await faculty.getEmails(facultyIds);


        for (let faculty of faculties) {
            params.name = faculty.name.toString().toLowerCase();
            let mailBody = getTemplate(params, templateName);

            let res = await sendgridmail.sendEmail(mailBody, faculty.email, params.subject);
            if (!res) {
                failed.push(faculty.id);
            } else {
                success.push(faculty.id);
            }
        }

        return Promise.resolve({ success, failed });
    } catch (e) {
        throw e;
    }
}

export default { mailService };