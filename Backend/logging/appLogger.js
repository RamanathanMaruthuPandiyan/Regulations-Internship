import bunyan from 'bunyan';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createLogger, stdSerializers } = bunyan;
const config = require(`../config/config.${process.env.NODE_ENV}.json`);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const logConfig = config.logConfig.appLog;
const logDirectory = join(__dirname + "/..", 'log');

existsSync(logDirectory) || mkdirSync(logDirectory);

// create a rotating write stream
const stream = logConfig.streamConfig;
stream.path = join(logDirectory, logConfig.streamConfig.fname);

const logger = createLogger({
    name: 'appLogger',
    serializers: stdSerializers,
    streams: [stream]
});

export default logger;