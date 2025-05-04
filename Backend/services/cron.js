import regulationBatchYear from "./regulationBatchYear.js";

import { schedule } from "node-cron";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const config = require(`../config/config.${process.env.NODE_ENV}.json`);

schedule(config.jobTiming, async () => {
    await regulationBatchYear.execute();
});

export default schedule;