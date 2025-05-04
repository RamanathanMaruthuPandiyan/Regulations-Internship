import { getDb, ObjectId } from './MongoDbUtil.js';

const updateOps = {
    "SET": "$set",
    "UNSET": "$unset",
    "PULL": "$pull",
    "PUSH": "$push",
    "ADDTOSET": "$addToSet",
    "INC": "$inc"
}

/**
 *
 * @param {Object} record - valid JSON object
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>} - JSON Object with id created
 */
async function create(record, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {
        let result = await collection.insertOne(record, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {Array<Object>} records - valid array of JSON Objects
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>}  - JSON Object with ids created
 */
async function createMany(records, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {
        let result = await collection.insertMany(records, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {Object} query - condition to filter value form the collection of object
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Number>}  Number of records matches
 */
async function count(query, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {
        let result = await collection.count(query, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {Object} projection - valid key values paires to project / show particalar values form the collection of object
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Array<Object>>} - records in the collection
 */
async function getAll(projection = {}, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {
        options = Object.assign(options, { "projection": projection });
        let result = await collection.find({}, options).toArray();
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {String|ObjectId} id - hash code string / bson - ObjectId
 * @param {Object} projection - valid key values paires to project / show particalar values form the collection of object
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>} - record that matches the condition
 */
async function get(id, projection = {}, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {
        options = Object.assign(options, { "projection": projection });
        let result = await collection.findOne({ _id: ObjectId(id) }, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
};

/**
 *
 * @param {Object} query - condition to filter value form the collection of object
 * @param {Object} projection - valid key values paires to project / show particalar values form the collection of object
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>} - first record that matches the condition
 */
async function getOne(query, projection = {}, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {
        options = Object.assign(options, { "projection": projection });
        let result = await collection.findOne(query, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
};

/**
 *
 * @param {Object} query - condition to filter value form the collection of object
 * @param {Object} projection - valid key values paires to project / show particalar values form the collection of object
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Array<Object>>} - records that matches the condition
 */
async function getBy(query, projection = {}, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {
        options = Object.assign(options, { "projection": projection });
        let result = await collection.find(query, options).toArray();

        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
};


/**
 *
 * @param {Object} preQuery - Base collection match query
 * @param {Object} option - Skip, Limit number of records.
 * @param {Object} sort - Sort fields.
 * @param {Array<Object>} blPipeline - Bussines logic like lookup, project, group, .., etc.
 * @param {Object} postQuery - Query needs to apply after bussines logic.
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Array<Object>>} - records that matches the condition
 * @note If this pagination needs to be override write a function overRidePagination with proper params in specific dao file.
 */
async function basicPagination(preQuery, option, sort, blPipeline = [], postQuery = {}, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    let pipeline = [];

    // append base query
    pipeline.push({ "$match": preQuery });
    let facet = { "records": [], "count": [] };
    // append lookup in records filter pipeline
    facet.records = facet.records.concat(blPipeline);
    facet.count = facet.count.concat(blPipeline);
    // if post lookup qurey exists append the query in record filter pipeline & in count pipeline
    if (Object.keys(postQuery).length) {
        facet.records.push({ "$match": postQuery });
        facet.count.push({ "$match": postQuery });
    }
    // limit option for the record filter
    facet.records.push({ "$sort": sort });
    facet.records.push({ "$skip": (option.skip || 0) });
    facet.records.push({ "$limit": (option.limit || 15) });
    // get count number of records
    facet.count.push({ "$count": "totalRecords" });
    // append facet in pipeline
    pipeline.push({ "$facet": facet });
    try {
        let results = await collection.aggregate(pipeline, options).toArray();

        let [result] = results
        let { records, count } = result;
        if (!count.length) {
            count.push({ totalRecords: 0 });
        }
        let response = {
            records: records,
            recordLength: records.length,
            totalRecords: count[0].totalRecords
        }
        return Promise.resolve(response);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {Object} preQuery - Base collection match query
 * @param {Object} option - Skip, Limit number of records.
 * @param {Object} sort - Sort fields.
 * @param {Array<Object>} blPipeline - Bussines logic like lookup, project, group, .., etc.
 * @param {Object} postQuery - Query needs to apply after bussines logic.
 * @returns {Promise<Array<Object>>} - records that matches the condition
 * @note If this pagination needs to be override write a function overRidePagination with proper params in specific dao file.
 */
async function limitedPagination(preQuery, option, sort, blPipeline = [], postQuery = {}, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    let pipeline = [];

    // append base query
    pipeline.push({ "$match": preQuery });
    let facet = { "records": [], "count": [] };

    // limit option for the record filter
    facet.records.push({ "$sort": sort });
    facet.records.push({ "$skip": (option.skip || 0) });
    facet.records.push({ "$limit": (option.limit || 15) });

    // append lookup in records filter pipeline
    facet.records = facet.records.concat(blPipeline);

    // if post lookup query exists append the query in record filter pipeline
    if (Object.keys(postQuery).length) {
        facet.records.push({ "$match": postQuery });
        facet.count.push({ "$match": postQuery });
    }

    // get count number of records
    facet.count.push({ "$count": "totalRecords" });

    // append facet in pipeline
    pipeline.push({ "$facet": facet });

    try {
        let results = await collection.aggregate(pipeline, options).toArray();
        let [result] = results;
        let { records, count } = result;
        if (!count.length) {
            count.push({ totalRecords: 0 });
        }
        let response = {
            records: records,
            recordLength: records.length,
            totalRecords: count[0].totalRecords
        }
        return Promise.resolve(response);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {String} field - Field name for which unique values has to be retrived
 * @param {Object} query - condition to filter value form the collection of object
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Array<String|Number..>>}  Unique value in flat array form
 */
async function distinct(field, query = {}, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {
        let result = await collection.distinct(field, query, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {Object} query - condition to filter value form the collection of object
 * @param {String} operation - name that represent the atomic operations SET/PULL/PUSH/..
 * @param {Object} detail - valid JSON Object without value _id
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>} - Object with nMatched, nModified count.
 */
async function updateMany(query, operation, detail, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {

        if (!updateOps[operation]) {
            throw new Error("invalid atomic operator on update");
        }

        let detailToUpdate = {};
        detailToUpdate[updateOps[operation]] = detail;

        let result = await collection.updateMany(query, detailToUpdate, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {Object} query - condition to filter value form the collection of object
 * @param {String} operation - name that represent the atomic operations SET/PULL/PUSH/..
 * @param {Object} detail - valid JSON Object without value _id
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>} - Object with nMatched, nModified count.
 */
async function updateOne(query, operation, detail, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {

        if (!updateOps[operation]) {
            throw new Error("invalid atomic operator on update");
        }

        let detailToUpdate = {};
        detailToUpdate[updateOps[operation]] = detail;

        let result = await collection.updateOne(query, detailToUpdate, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {String} id - hash code string / bson - ObjectId
 * @param {String} operation - name that represent the atomic operations SET/PULL/PUSH/..
 * @param {Object} detail - valid JSON Object without value _id
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>} - Object with nMatched, nModified count.
 */
async function update(id, operation, detail, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    delete detail._id;

    try {

        if (!updateOps[operation]) {
            throw new Error("invalid atomic operator on update");
        }

        let detailToUpdate = {};
        detailToUpdate[updateOps[operation]] = detail;

        let result = await collection.updateOne({ _id: ObjectId(id) }, detailToUpdate, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {Array<Object>} pipeline - Array of object with logics $match, $project, $group, $lookup ..
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Array<Object>>} - records that matches the condition
 */
async function aggregate(pipeline, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {
        let results = await collection.aggregate(pipeline, options).toArray();
        return Promise.resolve(results);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {String} id - hash code string / bson - ObjectId
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>} - Object with nRemoved count.
 */
async function remove(id, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {
        let result = await collection.deleteOne({ _id: ObjectId(id) }, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {Object} query - condition to filter value form the collection of object
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>} - Object with nRemoved count.
 */
async function removeBy(query, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {
        let result = await collection.deleteMany(query, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {Array<Object>} bulk - Array of object with set of write operation like insert/udpate/remove
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>} - Object with upserted/removed count.
 */
async function bulkWrite(bulk, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {
        let result = await collection.bulkWrite(bulk, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
};

/**
 *
 * @param {Object} query - condition to filter value form the collection of object
 * @param {Array<Object>} records - Array of object with the atomic operations SET/PULL/PUSH/..
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>} - Object with nMatched, nModified count.
 */
async function updateOneMultiOps(query, records, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());

    let detailToUpdate = {};
    for (let record of records) {
        if (!updateOps[record.operation]) {
            throw new Error("invalid atomic operator on update");
        }
        detailToUpdate[updateOps[record.operation]] = record.details;
    }
    try {
        let result = await collection.updateOne(query, detailToUpdate, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {Object} query - condition to filter value form the collection of object
 * @param {Array<Object>} records - Array of object with the atomic operations SET/PULL/PUSH/..
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>} - Object with nMatched, nModified count.
 */
async function updateManyMultiOps(query, records, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());

    let detailToUpdate = {};
    for (let record of records) {
        if (!updateOps[record.operation]) {
            throw new Error("invalid atomic operator on update");
        }

        detailToUpdate[updateOps[record.operation]] = record.details;
    }

    try {
        let result = await collection.updateMany(query, detailToUpdate, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {String} id - hash code string / bson - ObjectId
 * @param {String} operation - name that represent the atomic operations SET/PULL/PUSH/..
 * @param {Object} detail - valid JSON Object without value _id
 * @param {Object[]} arrayFilters
 * @param {Object} [options] - like transaction session object
 * @returns {Promise<Object>} - Object with nMatched, nModified count.
 */
async function arrayFilterUpdate(query, operation, detail, arrayFilters, options = {}) {
    let db = getDb();
    let collection = db.collection(this.getCollectionName());
    try {

        if (!updateOps[operation]) {
            throw new Error("invalid atomic operator on update");
        }

        let detailToUpdate = {};
        detailToUpdate[updateOps[operation]] = detail;

        options = Object.assign(options, { "arrayFilters": arrayFilters });

        let result = await collection.updateOne(query, detailToUpdate, options);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

/**
 *
 * @param {Array<String>} projectFields - list of field names to project
 * @returns { Object } - an object with projection fields
 */
function getProjectObj(projectFields = []) {
    try {
        const projectObj = {};
        for (let fieldName of projectFields) {
            if ([undefined, null].includes(fieldName)) {
                continue;
            }

            projectObj[fieldName] = 1;
        }

        return projectObj;
    } catch (error) {
        throw error;
    }
}

function toObjectId(objectIds) {
    return objectIds.map(id => ObjectId(id));
}

export function BaseDao(collectionName) {
    return {
        aggregate: aggregate,
        arrayFilterUpdate: arrayFilterUpdate,
        basicPagination: basicPagination,
        limitedPagination: limitedPagination,
        bulkWrite: bulkWrite,
        count: count,
        create: create,
        createMany: createMany,
        distinct: distinct,
        getAll: getAll,
        get: get,
        getBy: getBy,
        getCollectionName: function () {
            return collectionName;
        },
        getDb: getDb,
        getOne: getOne,
        getProjectObj: getProjectObj,
        remove: remove,
        removeBy: removeBy,
        toObjectId: toObjectId,
        update: update,
        updateMany: updateMany,
        updateOne: updateOne,
        updateOneMultiOps: updateOneMultiOps,
        updateManyMultiOps: updateManyMultiOps
    };
};

export function readOnly(collectionName) {
    return {
        aggregate: aggregate,
        basicPagination: basicPagination,
        limitedPagination: limitedPagination,
        count: count,
        distinct: distinct,
        getAll: getAll,
        get: get,
        getBy: getBy,
        getCollectionName: function () {
            return collectionName;
        },
        getDb: getDb,
        getOne: getOne,
        getProjectObj: getProjectObj,
        toObjectId: toObjectId
    };
};