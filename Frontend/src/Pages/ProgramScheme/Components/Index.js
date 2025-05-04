import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import BackArrow from '../../../Assets/images/regulationHeader/arrow-back.svg';
import Icons from '../../../Components/Icons';
import InputText from '../../../Components/InputText';
import Selector from '../../../Components/Selector';
import BasicInfo from './BasicInfo';
import VerticalNames from './VerticalNames';
import Semesters from './Semesters';
import Alert from "../../../Components/Alert.js";
import AlertComponent from '../../../Components/AlertComponent';
import RadioButton from '../../../Components/RadioButton';
import { Link, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone'
import { getData, postData, putData } from '../../../Services/ApiServices';
import { useForm, Controller } from 'react-hook-form';
import '../../../Assets/css/components/dropzone.css';
import { useAppContext } from '../Context/Context';
import { useAlertMsg, downloadFile, rejectedFileSize } from '../../../Services/AllServices';
import '../../../Assets/css/components/alerts.css';
import { useAppContext as useKeycloakContext } from '../../../Keycloak/InitiateKeycloak';

const SchemeDetail = () => {

    const navigate = useNavigate();
    const location = useLocation();

    const { keycloak } = useKeycloakContext();
    const { programId: programmeId } = useParams();

    const { setLoading,
        fetchAddData,
        modal,
        modalToggle,
        regulationId,
        programId,
        callAlertMsg,
        coursesPagination,
        courses,
        offeringDeptOptions,
        enumCoursesStatus,
        constantData,
        getFetchAddData,
        isCloneAllowed } = useAppContext();

    const { control, handleSubmit, formState: { errors }, setValue, reset, getValues, clearErrors, watch, setError } = useForm({
        defaultValues: {
            addCourse: { isOneYear: false, isVertical: false, isPlaceholder: false, semester: "", code: "", title: "", type: "", category: "", evaluationName: "", creditName: "", offeringDept: "", partType: "", verticalName: "", prerequisites: "", reason: "" }
        }
    }); //hook destructured

    const [isAlertArray, setIsAlertArray] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const modalRef = useRef(null);

    const [prerequisiteOptions, setPrerequisiteOptions] = useState([]);

    const { alert: aleartModal, alertMessage: alertMessageModal, callAlertMsg: callAlertMsgModal } = useAlertMsg();
    const { alert: alertCloneModal, alertMessage: alertCloneMessageModal, callAlertMsg: callAlertCloneMsgModal } = useAlertMsg();

    const [isVertical, setIsVertical] = useState(false);

    const [isPlaceholder, setIsPlaceholder] = useState(false);

    const [modeType, setModeType] = useState(null);

    //States
    const [schemeInfo, setSchemeInfo] = useState([]);

    const [userProgrammes, setUserProgrammes] = useState([]);

    const [isViewMode, setIsViewMode] = useState(false); // State to manage view/edit mode

    const [id, setId] = useState();

    const [reasonExist, setReasonExist] = useState(false);

    const [excelAlert, setExcelAlert] = useState([]);
    const [excelErrorAlert, setExcelerrorAlert] = useState({});

    const [evaluationOptions, setEvaluationOptions] = useState([]);

    const [isEvaluationSchemeField, setIsEvaluationSchemeField] = useState(true);
    const [isPrerequisiteField, setIsPrerequisiteField] = useState(true);

    const [isCourseUsedAsPrerequisite, setIsCourseUsedAsPrerequisite] = useState(false);

    const [semesterOptionsDynamic, setSemesterOptionsDynamic] = useState([]);

    const [isSemesterDynamic, setIsSemesterDynamic] = useState(false);

    const [isSemesterVisible, setIsSemesterVisible] = useState(true);

    const [isPVBlock, setIsPVBlock] = useState(false);

    const [isPBlock, setIsPBlock] = useState(false);

    const [isVBlock, setIsVBlock] = useState(true);

    const [isOneYearBlock, setIsOneYearBlock] = useState(false);

    const [prgmRegId, setPrgmRegId] = useState(null);

    const [prgName, setPrgName] = useState(null);

    const [regulationYear, setRegulationYear] = useState(null);

    const [regulationsClone, setRegulationsClone] = useState([]);

    const [disableData, setDisableData] = useState(false);

    const [isOutcomesActive, setOutcomesActive] = useState(false);

    const createSet = (data, key) => (data && Object.keys(data).length) ? new Set(data[key]) : null;

    const semesterCategories = createSet(constantData, 'semesterCategories');
    const nonSemesterCategories = createSet(constantData, 'nonSemesterCategories');
    const verticalPlaceHolderNotAllowed = createSet(constantData, 'verticalPlaceHolderNotAllowed');
    const verticalAllowedSet = createSet(constantData, 'verticalAllowedSet');
    const placeholderAllowedSet = createSet(constantData, 'placeholderAllowedSet');

    const category = watch("addCourse.category");
    const semester = watch("addCourse.semester");
    const prerequisiteCodes = watch("addCourse.prerequisites");
    const evaluationName = watch("addCourse.evaluationName");


    const handleNavigation = () => {
        navigate("/programScheme", { state: { regulationId: regulationId } });
    }

    window.onpopstate = () => {
        handleNavigation();
    }

    //Get Select Program Data
    const getBasicInfo = async () => {
        setLoading(true);
        try {
            const schemeInfoData = await getData(`programme/regulations/basic/info/${regulationId}/${programId}`);
            setSchemeInfo(schemeInfoData);
            setPrgmRegId(schemeInfoData.prgmRegId)
            setPrgName(schemeInfoData.name)
            setRegulationYear(schemeInfoData.regulationYear)
            setLoading(false);
            coursesPagination();
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    //Get Select Program Data
    const getUserProgrammes = async () => {
        setLoading(true);
        try {
            const userProgrammes = await getData(`programme/regulations/allowed/programmes`);
            setUserProgrammes(userProgrammes);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    //Handle Template Download
    const handleExportTemplate = async () => {
        setLoading(true);
        try {
            const response = await getData(`courses/scheme/template/${regulationId}/${programId}`, { responseType: "arraybuffer" });
            downloadFile([response], 'application/xlsx', "Programme scheme template.xlsx")
            setLoading(false);
        } catch (error) {
            setLoading(false);
            const text = JSON.parse(String.fromCharCode.apply(null, Array.from(new Uint8Array(error.response.data))));
            callAlertMsg(text.message, 'error');
        }
    }

    //Handle course error file export
    const downloadErrorFile = async (filePath) => {
        setLoading(true);
        try {
            const response = await postData(`courses/export/error`, { filePath }, { responseType: "arraybuffer" });
            downloadFile([response], 'application/xlsx', 'Errors in programme scheme.xlsx');
            setLoading(false);
            setExcelerrorAlert({})
        } catch (error) {
            setLoading(false);
            const text = JSON.parse(String.fromCharCode.apply(null, Array.from(new Uint8Array(error.response.data))));
            callAlertMsg(text.message, 'error');
        }
    }

    //Handle course Export
    const handleExportScheme = async () => {
        setLoading(true);
        try {
            setLoading(true);
            const response = await postData(`courses/export`, { regulationId, prgmId: programId }, { responseType: "arraybuffer" });
            downloadFile([response], 'application/xlsx', 'Courses.xlsx')
            setLoading(false);
        } catch (error) {
            setLoading(false);
            const text = JSON.parse(String.fromCharCode.apply(null, Array.from(new Uint8Array(error.response.data))));
            callAlertMsg(text.message, 'error');
        }
    }

    // DropDown Regulation year for clone
    const getRegulationNames = async () => {
        if (programmeId) {
            const url = `programme/regulations/approved/${regulationId}/${programmeId}`;
            try {
                const result = await getData(url);

                const getRegulationsNamesObj = result.map(type => ({
                    value: type._id,
                    label: `${type.year} - ${type.version} - ${type.title}`
                }));

                setRegulationsClone(getRegulationsNamesObj);
            } catch (error) {
                callAlertCloneMsgModal(error.response.data.message, 'error');
            }
        }
    };

    //Form submission
    const cloneSchemes = async (data) => {
        let cloneId = data?.regulation?.value
        if (cloneId) {
            setLoading(true);
            try {
                const url = `programme/regulations/clone/${prgmRegId}`;
                const result = await putData(url, {
                    regulationId: cloneId
                });
                callAlertMsg(result, 'success');
                modalToggle({ cloneModal: false });
                setLoading(false);
                getBasicInfo();
                getFetchAddData();
            } catch (error) {
                setLoading(false);
                callAlertCloneMsgModal(error.response.data.message, 'error');
            }
        }
    };

    const getAccessForOutcomes = async () => {
        let url = `courses/access/outcomes/${regulationId}/${programId}`;
        setLoading(true);
        try {
            let result = await getData(url);
            setOutcomesActive(result.isOutcomesActive);
        } catch (error) {
            callAlertCloneMsgModal(error.response.data.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    const errorFormating = (error) => {
        return error.join("<br>");
    }

    const semesterOptions = [];
    semesterOptions.unshift({ value: null, label: "Non-semester courses" });
    for (let i = 1; i <= fetchAddData.totalSemester; i++) {
        semesterOptions.push({ value: i, label: `Semester ${i}` });
    }

    const handleSemesterDynamic = (category) => {
        const semesterDynamicOptions = [];
        if (semesterCategories.has(category.value)) {
            semesterDynamicOptions.unshift({ value: null, label: "Non-semester courses" });
        }
        if (nonSemesterCategories.has(category.value)) {
            semesterDynamicOptions.unshift({ value: null, label: "Non-semester courses" });
        } else {
            for (let i = 1; i <= fetchAddData.totalSemester; i++) {
                if (Object.keys(fetchAddData).length && fetchAddData.freezedSemesters.length == 0) {
                    semesterDynamicOptions.push({ value: i, label: `Semester ${i}` });
                }
                else if (!fetchAddData.freezedSemesters.includes(i)) {
                    semesterDynamicOptions.push({ value: i, label: `Semester ${i}` });
                }
            }
        }

        if (!semesterDynamicOptions.includes(semester.value)) {
            setValue("addCourse.semester", '');
            setIsPrerequisiteField(true);
        }
        setValue("addCourse.prerequisites", '');
        setSemesterOptionsDynamic(semesterDynamicOptions);
        setIsSemesterDynamic(true);
        setIsSemesterVisible(false);
    };

    // To fetch prerequisite course codes, when is semester selected.
    const handleSemesterChange = async (data) => {
        const url = 'courses/prerequisites';
        const dataObj = {
            'semester': data.semester,
            'regId': regulationId,
            'prgmId': programId,
            'id': id || null
        }
        try {
            if (((semesterCategories.has(category.value || data.category) || nonSemesterCategories.has(category.value || data.category)) && data.semester == null) || (!semesterCategories.has(category.value || data.category) && data.semester != null)) {
                const result = await postData(url, { ...dataObj });
                if (result && result.length) {
                    const prerequisiteCourseCodes = result
                    if (prerequisiteCodes && prerequisiteCodes.length) {
                        const prerequisiteValues = prerequisiteCodes.map(prerequisite => prerequisite.value);
                        const matchedCourseCodes = [];
                        prerequisiteCourseCodes.forEach(group => {
                            group.options.forEach(course => {
                                if (prerequisiteValues.includes(course.value)) {
                                    matchedCourseCodes.push(course);
                                }
                            });
                        });
                        if (matchedCourseCodes.length) {
                            setValue("addCourse.prerequisites", matchedCourseCodes);
                        } else {
                            setValue("addCourse.prerequisites", "");
                        }
                        setPrerequisiteOptions(prerequisiteCourseCodes);
                    } else {
                        setPrerequisiteOptions(prerequisiteCourseCodes);
                        setIsPrerequisiteField(false);
                    }

                } else {
                    setValue("addCourse.prerequisites", '');
                    setIsPrerequisiteField(true);
                }
            } else {
                setValue("addCourse.prerequisites", '');
                setIsPrerequisiteField(true);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            setIsPrerequisiteField(true);
        }
    }

    const handleCourseTypeChange = async (courseType) => {
        const url = `evaluation/schemes/course/type/${courseType.value}/${regulationId}`;
        try {
            const result = await getData(url);
            if (result && result.length) {
                let evaluationRecord = result.map((evaluation) => ({ value: evaluation._id, label: evaluation.name }));
                const exists = evaluationRecord.some(record => record.value === evaluationName.value);
                if (!exists) {
                    setValue("addCourse.evaluationName", '');
                }
                setEvaluationOptions(evaluationRecord);
                setIsEvaluationSchemeField(false);
                setError("addCourse.evaluationName", '');
            } else {
                setValue("addCourse.evaluationName", '');
                setError("addCourse.evaluationName", {
                    type: "manual",
                    message: `Evaluation scheme not available for the selected course type, under this regulation.`
                });
                setIsEvaluationSchemeField(true);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            setIsEvaluationSchemeField(true);
        }
    }

    const getCourseById = async (id) => {
        setLoading(true);
        const url = `courses/${id}`;
        try {
            const result = await getData(url);
            if (result && Object.keys(result).length) {
                setValue("addCourse.code", result.code);
                setValue("addCourse.title", result.title);
                setValue("addCourse.category", fetchAddData.category.find(option => option.value === result.category));
                handleSemesterDynamic({ value: result.category });
                setValue("addCourse.semester", semesterOptions.find(option => option.value === result.semester));
                await handleSemesterChange({ semester: result.semester, category: result.category });
                if (placeholderAllowedSet.has(result.category) && result.semester != null) {
                    return;
                } else {
                    setValue("addCourse.type", fetchAddData.type.find(option => option.value === result.type));
                    await handleCourseTypeChange({ value: result.type });
                    setValue("addCourse.partType", fetchAddData.partType.find(option => option.value === result.partType));
                    setValue("addCourse.offeringDept", offeringDeptOptions.find(option => option.value.name === result.offeringDeptName && option.value.category === result.offeringDeptCategory));
                    setValue("addCourse.prerequisites", result.prerequisites);
                    setValue("addCourse.creditName", fetchAddData.creditName.find(option => option.value === result.creditId));
                    setValue("addCourse.evaluationName", fetchAddData.evaluationName.find(option => option.value === result.evaluationId));
                }
                setValue("addCourse.isVertical", result.isVertical);
                if (result.isVertical) {
                    setIsVertical(true);
                    setValue("addCourse.verticalName", fetchAddData.verticals.find(option => option.value == result.vertical));
                }
                setValue("addCourse.isPlaceholder", result.isPlaceholder);
                setValue("addCourse.isOneYear", result.isOneYear);

                if (result.reason && [enumCoursesStatus.REQUESTED_CHANGES, enumCoursesStatus.WAITING_FOR_APPROVAL].includes(result.status)) {
                    setReasonExist(true);
                    setValue("addCourse.reason", result.reason);
                }
                if (result.isUsedAsPrerequisite) {
                    setIsCourseUsedAsPrerequisite(true);
                }
            }
        } catch (error) {
            callAlertMsg(error.response.data.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    const onSubmit = async (prgmScheme) => {
        setIsAlertArray(false);
        setErrorMessage("");

        const data = {
            "regulationId": regulationId,
            "prgmId": programId,
            "code": prgmScheme.addCourse.code,
            "title": prgmScheme.addCourse.title.trim(),
            "category": prgmScheme.addCourse.category.value,
            "semester": prgmScheme.addCourse.semester.value,
            "type": (prgmScheme.addCourse.type && Object.keys(prgmScheme.addCourse.type).length) ? prgmScheme.addCourse.type.value : null,
            "evaluationId": (prgmScheme.addCourse.evaluationName && Object.keys(prgmScheme.addCourse.evaluationName).length) ? prgmScheme.addCourse.evaluationName.value : null,
            "creditId": (prgmScheme.addCourse.creditName && Object.keys(prgmScheme.addCourse.creditName).length) ? prgmScheme.addCourse.creditName.value : null,
            "partType": (prgmScheme.addCourse.partType && Object.keys(prgmScheme.addCourse.partType)) ? prgmScheme.addCourse.partType.value : null,
            "isVertical": prgmScheme.addCourse.isVertical,
            "vertical": prgmScheme.addCourse.isVertical ? prgmScheme.addCourse.verticalName.value : null,
            "isPlaceholder": prgmScheme.addCourse.isPlaceholder,
            "isOneYear": prgmScheme.addCourse.isOneYear,
            "deptName": (prgmScheme.addCourse.offeringDept && Object.keys(prgmScheme.addCourse.offeringDept).length) ? prgmScheme.addCourse.offeringDept.value.name : null,
            "deptCategory": (prgmScheme.addCourse.offeringDept && Object.keys(prgmScheme.addCourse.offeringDept).length) ? prgmScheme.addCourse.offeringDept.value.category : null
        }
        if (prgmScheme.addCourse.prerequisites && prgmScheme.addCourse.prerequisites.length) {
            if (prgmScheme.addCourse.isPlaceholder) {
                modalRef.current.scrollTop = 0;
                callAlertMsgModal("For placeholder course prerequisites can't be assigned", "error");
                return
            } else {
                data["prerequisites"] = prgmScheme.addCourse.prerequisites.map((code) => code.value);
            }
        } else {
            data["prerequisites"] = [];
        }
        setLoading(true);

        const url = 'courses/'

        if (id) {
            try {
                const result = await putData(url, { ...data, id: id });
                setLoading(false);
                if (result) {
                    handleCloseAddCourseModal();
                    callAlertMsg(result, 'success');
                    reset();
                }
            } catch (error) {
                setLoading(false);
                modalRef.current.scrollTop = 0;
                if (error.response.data.name == "multiErr") {
                    setIsAlertArray(true);
                    let errorMessage = errorFormating(error.response.data.message);
                    setErrorMessage(errorMessage);
                } else {
                    callAlertMsgModal(error.response.data.message, 'error');
                }
            }
        } else {
            try {
                const result = await postData(url, { ...data });
                setLoading(false);
                if (result) {
                    handleCloseAddCourseModal();
                    callAlertMsg(result, 'success');
                    reset();
                }
            } catch (error) {
                setLoading(false);
                modalRef.current.scrollTop = 0;
                if (error.response.data.name == "multiErr") {
                    setIsAlertArray(true);
                    let errorMessage = errorFormating(error.response.data.message);
                    setErrorMessage(errorMessage);
                } else {
                    callAlertMsgModal(error.response.data.message, 'error');
                }
            }
        }
        setLoading(false);
        coursesPagination();
        getBasicInfo();
    }

    const handleCloseAddCourseModal = () => {
        reset();
        setId(null);
        setIsPBlock(false);
        setIsPVBlock(false);
        setIsVBlock(true);
        setModeType(null);
        setReasonExist(false);
        setIsViewMode(false);
        setIsVertical(false);
        setIsPlaceholder(false);
        setIsAlertArray(false);
        callAlertMsgModal(false);
        setIsPrerequisiteField(true);
        setIsEvaluationSchemeField(true);
        setIsCourseUsedAsPrerequisite(false);
        setPrerequisiteOptions([]);
        setEvaluationOptions([]);
        setSemesterOptionsDynamic([]);
        setIsSemesterDynamic(false);
        setIsSemesterVisible(true);
        setIsOneYearBlock(false);
        modalToggle({ addCourseModal: false });
    }

    const handleIsVertical = (value) => {
        if (!value) {
            setValue("addCourse.verticalName", '');
        }
        setIsVertical(value);
    };

    const handleIsPlaceholder = (value) => {
        setIsPlaceholder(value);
    };

    const handleOpenAddCourseModal = (type, id) => {
        setIsViewMode(type === "view");
        setModeType(type);
        getCourseById(id);
        setId(id);
        modalToggle({ addCourseModal: true });
    }

    useEffect(() => {
        if (regulationId && programId) {
            getBasicInfo();
            getUserProgrammes();
            getAccessForOutcomes();
        }
    }, []);

    useEffect(() => {
        setDisableData(false);
        setValue("addCourse.isPlaceholder", false);

        const resetValues = () => {
            handleIsVertical(false);
            handleIsPlaceholder(false);
            setValue("addCourse.isPlaceholder", false);
            setValue("addCourse.isVertical", false);
            setValue("addCourse.isOneYear", false);
            setIsPVBlock(false);
            setIsVBlock(false);
            setIsPBlock(false);
            setValue("addCourse.offeringDept", '');
        };

        const handlePlaceholderAndVertical = (isPlaceholder,
            isVertical,
            isPrerequisiteField,
            isPVBlock,
            isOneYearBlock) => {
            setDisableData(true);
            handleIsPlaceholder(isPlaceholder);
            handleIsVertical(isVertical);
            setValue("addCourse.isPlaceholder", isPlaceholder);
            setValue("addCourse.isVertical", isVertical);
            setValue("addCourse.isOneYear", false);
            setValue("addCourse.prerequisites", "");
            setValue("addCourse.offeringDept", "");
            setValue("addCourse.partType", "");
            setValue("addCourse.type", "");
            setValue("addCourse.evaluationName", "");
            setValue("addCourse.creditName", "");
            setIsPrerequisiteField(isPrerequisiteField);
            setIsPVBlock(isPVBlock);
            setIsOneYearBlock(isOneYearBlock);
        };

        if (semesterCategories?.has(category.value) && semester.value != null) {
            handlePlaceholderAndVertical(true, false, true, true, true);
        } else if (verticalAllowedSet?.has(category.value) && semester.value == null) {
            resetValues();
            setIsPBlock(true);
            setIsOneYearBlock(true);
        } else if (verticalPlaceHolderNotAllowed?.has(category.value) && semester.value == null) {
            resetValues();
            setIsPVBlock(true);
            setIsOneYearBlock(true);
        } else if (!semesterCategories?.has(category.value) && !nonSemesterCategories?.has(category.value) && semester.value != null) {
            resetValues();
            setIsPVBlock(true);
            setIsOneYearBlock(false);
        }
    }, [category, semester]);

    useEffect(() => {
        if (disableData) {
            clearErrors([
                'addCourse.creditName',
                'addCourse.evaluationName',
                'addCourse.offeringDept',
                'addCourse.type'
            ]);
        }
    }, [disableData]);


    /* -------- DropZone --------*/
    const onDrop = async (acceptedFile, rejectedFile) => {
        setExcelAlert("");
        setExcelerrorAlert("");
        try {

            if (acceptedFile.length) {
                setLoading(true);
                const file = acceptedFile[0];
                const url = "courses/import"
                //upload attachments data
                let attachmentResult = await postData(url, { regulationId, prgmId: programId, coursesImport: file }, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                setLoading(false);
                callAlertMsg(attachmentResult, "success");
                coursesPagination();
                getBasicInfo();
            }

            if (rejectedFile.length) {
                const message = rejectedFile[0].errors.map((e, index) => {
                    if (["file-too-small", "file-too-large"].includes(e.code)) {
                        return rejectedFileSize(e.message, e.code == "file-too-small");
                    }
                    return e.message;
                })
                callAlertMsg(message.join("</br>"), "error")
            }
        } catch (error) {
            setLoading(false)
            if (error.response.data.name == "data type mismatch found") {
                setExcelAlert(JSON.parse(error.response.data.message))
            }
            else if (error.response.data.name == "file error") {
                setExcelerrorAlert(error.response.data);
            }
            else {
                callAlertMsg(error.response.data.message, 'error');
            }
        }
    }


    const { fileRejections, getRootProps, getInputProps, acceptedFiles, inputRef } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.ms-excel': ['.xlsx']
        },
        minSize: 0,
        noKeyboard: true,
        maxFiles: 1,
        maxSize: 2097152,
    });

    return (
        <div>
            {Object.keys(excelErrorAlert).length > 0 ? <Alert alertShow={true}
                alertClose={true}
                style="danger"
                iconClassName="alert-success-fill"
                title="Unable to import excel"
                buttonShow={true}
                color="danger"
                downIcon="import_schemes"
                downloadButtonText="Download Errors"
                onClick={() => downloadErrorFile(excelErrorAlert.filePath)}
                message="Errors detected in the imported excel data." /> : ""}

            {excelAlert.length > 0 ? <Alert alertShow={true}
                alertClose={true}
                style="danger"
                title="Unable to import excel"
                message={excelAlert.join("<br>")} /> : ""}

            <div className='row'>
                <div className="base-title">
                    <div className='d-flex align-items-center'>
                        <button className='btn title-back-btn me-2' onClick={handleNavigation}>
                            <img className='backArrow' src={BackArrow} alt="Back" />
                        </button>
                        <span className='font-s16'>Programme Scheme</span>
                    </div>

                    <div className='d-flex'>
                        {isOutcomesActive && (<button className="btn btn-info btn-sm me-3" onClick={() => navigate(`/outcomes`, {
                            state: {
                                preveiousPath: location.pathname,
                                programmeId: programId,
                                regulationId: regulationId,
                                prgmRegId: prgmRegId,
                                programmeName: prgName,
                                regulationYear: regulationYear
                            }
                        })} type="button">Outcomes</button>)}
                        {(keycloak.principal.userActionItems.has("programmeAccess") || (userProgrammes.includes(programmeId) && keycloak.principal.userActionItems.has("addCourses"))) &&
                            (<div className="dropdown cursor-pointer me-3">
                                <button className="btn btn-primary" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <span>Actions</span>
                                    <span>
                                        <Icons iconName="arrow-down" className="icon-16 icon-white ms-2" />
                                    </span>
                                </button>
                                <ul className="dropdown-menu">

                                    <li><a className="dropdown-item" onClick={(e) => modalToggle({ addCourseModal: true })}>
                                        <span> <Icons iconName="addcircle" className="icon-16 icon-primary me-2" /></span>
                                        <span className='align-middle font-s14'>Add Course</span></a>
                                    </li>

                                    <li><a className="dropdown-item" onClick={() => { setExcelAlert([]); setExcelerrorAlert({}) }} {...getRootProps()}>
                                        <span> <Icons iconName="export" className="icon-13 icon-primary me-2" /></span>
                                        <span className='align-middle font-s14'>Import Schemes
                                            <input {...getInputProps()} ></input>
                                        </span></a>
                                    </li>

                                    <li><a className="dropdown-item" onClick={() => handleExportScheme()}>
                                        <span> <Icons iconName="import_schemes" className="icon-16 icon-primary me-2" /></span>
                                        <span className='align-middle font-s14'>Export Schemes</span></a>
                                    </li>

                                    <li><a className="dropdown-item" onClick={() => handleExportTemplate()}>
                                        <span> <Icons iconName="import_schemes" className="icon-16 icon-primary me-2" /></span>
                                        <span className='align-middle font-s14'>Export Scheme Template</span></a>
                                    </li>

                                    {isCloneAllowed && <li><a className="dropdown-item" onClick={() => { modalToggle({ cloneModal: true }); reset(); getRegulationNames(); }}>
                                        <span> <Icons iconName="clone" className="icon-16 icon-primary me-2" /></span>
                                        <span className='align-middle font-s14'>Clone</span></a>
                                    </li>}
                                </ul>
                            </div>)
                        }
                    </div>
                </div>
            </div>

            <div className='row mb-4'>
                <div className='col'>
                    {/* Basic Info Section */}
                    <BasicInfo access={(keycloak.principal.userActionItems.has("programmeAccess") || (userProgrammes.includes(programmeId) && keycloak.principal.userActionItems.has("addCourses")))} schemeInfo={schemeInfo} getBasicInfo={getBasicInfo} />
                </div>
            </div>

            <div className='row mb-3'>
                <div className='col-md-12'>
                    {/* Vertical Names Section */}
                    <VerticalNames access={(keycloak.principal.userActionItems.has("programmeAccess") || (userProgrammes.includes(programmeId) && keycloak.principal.userActionItems.has("addCourses")))} schemeInfo={schemeInfo} />
                </div>
            </div>

            <div className='row mb-5'>
                <div className='col-md-12'>
                    <div className='standard-accordion'>
                        <div className="accordion" id="programSchemeDetails">
                            {/* Semester Section */}
                            <Semesters access={((keycloak.principal.userActionItems.has("programmeAccess") || keycloak.principal.userActionItems.has("programmeApprovalAccess")) || ((keycloak.principal.userActionItems.has("schemeAccess") || keycloak.principal.userActionItems.has("addCourses")) && userProgrammes.includes(programmeId)))} courses={courses} handleOpenAddCourseModal={handleOpenAddCourseModal} getBasicInfo={getBasicInfo} freezeButtonAccess={keycloak.principal.userActionItems.has("programmeAccess") || keycloak.principal.userActionItems.has("programmeApprovalAccess")} />
                        </div>
                    </div>
                </div>
            </div>

            {/* SUCCESS MODAL */}
            <div className="modal fade" id="successModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="successModal" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered msg-modal">
                    <div className="modal-content">
                        <div className="modal-body text-center">
                            <div className="msg-modal-title">
                                <Icons iconName="thankyou" className="icon-50" />
                                <span> Submitted for Verification</span>
                            </div>
                            <p className="msg-modal-sec mb-4">The form was submitted successfully</p>
                            <div className="msg-modal-button">
                                <button type="button" className="btn btn-purple PX-5" data-bs-dismiss="modal">Ok</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {modal.cloneModal && (
                <div>
                    <div className="modal modal-bg fade show" id="largeModal" tabIndex="-1" aria-labelledby="largeModal" aria-hidden="true" style={{ display: 'block' }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id="largeModal">Clone Schemes</h5>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => { modalToggle({ cloneModal: false }) }}></button>
                                </div>
                                <form onSubmit={handleSubmit(cloneSchemes)}>
                                    <div className="modal-body p-4 my-3">
                                        <AlertComponent alertMessage={alertCloneMessageModal} alert={alertCloneModal} />

                                        <div className='row add-mapping'>
                                            <div className='col-md-12'>
                                                <Controller
                                                    name="regulation"
                                                    control={control}
                                                    rules={{ required: 'Regulation is required' }}
                                                    render={({ field: { ref, ...field } }) => (
                                                        <div>
                                                            <Selector
                                                                {...field}
                                                                placeholder="Select the regulation"
                                                                options={regulationsClone}
                                                                isMulti={false}
                                                                isClearable={false}
                                                            />
                                                            {errors.regulation && (
                                                                <p className="text-danger">{errors.regulation.message}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                />
                                            </div>

                                        </div>
                                    </div>
                                    <div className='modal-footer col-xs-between'>
                                        <button className='btn btn-md btn-cancel me-3' onClick={() => { modalToggle({ cloneModal: false }) }}>Cancel</button>
                                        <button className='btn btn-md btn-submit'>Clone</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </div>)
            }

            {/* ADD MODAL */}
            {modal.addCourseModal && (
                <div ref={modalRef} className="modal modal-bg fade show" style={{ display: 'block' }} id="addModal" data-bs-backdrop="static" data-bs-keyboard="false"
                    tabIndex="-1" aria-labelledby="addModal" aria-hidden="true">
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="modal-header">
                                    <div className="me-2 icon-bg">
                                        <Icons iconName="edit_bg" className="icon-20 icon-gray" />
                                    </div>
                                    {(modeType == null) && (<h5 className="modal-title" id="addModal"> Add Course</h5>)}
                                    {(modeType == "view") && (<h5 className="modal-title" id="addModal"> View Course</h5>)}
                                    {(modeType == "edit") && (<h5 className="modal-title" id="addModal"> Edit Course</h5>)}
                                    <button type="button" className="btn-close" onClick={handleCloseAddCourseModal}></button>
                                </div>
                                <div className='modal-body mt-2'>
                                    <div className='mx-3'>
                                        <AlertComponent alertMessage={alertMessageModal} alert={aleartModal} />
                                        {isAlertArray &&
                                            <Alert alertShow={true}
                                                alertClose={true}
                                                style="danger"
                                                title="Error"
                                                message={errorMessage} />
                                        }
                                    </div>
                                    <div className='row'>
                                        <div className='col-12'>
                                            <div className='row'>
                                                <div className="col-md-6">
                                                    <div className="modal-label">
                                                        <div className='label-title'>
                                                            <span className='icon-bg'>
                                                                <Icons iconName="course_code" /></span>
                                                            <span className='text-nowrap'>Course Code </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.code"
                                                            control={control}
                                                            rules={{
                                                                required: "Course code is required",
                                                                pattern: {
                                                                    value: /^[a-zA-Z0-9_]+$/,
                                                                    message: "Course code can only contain letters, numbers and underscores",
                                                                }
                                                            }}
                                                            render={({ field: { ref, ...field } }) => (
                                                                <InputText
                                                                    name="code"
                                                                    placeholder="Course Code"
                                                                    {...field}
                                                                    disabled={isCourseUsedAsPrerequisite ? isCourseUsedAsPrerequisite : isViewMode}
                                                                    value={field.value}
                                                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                                />
                                                            )}
                                                        />
                                                        {errors.addCourse?.code && (
                                                            <p className="text-danger">{errors.addCourse.code.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='icon-bg'>
                                                                <Icons iconName="evaluation_marks" /></span>
                                                            <span className='text-nowrap'>Course Title </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.title"
                                                            control={control}
                                                            rules={{
                                                                validate: value => value.trim() !== "" || "Course title is required",
                                                                required: "Course title is required"
                                                            }}
                                                            render={({ field: { ref, ...field } }) => (
                                                                <InputText
                                                                    name="title"
                                                                    placeholder="Course Title"
                                                                    {...field}
                                                                    disabled={isViewMode}
                                                                    value={field.value}
                                                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                                    onBlur={(e) => field.onChange(e.target.value.trim())}
                                                                />
                                                            )}
                                                        />
                                                        {errors.addCourse?.title && (
                                                            <p className="text-danger">{errors.addCourse.title.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='row'>

                                                <div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='icon-bg'>
                                                                <Icons iconName="category_bg" /></span>
                                                            <span className='text-nowrap'>Category </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.category"
                                                            control={control}
                                                            rules={{ required: "Category is required" }}
                                                            render={({ field: { ref, ...field } }) => <Selector
                                                                name="category"
                                                                className="select"
                                                                placeholder="Select the category"
                                                                options={fetchAddData.category}
                                                                isMulti={false}
                                                                isClearable={false}
                                                                value={field.value}
                                                                onChange={(value) => {
                                                                    field.onChange(value);
                                                                    handleSemesterDynamic(value);
                                                                }}
                                                                disabled={isCourseUsedAsPrerequisite ? isCourseUsedAsPrerequisite : isViewMode}
                                                            />
                                                            }
                                                        />
                                                        {errors.addCourse?.category && (
                                                            <p className="text-danger">{errors.addCourse.category.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='icon-bg'>
                                                                <Icons iconName="semester_tag" /></span>
                                                            <span className='text-nowrap'>Semester </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.semester"
                                                            control={control}
                                                            rules={{ required: "Semester is required" }}
                                                            render={({ field: { ref, ...field } }) => <Selector
                                                                name="semester"
                                                                className="select"
                                                                placeholder="Select the semester"
                                                                options={isSemesterDynamic ? semesterOptionsDynamic : semesterOptions}
                                                                isMulti={false}
                                                                isClearable={false}
                                                                value={field.value}
                                                                onChange={(value) => {
                                                                    field.onChange(value);
                                                                    handleSemesterChange({ semester: value.value });
                                                                }}
                                                                disabled={isCourseUsedAsPrerequisite ? isCourseUsedAsPrerequisite : (isSemesterVisible ? isSemesterVisible : isViewMode)}
                                                            />
                                                            }
                                                        />
                                                        {errors.addCourse?.semester && (
                                                            <p className="text-danger">{errors.addCourse.semester.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='row'>
                                                <div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='icon-bg'>
                                                                <Icons iconName="evaluation_marks" /></span>
                                                            <span className='text-nowrap'>Course Type </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.type"
                                                            control={control}
                                                            rules={{ required: disableData ? false : "Course type is required" }}
                                                            render={({ field: { ref, ...field } }) => <Selector
                                                                name="type"
                                                                className="select"
                                                                placeholder={disableData ? "N/A" : "Select course type"}
                                                                options={fetchAddData.type}
                                                                isMulti={false}
                                                                isClearable={false}
                                                                value={field.value}
                                                                onChange={(value) => {
                                                                    field.onChange(value);
                                                                    handleCourseTypeChange(value);
                                                                }}
                                                                disabled={disableData || isViewMode}
                                                            />
                                                            }
                                                        />
                                                        {errors.addCourse?.type && (
                                                            <p className="text-danger">{errors.addCourse.type.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='icon-bg'>
                                                                <Icons iconName="part_type" /></span>
                                                            <span className='text-nowrap'>Part Type </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.partType"
                                                            control={control}
                                                            render={({ field: { ref, ...field } }) => <Selector
                                                                name="partType"
                                                                className="select"
                                                                placeholder={disableData ? "N/A" : "Select the part type"}
                                                                options={fetchAddData.partType}
                                                                isMulti={false}
                                                                isClearable={false}
                                                                value={field.value}
                                                                onChange={(value) => {
                                                                    field.onChange(value);
                                                                }}
                                                                disabled={disableData || isViewMode}
                                                            />
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='row'>
                                                <div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='icon-bg'>
                                                                <Icons iconName="department_bg" /></span>
                                                            <span className='text-nowrap'>Offering Department </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.offeringDept"
                                                            control={control}
                                                            rules={{
                                                                required: disableData ? false : "Offering department is required",
                                                            }}
                                                            render={({ field: { ref, ...field } }) => <Selector
                                                                name="offeringDept"
                                                                className="select"
                                                                placeholder={disableData ? "N/A" : "Select offering department"}
                                                                options={offeringDeptOptions}
                                                                isMulti={false}
                                                                isClearable={false}
                                                                value={field.value}
                                                                onChange={(value) => {
                                                                    field.onChange(value);
                                                                }}
                                                                disabled={disableData || isViewMode}
                                                            />
                                                            }
                                                        />
                                                        {errors.addCourse?.offeringDept && (
                                                            <p className="text-danger">{errors.addCourse.offeringDept.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='icon-bg'>
                                                                <Icons iconName="prerequisites" /></span>
                                                            <span className='text-nowrap'>Prerequisites </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.prerequisites"
                                                            control={control}
                                                            render={({ field: { ref, ...field } }) => <Selector
                                                                name="prerequisites"
                                                                className="select"
                                                                placeholder={disableData ? "N/A" : "Select the prerequisites"}
                                                                options={prerequisiteOptions}
                                                                closeMenuOnSelect={false}
                                                                isMulti={true}
                                                                isClearable={true}
                                                                isSearchable={true}
                                                                value={field.value}
                                                                manageSearchValue={true}
                                                                components={true}
                                                                onChange={(value) => {
                                                                    field.onChange(value);
                                                                }}
                                                                disabled={disableData || isPrerequisiteField ? isPrerequisiteField : isViewMode}
                                                            />
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='row'>
                                                <div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='icon-bg'>
                                                                <Icons iconName="ltpc" /></span>
                                                            <span className='text-nowrap'>Credit Pattern </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.creditName"
                                                            control={control}
                                                            rules={{ required: disableData ? false : "Credit pattern is required" }}
                                                            render={({ field: { ref, ...field } }) => <Selector
                                                                name="creditId"
                                                                className="select"
                                                                placeholder={disableData ? "N/A" : "Select the credit pattern"}
                                                                options={fetchAddData.creditName}
                                                                isMulti={false}
                                                                isClearable={false}
                                                                value={field.value}
                                                                onChange={(value) => {
                                                                    field.onChange(value);
                                                                }}
                                                                disabled={disableData || isViewMode}
                                                            />
                                                            }
                                                        />
                                                        {errors.addCourse?.creditName && (
                                                            <p className="text-danger">{errors.addCourse.creditName.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='icon-bg'>
                                                                <Icons iconName="evaluation_marks" /></span>
                                                            <span className='text-nowrap'>Evaluation Scheme </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.evaluationName"
                                                            control={control}
                                                            rules={{ required: disableData ? false : "Evaluation scheme is required" }}
                                                            render={({ field: { ref, ...field } }) => <Selector
                                                                name="evaluationId"
                                                                className="select"
                                                                placeholder={disableData ? "N/A" : "Select the evaluation pattern"}
                                                                options={evaluationOptions}
                                                                isMulti={false}
                                                                isClearable={false}
                                                                value={field.value}
                                                                onChange={(value) => {
                                                                    field.onChange(value);
                                                                }}
                                                                disabled={isEvaluationSchemeField || disableData || isViewMode}
                                                            />
                                                            }
                                                        />
                                                        {errors.addCourse?.evaluationName && (
                                                            <p className="text-danger">{errors.addCourse.evaluationName.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='row'>
                                                <div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='text-nowrap'>Is Vertical required </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.isVertical"
                                                            control={control}
                                                            render={({ field: { ref, ...field } }) => (
                                                                <>
                                                                    <RadioButton
                                                                        {...field}
                                                                        className="form-check-inline"
                                                                        labelText="Yes"
                                                                        value={true}
                                                                        onChange={() => {
                                                                            field.onChange(true);
                                                                            handleIsVertical(true);
                                                                        }}
                                                                        checked={field.value === true}
                                                                        disabled={isPlaceholder || isViewMode || isPVBlock || (isVBlock && isPBlock)}
                                                                    />
                                                                    <RadioButton
                                                                        {...field}
                                                                        className="form-check-inline"
                                                                        labelText="No"
                                                                        value={false}
                                                                        onChange={() => {
                                                                            field.onChange(false);
                                                                            handleIsVertical(false);
                                                                        }}
                                                                        checked={field.value === false}
                                                                        disabled={isPlaceholder || isViewMode || isPVBlock || (isVBlock && isPBlock)}
                                                                    />
                                                                </>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                                {isVertical && <div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='icon-bg'>
                                                                <Icons iconName="evaluation_marks" /></span>
                                                            <span className='text-nowrap'>Vertical Name </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.verticalName"
                                                            control={control}
                                                            rules={{ required: "Vertical name is required" }}
                                                            render={({ field: { ref, ...field } }) => <Selector
                                                                name="verticals"
                                                                className="select"
                                                                placeholder="Select the vertical name"
                                                                options={fetchAddData.verticals}
                                                                isMulti={false}
                                                                isClearable={false}
                                                                value={field.value}
                                                                onChange={(value) => {
                                                                    field.onChange(value);
                                                                }}
                                                                disabled={isViewMode}
                                                            />
                                                            }
                                                        />
                                                        {errors.addCourse?.verticalName && (
                                                            <p className="text-danger">{errors.addCourse.verticalName.message}</p>
                                                        )}
                                                    </div>
                                                </div>}
                                                <div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='text-nowrap'>Is Placeholder required </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.isPlaceholder"
                                                            control={control}
                                                            render={({ field: { ref, ...field } }) => (
                                                                <>
                                                                    <RadioButton
                                                                        {...field}
                                                                        className="form-check-inline"
                                                                        labelText="Yes"
                                                                        value={true}
                                                                        onChange={() => {
                                                                            field.onChange(true);
                                                                            handleIsPlaceholder(true);
                                                                        }}
                                                                        checked={field.value === true}
                                                                        disabled={isCourseUsedAsPrerequisite || isVertical || isViewMode || (isPVBlock || isPBlock)}
                                                                    />
                                                                    <RadioButton
                                                                        {...field}
                                                                        className="form-check-inline"
                                                                        labelText="No"
                                                                        value={false}
                                                                        onChange={() => {
                                                                            field.onChange(false);
                                                                            handleIsPlaceholder(false);
                                                                        }}
                                                                        checked={field.value === false}
                                                                        disabled={isCourseUsedAsPrerequisite || isVertical || isViewMode || (isPVBlock || isPBlock)}
                                                                    />
                                                                </>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='text-nowrap'>Is One year course</span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.isOneYear"
                                                            control={control}
                                                            render={({ field: { ref, ...field } }) => (
                                                                <>
                                                                    <RadioButton
                                                                        {...field}
                                                                        className="form-check-inline"
                                                                        labelText="Yes"
                                                                        value={true}
                                                                        onChange={() => {
                                                                            field.onChange(true);
                                                                        }}
                                                                        checked={field.value === true}
                                                                        disabled={isOneYearBlock ? isOneYearBlock : isViewMode}

                                                                    />
                                                                    <RadioButton
                                                                        {...field}
                                                                        className="form-check-inline"
                                                                        labelText="No"
                                                                        value={false}
                                                                        onChange={() => {
                                                                            field.onChange(false);
                                                                        }}
                                                                        checked={field.value === false}
                                                                        disabled={isOneYearBlock ? isOneYearBlock : isViewMode}

                                                                    />
                                                                </>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='row'>
                                                {reasonExist && (<div className="col-md-6 form-group">
                                                    <div className='modal-label'>
                                                        <div className='label-title'>
                                                            <span className='icon-bg'>
                                                                <Icons iconName="evaluation_marks" /></span>
                                                            <span className='text-nowrap'>Reason </span>
                                                        </div>
                                                        <Controller
                                                            name="addCourse.reason"
                                                            control={control}
                                                            disabled={true}
                                                            render={({ field: { ref, ...field } }) =>
                                                                <textarea className="form-control"
                                                                    {...field}
                                                                    value={field.value}
                                                                >
                                                                </textarea>}
                                                        />
                                                    </div>
                                                </div>)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-cancel px-5 me-3" onClick={handleCloseAddCourseModal}>Close</button>
                                    {!isViewMode && (
                                        <button type="submit" className="btn btn-primary px-5">{id ? 'Update' : 'Add'}</button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SchemeDetail;