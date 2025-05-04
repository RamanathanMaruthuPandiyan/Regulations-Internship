import morgan from 'morgan';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createStream } from 'rotating-file-stream';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const config = require(`../config/config.${process.env.NODE_ENV}.json`);
var logConfig = config.logConfig.httpRequestLog;
var logDirectory = join(__dirname + "/..", 'log');
existsSync(logDirectory) || mkdirSync(logDirectory);

// create a rotating write stream
var options = logConfig.rfsOptions;
options.path = logDirectory;
var logStream = createStream(logConfig.fname, options);

var logger = morgan(logConfig.format, { stream: logStream });

export default logger;