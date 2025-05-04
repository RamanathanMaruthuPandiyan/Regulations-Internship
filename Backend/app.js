import express, { json, urlencoded, static as expressStatic } from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import httpRequestLogger from './logging/httpRequestLogger.js';
import cron from './services/cron.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const config = require(`./config/config.${process.env.NODE_ENV}.json`);
const serverConfig = config.serverConfig;
const app = express();

if (serverConfig.maintenanceMode) {
    app.get('/', function (req, res) {
        res.sendfile('maintenance.html', { root: __dirname + "/public" });
    });
}

if (serverConfig.behindHttps) {
    app.use(function (req, res, next) {
        if ((!req.secure) && (req.get('X-Forwarded-Proto') !== 'https')) {
            res.redirect('https://' + req.get('Host') + req.url);
        } else
            next();
    });
}

// view engine setup
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'hbs');

const corsOptions = {
    origin: config.corsWhiteList["regulations-ui"].urls
};

app.use(cors(corsOptions));
app.use(httpRequestLogger);
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressStatic(join(__dirname, 'public')));

import branding from './routes/branding.js';
import attributes from "./routes/attributes.js";
import credits from "./routes/credits.js";
import grades from "./routes/grades.js";
import evaluationSchemes from './routes/evaluationSchemes.js';
import regulations from "./routes/regulations.js";
import prgmRegulations from './routes/prgmRegulations.js';
import courses from "./routes/courses.js";
import sync from "./routes/sync.js";
import enums from "./routes/enums.js";
import departments from "./routes/departments.js";
import batchYears from './routes/regulationBatchYear.js';
import auth from './routes/auth.js';
import users from './routes/users.js';
import groups from "./routes/integrations/groups.js";
import students from "./routes/integrations/students.js";
import s3 from './routes/s3.js';
import jobs from './routes/jobs.js';
import logs from './routes/logs.js';

app.use('/branding', branding);
app.use("/attributes", attributes);
app.use("/credits", credits);
app.use("/grades", grades);
app.use("/evaluation/schemes", evaluationSchemes);
app.use("/regulations", regulations);
app.use("/programme/regulations", prgmRegulations);
app.use("/regulation/batch/years", batchYears);
app.use("/courses", courses);
app.use("/departments", departments);
app.use("/sync", sync);
app.use('/auth', auth);
app.use('/users', users);
app.use("/enums", enums);
app.use("/groups", groups);
app.use("/students", students);
app.use('/s3', s3);
app.use('/jobs', jobs);
app.use('/logs', logs);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

export default app;
