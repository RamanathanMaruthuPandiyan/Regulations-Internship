import { createLogger } from 'bunyan';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join } from 'path';
import RotatingFileStream from 'bunyan-rotating-file-stream';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const config = require(`../config/config.${process.env.NODE_ENV}.json`);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const logConfig = config.logConfig.emailLog;
const logDirectory = join(__dirname + "/..", 'log');

existsSync(logDirectory) || mkdirSync(logDirectory);

// create a rotating write stream
logConfig.path = join(logDirectory, logConfig.fname);

const logger = createLogger({
    name: 'emailLogger',
    streams: [{
        "stream": new RotatingFileStream(logConfig)
    }
    ]
});

export default logger;