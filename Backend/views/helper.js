import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
const __dirname = fileURLToPath(new URL('.', import.meta.url));

handlebars.registerHelper('isExists', function (value, options) {
    if (value) {
        return options.fn(this);
    }
    return options.inverse(this);
});

function getTemplate(params, templateName) {
    const html = readFileSync(resolve(__dirname + '/../email/templates', templateName), 'utf8').toString();
    const template = handlebars.compile(html);
    return template(params)
}

export {
    getTemplate,
};