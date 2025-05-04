import axios from 'axios';
const baseURL = "http://localhost:8143"; // Replace with your actual base URL

/**
   * Custom hook to GET method
   * @param url
*/

axios.defaults.headers.common['Access-Control-Allow-Origin'] = baseURL;

axios.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    if (error.code == "ERR_NETWORK") {
        error.response = { data: { message: error.message } }
    }
    return Promise.reject(error);
});

export const getData = async (url, options = {}) => {
    try {
        const response = await axios.get(`${baseURL}/${url}`, options);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
   * Custom hook to POST method
   * @param url && @param data
*/

export const postData = async (url, data, options = {}) => {
    try {
        const response = await axios.post(`${baseURL}/${url}`, data, options);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
   * Custom hook to PUT method
   * @param url && @param updatedData
*/

export const putData = async (url, updatedData, options = {}) => {
    try {
        const response = await axios.put(`${baseURL}/${url}`, updatedData, options);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
   * Custom hook to DELETE method
   * @param url
*/

export const deleteData = async (url, data = {}) => {
    try {
        const response = await axios.delete(`${baseURL}/${url}`, { data });
        return response.data;
    } catch (error) {
        throw error;
    }
};
