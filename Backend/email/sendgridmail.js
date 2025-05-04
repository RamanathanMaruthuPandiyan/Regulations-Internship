import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require(`../config/config.${process.env.NODE_ENV}.json`);
var mailServiceConfig = config.mailServiceConfig;
import { fileURLToPath } from 'url';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const mailConfig = require(`./mailConfig.json`);
import sendgrid from 'sendgrid';
const sg = new sendgrid(mailServiceConfig.apiKey);
import { vsprintf } from 'sprintf-js';
import { readFileSync } from 'fs';
const helper = sendgrid.mail;
import logger from '../logging/emailLogger.js';

async function mail(email, template, subject, params) {
    try {
        let mailTemplate = mailConfig[template];
        let templateContent = readFileSync(__dirname + "/templates/" + mailTemplate.file)
        let templateText = templateContent.toString();
        let mailBody = vsprintf(templateText, params);
        let result = await sendEmail(mailBody, email, subject);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

async function sendEmail(mailBody, email, subject) {
    try {
        let fromEmail = new helper.Email(mailServiceConfig.fromEmail);
        let toEmail = new helper.Email(mailServiceConfig.mockEmail);
        if (!mailServiceConfig.mockEmail) {
            toEmail = new helper.Email(email);
        }

        let content = new helper.Content("text/html", mailBody);
        let mail = new helper.Mail(fromEmail, subject, toEmail, content);
        let request = sg.emptyRequest({
            method: 'POST',
            path: mailServiceConfig.path,
            body: mail.toJSON()
        });
        let result = await sg.API(request);
        logger.info({ "to": email }, subject);
        return Promise.resolve(result);

    } catch (error) {
        logger.error({ "err": error, "to": email }, subject);
        return Promise.reject(error);
    }
}

export default {
    mail,
    sendEmail
}
