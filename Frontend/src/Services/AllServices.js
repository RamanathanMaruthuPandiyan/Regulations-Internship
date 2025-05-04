import { useState, useCallback } from 'react';
import { getData } from './ApiServices';
import axios from 'axios';

const booleanSet = new Set([false, true]);

export const useAlertMsg = () => {
    const [alertMessage, setAlertMessage] = useState(null);
    const [alert, setAlert] = useState('');

    const callAlertMsg = useCallback((msg, category) => {
        if (booleanSet.has(msg) && !msg) {
            setAlertMessage(false);
        } else {
            let timeOut;
            if (!msg) {
                clearTimeout(timeOut);
                return;
            }
            window.scrollTo(0, 0);
            setAlertMessage(msg);
            setAlert(category);

            timeOut = setTimeout(() => {
                setAlertMessage(false);
            }, 10000);
        }
    }, []);

    return { alert, alertMessage, callAlertMsg }
}

//custom hook for  input number allow specific character and limit

export const handleNumberChangeEvalScheme = (field) => (e) => {
    const value = e.target.value;
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue <= 0) {
        field.onChange('');
    } else {
        field.onChange(parsedValue);
    }
};

export const handleNumberChange = (field) => (e) => {
    const value = e.target.value;
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
        field.onChange('');
    } else {
        field.onChange(parsedValue);
    }
};

export const validateNumber = (e, field) => {
    const value = parseFloat(e.target.value);
    const regex = /^[0-9][0-9]*(\.5)?$/;
    if (regex.test(value) || value === '') {
        field.onChange(value);
    } else if (value < 0) {
        field.onChange('');
    } else {
        field.onChange(parseInt(value));
    }
};

export const downloadFile = (object, fileType, fileName) => {
    const blob = new Blob(object, { type: fileType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

export const uploadS3 = async (file) => {
    try {
        const url = "s3/upload/url";
        const params = { fileName: file.name, type: file.type };
        const options = {
            headers: {
                'Content-Type': file.type,
                'Authorization': null
            }
        };

        //get signed url
        let response = await getData(url, { params });

        // Upload file to S3
        let result = await axios.put(response.signedUrl, file, options);

        return Promise.resolve(response);
    } catch (error) {
        throw error;
    }
}

export const rejectedFileSize = (rejectedSizeInBytes, small) => {
    let rejectedFile = rejectedSizeInBytes.match(/\d/g);
    let msg = '';
    if (rejectedFile && rejectedFile.length) {
        rejectedFile = rejectedFile.join("");
        const size = (rejectedFile / (1024 * 1024)).toFixed(0);
        if (small) {
            msg = `File is smaller than ${size} MB.`;
        } else {
            msg = `File is larger than ${size} MB.`;
        }
    }
    return msg;
}

// statusColors.js
export const enumColors = {
    'DR': 'status-badge-secondary',
    'AP': 'status-badge-success',
    'RC': 'status-badge-danger',
    'WA': 'status-badge-warning',
};