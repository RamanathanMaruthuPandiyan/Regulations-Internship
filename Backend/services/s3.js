import { createRequire } from 'module';
import path from 'path';
const require = createRequire(import.meta.url);
const config = require(`../config/config.${process.env.NODE_ENV}.json`);
const awsS3Config = config.aws;
import uuid from 'uuid-random';

//Import s3 related functionalities
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function getS3Configuration() {
    try {
        var s3Configuration = new S3Client({
            credentials:
            {
                accessKeyId: awsS3Config.accessKeyId,
                secretAccessKey: awsS3Config.accessKeySecret
            },
            region: awsS3Config.region
        });
        return s3Configuration;
    } catch (err) {
        throw new Error("Failed to get aws configuration");
    }
}

function getS3UploadFileObject(query) {
    try {
        return {
            fileName: query.fileName,
            filePath: generateFilePath(query.fileName, query.type)
        }
    } catch (e) {
        throw e;
    }
}

function generateFilePath(file, type) {
    try {
        return `regulations-${config.clientInfo.shortName}` + '/' + type + '/' + uuid() + new Date().toISOString() +
            path.parse(file).ext;
    } catch (e) {
        console.log(e);
    }
}

/**
 * @description to get signed url while uploading a file
 * @param {Object} query with fileType, fileName
 * @returns {Promise<Object>} signed url
 */
async function getS3SignedUrl(query) {
    try {
        if (!query || !query.type || !query.fileName) {
            throw new Error("Invalid payload for signed url");
        }

        const s3 = await getS3Configuration();
        const s3FileObject = getS3UploadFileObject(query);

        const params = {
            Bucket: awsS3Config.bucketName,
            Key: s3FileObject.filePath,
        };

        const command = new PutObjectCommand(params);
        const options = { expiresIn: awsS3Config.maxTimeToUploadInSecs };
        const url = await getSignedUrl(s3, command, options);

        const resp = {
            signedUrl: url,
            fileName: s3FileObject.fileName,
            filePath: s3FileObject.filePath
        };

        return Promise.resolve(resp);

    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * @description to get signedUrl while viewing a file
 * @param {Object} s3FileObject
 * @returns {Promise<Object>} signed url
 */
async function getSignedUrlForGetObject(s3FileObject) {
    try {
        if (!s3FileObject || !s3FileObject.url) {
            throw new Error("Missing file url");
        }

        const s3 = await getS3Configuration();

        const params = {
            Bucket: awsS3Config.bucketName,
            Key: s3FileObject.url
        };

        const command = new GetObjectCommand(params);
        const options = { expiresIn: awsS3Config.maxTimeToDownloadInSecs };
        const data = await getSignedUrl(s3, command, options);

        return Promise.resolve(data);

    } catch (e) {
        return Promise.reject(e);
    }
}

export default {
    getS3SignedUrl,
    generateFilePath,
    getSignedUrlForGetObject
}