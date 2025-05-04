import React, { createContext, useState, useContext, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { getData, postData } from '../../../Services/ApiServices';

import { useAlertMsg } from '../../../Services/AllServices';
import AlertComponent from '../../../Components/AlertComponent';
import Loader from '../../../Components/Loader';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {

    //Params
    const { programId, regulationId } = useParams();

    //Loader
    const [loading, setLoading] = useState(false);

    //Alert
    const { alert, alertMessage, callAlertMsg } = useAlertMsg();

    const [courses, setCourses] = useState([]);

    //Enum Data
    const [enumCoursesStatus, setEnumCoursesStatus] = useState([]);
    const [enumCoursesDisplayStatus, setEnumCoursesDisplayStatus] = useState([]);
    const [actionItemData, setActionItemData] = useState([]);

    // Constant Data
    const [constantData, setConstantData] = useState();
    //Add Course Field Data
    const [fetchAddData, setfetchAddData] = useState({});

    const [offeringDeptOptions, setOfferingDeptOptions] = useState([]);

    const [isCloneAllowed, setIsCloneAllowed] = useState(false);

    // Modal
    const [modal, setModal] = useState({ addCourseModal: false, confirmModal: false, confirmModalFreeze: false, cloneModal: false });

    const modalToggle = (obj) => {
        setModal({ ...modal, ...obj });
    }

    // To get the constant data.
    const getConstants = async () => {
        const url = 'courses/constants';
        try {
            const result = await getData(url);
            setConstantData(result);
        } catch (error) {
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    // Enum Courses status for dropdown
    const getCourseEnum = async () => {
        const url = 'enums/courses';
        try {
            const result = await getData(url);
            setEnumCoursesStatus(result.status);
            setEnumCoursesDisplayStatus(result.displayStatus);
        } catch (error) {
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    //Enum Action Item
    const getActionEnum = async () => {
        const url = 'enums/actionItems';
        try {
            const result = await getData(url);
            setActionItemData(result);
        } catch (error) {
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    //Get all the courses for the pagination
    const coursesPagination = async () => {
        setLoading(true);
        try {
            const result = await getData(`courses/${regulationId}/${programId}`);
            setIsCloneAllowed(result.isCloneAllowed)
            setCourses(result.coursesData);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    //Add Course Modal Dropdown SelectBox Data
    const getFetchAddData = async () => {
        const url = 'courses/fetch/add';
        const data = {
            'regId': regulationId,
            'prgmId': programId
        }
        try {
            const fetchAddData = await postData(url, { ...data });

            if (Object.keys(fetchAddData).length) {
                Object.keys(fetchAddData).forEach(key => {
                    if (key === 'freezedSemesters') {
                        return;
                    }
                    if (Array.isArray(fetchAddData[key])) {
                        fetchAddData[key] = fetchAddData[key].map(item => {
                            if (typeof item === 'object') {
                                return { value: item._id, label: item.name };
                            } else {
                                return { value: item, label: item };
                            }
                        });
                    }
                });
            }
            fetchAddData["partType"].unshift({ value: null, label: "Not-applicable" });
            setTimeout(function () {
                setfetchAddData(fetchAddData);
            }, 100)
        } catch (error) {
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    const getOfferingDepartment = async () => {
        setLoading(true);
        const url = 'departments/distinct';
        try {
            let offeringDept = await getData(url);
            offeringDept = offeringDept.map((dept) => ({ value: { name: dept.name, category: dept.category }, label: `${dept.name} - ${dept.category}` })) || [];
            setOfferingDeptOptions(offeringDept);
        } catch (error) {
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    useEffect(() => {
        getCourseEnum();
        getActionEnum();
        getFetchAddData();
        getOfferingDepartment();
        getConstants();
    }, [])


    return (
        <AppContext.Provider value={{
            setLoading,
            callAlertMsg,
            programId,
            regulationId,
            fetchAddData,
            enumCoursesStatus,
            enumCoursesDisplayStatus,
            actionItemData,
            modal,
            modalToggle,
            coursesPagination,
            courses,
            offeringDeptOptions,
            getFetchAddData,
            constantData,
            isCloneAllowed
        }}>
            {/* Alert */}
            <AlertComponent alertMessage={alertMessage} alert={alert} />

            {/* Loader */}
            <Loader loading={loading} />

            {children}
        </AppContext.Provider>
    );
};