import React, { useState, useEffect } from 'react';
import Icons from '../../Components/Icons';
import InputText from '../../Components/InputText';
import Selector from '../../Components/Selector';
import Computer from '../../Assets/images/regulationHeader/system.svg';
import Arrow from '../../Assets/images/regulationHeader/modal-arrow.svg';
import BackArrow from '../../Assets/images/regulationHeader/arrow-back.svg';
import Alert from "../../Components/Alert.js";
import { Link } from 'react-router-dom';
import { useNavigate, useParams } from "react-router-dom";
import { getData, postData, putData } from '../../Services/ApiServices';
import { useForm, Controller } from 'react-hook-form';
import AlertComponent from '../../Components/AlertComponent';
import { useAlertMsg } from '../../Services/AllServices';
import Loader from '../../Components/Loader';
import { useDropzone } from 'react-dropzone';
import '../../Assets/css/components/dropzone.css';
import { uploadS3, rejectedFileSize } from '../../Services/AllServices';

const AddRegulation = () => {
    const navigate = useNavigate();
    const { id, type } = useParams();
    const [isViewMode, setIsViewMode] = useState(type == "view" ? true : false); // State to manage view/edit mode
    const [actionItemData, setActionItemData] = useState({});
    const [evaluationType, setEvaluationType] = useState()
    const [creditType, setCreditType] = useState();
    const [gradeType, setGradeType] = useState([]);
    const [prgmsType, setProgramsType] = useState();
    const { control, setValue, watch, handleSubmit, reset, clearErrors, getValues, formState: { errors } } = useForm();

    //Modal
    const [modal, setModal] = useState({ caModal: false, gradingModal: false, evaluvationModal: false });

    //Loader
    const [loading, setLoading] = useState(false);

    //Alert
    const { alert, alertMessage, callAlertMsg } = useAlertMsg();

    // Watch the creditIds value
    const selectedCredits = watch("regulation.creditIds");
    const selectedGrading = watch("regulation.gradeIds");
    const selectedEvaluation = watch("regulation.evaluationIds");
    const file = watch("regulation.file");
    const reason = watch("regulation.reason");

    //Explore Data State
    const [creditIds, setCreditIds] = useState([]);
    const [gradeIds, setGradeIds] = useState([]);
    const [evaluationIds, setEvaluationIds] = useState([]);

    const [isAlertArray, setIsAlertArray] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [isEditable, setIsEditable] = useState(true);

    const errorFormating = (error) => {
        return error.join("<br>");
    }

    //Explore Evaluation
    const handleEvaluationSchemes = async () => {
        setLoading(true);
        let evaluationIds = getValues().regulation.evaluationIds.map(evaluation => evaluation.value);
        try {
            const evaluationSchemesInfo = await postData('evaluation/schemes/info', { evaluationIds });
            setEvaluationIds(evaluationSchemesInfo);
            setModal({ ...modal, evaluvationModal: true })
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    // Explore Grading
    const handleGradeSchemes = async () => {
        setLoading(true);
        let gradeIds = getValues().regulation.gradeIds.map(grade => grade.value);
        try {
            const gradesInfo = await postData(`grades/info`, { gradeIds });
            setGradeIds(gradesInfo);
            setModal({ ...modal, gradingModal: true })
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    // Explore Credit
    const handleCreditSchemes = async () => {
        setLoading(true);
        let creditIds = getValues().regulation.creditIds.map(credit => credit.value);
        try {
            const creditsInfo = await postData(`credits/info`, { creditIds });
            setCreditIds(creditsInfo);
            setModal({ ...modal, caModal: true });
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    //  OnSubmit Function
    const onSubmit = async (data) => {
        setIsAlertArray(false);
        setErrorMessage("");
        setLoading(true);
        const url = 'regulations/';
        data.regulation.creditIds = data.regulation.creditIds.map(credit => credit.value);
        data.regulation.programmeIds = data.regulation.programmeIds.map(progrm => progrm.value);
        data.regulation.gradeIds = data.regulation.gradeIds.map(grade => grade.value);
        data.regulation.evaluationIds = data.regulation.evaluationIds.map(evaluation => evaluation.value);
        if (type == "edit") {
            try {
                const result = await putData(url, { ...data.regulation, id: id });
                setLoading(false);
                navigate('/regulations', {
                    state: { success: result }
                })
            } catch (error) {
                setLoading(false);
                window.scrollTo(0, 0);
                if (error.response.data.name == "multiErr") {
                    setIsAlertArray(true);
                    let errorMessage = errorFormating(error.response.data.message);
                    setErrorMessage(errorMessage);
                } else {
                    callAlertMsg(error.response.data.message, 'error');
                }
            }
        }
        else {
            try {
                let result = await postData(id ? `${url}clone/${id}` : url, { ...data.regulation });
                reset();
                setLoading(false);
                navigate('/regulations', {
                    state: { success: result }

                })
            } catch (error) {
                setLoading(false);
                window.scrollTo(0, 0);
                if (error.response.data.name == "multiErr") {
                    setIsAlertArray(true);
                    let errorMessage = errorFormating(error.response.data.message);
                    setErrorMessage(errorMessage);
                } else {
                    callAlertMsg(error.response.data.message, 'error');
                }
            }
        }
    }

    const getEnumActionItems = async () => {
        const url = `enums/actionItems`;
        try {
            const actionItemEnums = await getData(url);
            setActionItemData(actionItemEnums);
        } catch (error) {
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    // Edit and View Function
    useEffect(() => {
        var getCreditsObj, getEvaluationTypeObj, getGradeTypeObj, getProgramTypeObj;
        const fetchOptions = async () => {
            setLoading(true);
            try {
                const getCredits = await getData('credits/distinct');
                const getEvaluationType = await getData('evaluation/schemes/distinct');
                const getGradeType = await getData('grades/distinct');
                const getProgramsType = await getData('programme/regulations/distinct');

                getCreditsObj = getCredits.map(type => ({ value: type._id, label: type.name }));
                getEvaluationTypeObj = getEvaluationType.map(type => ({ value: type._id, label: type.name }));
                getGradeTypeObj = getGradeType.map(type => ({ value: type._id, label: type.name }));
                getProgramTypeObj = getProgramsType.map(type => ({ value: type._id, label: `${type.category} - ${type.type} - ${type.name} - ${type.mode}` }));

                setCreditType(getCreditsObj);
                setEvaluationType(getEvaluationTypeObj);
                setGradeType(getGradeTypeObj);
                setProgramsType(getProgramTypeObj);

                getEnumActionItems();
                if (id) {
                    getAddRegulations();
                }
                setLoading(false);

            } catch (error) {
                setLoading(false);
                callAlertMsg(error.response.data.message, 'error');
            }
        };
        fetchOptions();

        const getAddRegulations = async () => {
            setLoading(true);
            const url = `regulations/${id}`;
            if (id) {
                try {
                    const result = await getData(url);
                    if (result && Object.keys(result).length) {
                        let setIsFixed = false;
                        if (result.isApproved && type != "clone") {
                            setIsFixed = true;
                            setIsEditable(false);
                        }
                        setValue("regulation", result);
                        setValue("regulation.creditIds", result.creditRecord.map(type => ({ value: type._id, label: type.name, isFixed: setIsFixed })));
                        setValue("regulation.programmeIds", result.prgmRecord.map(type => ({ value: type.id, label: `${type.category} - ${type.type} - ${type.name} - ${type.mode}`, isFixed: setIsFixed })))
                        setValue("regulation.gradeIds", result.gradeRecord.map(type => ({ value: type._id, label: type.name, isFixed: setIsFixed })));
                        setValue("regulation.evaluationIds", result.evaluationRecord.map(type => ({ value: type._id, label: type.name, isFixed: setIsFixed })));
                        setValue("regulation.reason", result.reason);
                        setValue("regulation.file", result.attachments);
                    }
                    setLoading(false);
                } catch (error) {
                    setLoading(false);
                    callAlertMsg(error.response.data.message, 'error');
                }
            }
        }
    }, []);

    /* -------- DropZone --------*/
    const onDrop = async (acceptedFile) => {
        try {
            if (!acceptedFile || !acceptedFile.length) {
                return;
            }
            setLoading(true);
            const file = acceptedFile[0];
            //file upload to aws s3 bucket
            let response = await uploadS3(file);
            setValue("regulation.file", { url: response.filePath, contentType: file.type, originalname: response.fileName });
            clearErrors("regulation.file")
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    const { fileRejections, getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf']
        },
        minSize: 0,
        noKeyboard: true,
        maxSize: 2097152,
    });

    const handleFileRemove = (e) => {
        setValue("regulation.file", undefined);
    };

    const handleFileView = async (e) => {
        try {
            setLoading(true);
            let response = await getData("s3/download/url", { params: { url: file.url } });
            setLoading(false)
            window.open(response.signedUrl);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    return (
        <div>
            {/* Loader */}
            <Loader loading={loading} />

            {/* Alert */}
            <AlertComponent alertMessage={alertMessage} alert={alert} />

            {isAlertArray &&
                <Alert alertShow={true}
                    alertClose={true}
                    style="danger"
                    title="Error"
                    message={errorMessage} />
            }

            <div className='row'>
                <div className="base-title">
                    <span className='d-flex align-items-center'>
                        <Link to="/regulations">
                            <button className='btn title-back-btn me-2'>
                                <img className='backArrow' src={BackArrow} alt="Back" />
                            </button>
                        </Link>
                        <span className='font-s16'>{actionItemData?.action?.descriptions[actionItemData?.action[type.toUpperCase()]]} Regulation</span>
                    </span>
                </div>
            </div>
            <div className='row'>
                <div className='col-md-12'>
                    <div className='card add-regulation'>
                        <div className='card-header-type1 card-header-img d-flex justify-content-center align-items-center'>
                            <img className='computer-icon me-4' src={Computer} />
                            {id ? ((isViewMode) ?
                                (<div className='heading'>
                                    <div className='mb-1'>
                                        View Regulation
                                    </div>
                                    <div className='sub-heading'>
                                        Detailed Overview of Regulation
                                    </div>
                                </div>)
                                : type == "clone" ? (<div className='heading'>
                                    <div className='mb-1'>
                                        Clone Regulation
                                    </div>
                                    <div className='sub-heading'>
                                        Modify Existing Regulation Details For Clone
                                    </div>
                                </div>) :
                                    (<div className='heading'>
                                        <div className='mb-1'>
                                            Edit Regulation
                                        </div>
                                        <div className='sub-heading'>
                                            Modify Existing Regulation Details
                                        </div>
                                    </div>)) : (<div className='heading'>
                                        <div className='mb-1'>
                                            Create Regulation
                                        </div>
                                        <div className='sub-heading'>
                                            Add New Regulation here!
                                        </div>
                                    </div>)
                            }

                        </div>
                        <div className='card-body p-5'>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className='row pb-5'>
                                    <div className='col-md-6 px-5'>
                                        <div className='row'>
                                            <div className='col-md-12 mb-5'>
                                                <label className="form-label mb-1">Regulation Year</label>
                                                <Controller
                                                    name="regulation.year"
                                                    control={control}
                                                    rules={{
                                                        required: "Regulation year is required",
                                                        validate: {
                                                            pattern: value => /^[1-9][0-9]*$/.test(value) || 'Input must be a number greater than zero.'
                                                        }
                                                    }}
                                                    render={({ field }) => (
                                                        <InputText
                                                            placeholder="Regulation Year"
                                                            type="number"
                                                            {...field}
                                                            disabled={type == "edit" || isViewMode}
                                                            value={field.value}
                                                            onChange={(e) => field.onChange(e.target.value)}
                                                        />
                                                    )}
                                                />
                                                {errors.regulation?.year && (
                                                    <p className="text-danger">{errors.regulation.year.message}</p>
                                                )}
                                            </div>

                                            <div className='col-md-12 mb-5'>
                                                <label className="form-label mb-1">Description</label>
                                                <Controller
                                                    name="regulation.title"
                                                    control={control}
                                                    rules={{ required: "Description is required" }}
                                                    render={({ field }) => <textarea className="form-control" placeholder="Description"
                                                        {...field}
                                                        disabled={isViewMode || (type != "clone" && !isEditable)}
                                                        value={field.value} >
                                                    </textarea>}
                                                />
                                                {errors.regulation?.title && (
                                                    <p className="text-danger">{errors.regulation.title.message}</p>
                                                )}
                                            </div>

                                            <div className='col-md-12 mb-5'>
                                                <div className='d-flex justify-content-between mb-0'>
                                                    <label className="form-label">Credit assignment</label>
                                                    {selectedCredits?.length > 0 && (
                                                        <a className="explore-btn pe-1" onClick={handleCreditSchemes}>Explore</a>
                                                    )}
                                                </div>
                                                <Controller
                                                    name="regulation.creditIds"
                                                    control={control}
                                                    rules={{ required: "Credit assignment is required" }}
                                                    render={({ field }) => (
                                                        <Selector
                                                            className="select"
                                                            options={creditType}
                                                            isMulti={true}
                                                            isClearable={false}
                                                            closeMenuOnSelect={false}
                                                            disabled={isViewMode}
                                                            value={field.value}
                                                            manageSearchValue={true}
                                                            onChange={(e) => field.onChange(e)}
                                                        />
                                                    )}
                                                />
                                                {errors.regulation?.creditIds && (
                                                    <p className="text-danger">{errors.regulation.creditIds.message}</p>
                                                )}
                                            </div>

                                            {reason && <div className='col-md-12'>
                                                <label className="form-label mb-1">Reason</label>
                                                <Controller
                                                    name="regulation.reason"
                                                    control={control}
                                                    render={({ field }) => <textarea className="form-control" placeholder="Reason"
                                                        {...field}
                                                        disabled={true}
                                                        value={field.value} >
                                                    </textarea>}
                                                />
                                            </div>}
                                        </div>
                                    </div>

                                    <div className='col-md-6 px-5'>
                                        <div className='row'>
                                            <div className='col-md-12 mb-5'>
                                                <div className='col-md-12 mb-5'>
                                                    <label className="form-label mb-1">Applicable programme</label>
                                                    <Controller
                                                        name="regulation.programmeIds"
                                                        control={control}
                                                        rules={{ required: "Applicable programme is required" }}
                                                        render={({ field }) => (
                                                            <Selector
                                                                className="select"
                                                                options={prgmsType}
                                                                isMulti={true}
                                                                isClearable={false}
                                                                disabled={isViewMode}
                                                                closeMenuOnSelect={false}
                                                                value={field.value}
                                                                manageSearchValue={true}
                                                                onChange={(selected) => field.onChange(selected)}
                                                            />
                                                        )}
                                                    />
                                                    {errors.regulation?.programmeIds && (
                                                        <p className="text-danger">{errors.regulation.programmeIds.message}</p>
                                                    )}
                                                </div>

                                                <div className='col-md-12'>
                                                    <div className='d-flex justify-content-between mb-0'>
                                                        <label className="form-label">Grading</label>
                                                        {selectedGrading?.length > 0 && (
                                                            <a className="explore-btn pe-1" onClick={() => handleGradeSchemes(gradeIds)}>Explore</a>
                                                        )}
                                                    </div>
                                                    <Controller
                                                        name="regulation.gradeIds"
                                                        control={control}
                                                        rules={{ required: "Grading is required" }}
                                                        render={({ field }) => (
                                                            <Selector
                                                                className="select"
                                                                options={gradeType}
                                                                isMulti={true}
                                                                isClearable={false}
                                                                disabled={isViewMode}
                                                                closeMenuOnSelect={false}
                                                                value={field.value}
                                                                manageSearchValue={true}
                                                                onChange={(selected) => field.onChange(selected)}
                                                            />
                                                        )}
                                                    />
                                                    {errors.regulation?.gradeIds && (
                                                        <p className="text-danger">{errors.regulation.gradeIds.message}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className='col-md-12 mb-5'>
                                                <div className='d-flex justify-content-between mb-0'>
                                                    <label className="form-label">CA/FE Distribution</label>
                                                    {selectedEvaluation?.length > 0 && (
                                                        <a className="explore-btn pe-1" onClick={() => handleEvaluationSchemes(evaluationIds)}> Explore
                                                        </a>
                                                    )}
                                                </div>
                                                <Controller
                                                    name="regulation.evaluationIds"
                                                    control={control}
                                                    rules={{ required: "CA/FE distribution is required" }}
                                                    render={({ field }) => (
                                                        <Selector
                                                            className="select"
                                                            options={evaluationType}
                                                            isMulti={true}
                                                            closeMenuOnSelect={false}
                                                            isClearable={false}
                                                            disabled={isViewMode}
                                                            value={field.value}
                                                            manageSearchValue={true}
                                                            onChange={(selected) => field.onChange(selected)}
                                                        />
                                                    )}
                                                />
                                                {errors.regulation?.evaluationIds && (
                                                    <p className="text-danger">{errors.regulation.evaluationIds.message}</p>
                                                )}
                                            </div>

                                            <div className='col-md-12 mb-4'>
                                                <div className='d-flex justify-content-between mb-0'>
                                                    <label className="form-label">Attachment (Max size: 2 MB)</label>
                                                </div>
                                                <Controller
                                                    name="regulation.file"
                                                    control={control}
                                                    rules={{ required: "Attachment is required" }}
                                                    render={({ field }) => (
                                                        <div>
                                                            {!(file && Object.keys(file).length > 0) ? (<div>
                                                                <button {...getRootProps()} type='button' className='btn dropdown-btn dropdown-btn-square m-0'>
                                                                    <div className='d-flex align-items-center'>
                                                                        <Icons iconName="Select_file" className="icon-16 me-1" />
                                                                        <span>Select a file</span>
                                                                    </div></button>
                                                                <input {...getInputProps()}></input>
                                                            </div>) : <ul className="list-group-item">
                                                                <section className="container container-dropzone ps-0">
                                                                    <li className="list-group-item-success">
                                                                        <div className='success-container mx-0'>
                                                                            <span onClick={handleFileView} className="link-primary cursor-pointer align-middle">{file.originalname}</span>
                                                                            {!isViewMode && (isEditable || type == "clone") && <button className='remove-btn' onClick={handleFileRemove}>
                                                                                <Icons iconName="delete" className="icon-20 remove-icon me-1" />
                                                                            </button>}
                                                                        </div></li></section>
                                                            </ul>}

                                                            {fileRejections.length > 0 && <ul className='list-group-item'>
                                                                <section className="container container-dropzone mt-2 ps-0">
                                                                    <li className="list-group-item-danger">
                                                                        <div className='failure-container' key={fileRejections[0].file.path}>
                                                                            {fileRejections[0].file.originalname}
                                                                            <ul>
                                                                                {fileRejections[0].errors.map((e, index) => <li className='mb-0' key={index}>{e.code == "file-too-small" || e.code == "file-too-large" ? rejectedFileSize(e.message, e.code == "file-too-small") : e.message}</li>)}
                                                                            </ul>
                                                                        </div></li></section>
                                                            </ul>}
                                                        </div>
                                                    )}
                                                />
                                                {errors.regulation?.file && (
                                                    <p className="text-danger">{errors.regulation.file.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-12 col-xs-end mt-2 text-end'>
                                        <button type="button" className="btn btn-cancel px-5 px-xs-2 me-3" onClick={() => navigate('/regulations')}>Close</button>
                                        {!isViewMode && (
                                            <button type="submit" className="btn btn-primary px-5 px-xs-2">{id ? type == "edit" ? 'Update' : "Clone" : 'Add'}</button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>

                {/* <!-- Distribution Evaluation Modal --> */}

                {modal.evaluvationModal && (
                    <div>
                        <div className="modal fade modal-type1 show" id="distributionModal" tabIndex="-1" aria-labelledby="distributionModalLabel" aria-hidden="true" style={{ display: 'block' }}>
                            <div className="modal-dialog modal-lg">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <div className='icon-bg icon-bg-white'><Icons iconName="model" className="icon-20 icon-gray" /></div>
                                        <img className='modal-arrow-icon' src={Arrow} />
                                        <h4 className='modal-title'>CA/FE Distribution Details</h4>
                                        <button type="button" className="btn-close" onClick={() => setModal({ ...modal, evaluvationModal: false })} />
                                    </div>
                                    <div className="modal-body">
                                        <div>
                                            <table className="table spacing-table">
                                                <thead className='pb-2'>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Course Type</th>
                                                        <th>CA Marks</th>
                                                        <th>FE Marks</th>
                                                        <th>Overall Marks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {evaluationIds.map((item, index) => (
                                                        <tr>
                                                            <td>{item.name}</td>
                                                            <td>{item.courseType}</td>
                                                            <td>{item.CA.scaled}</td>
                                                            <td>{item.FE.scaled}</td>
                                                            <td>{item.total}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-backdrop fade show"></div>
                    </div>
                )}

                {/* <!-- Grading-Modal --> */}
                {modal.gradingModal && (
                    <div>
                        <div className="modal fade modal-type1 show" id="gradingModal" tabIndex="-1" aria-labelledby="gradingModalLabel" aria-hidden="true" style={{ display: 'block' }}>
                            <div className="modal-dialog modal-lg">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <div className='icon-bg icon-bg-white'><Icons iconName="model" className="icon-20 icon-gray" /></div>
                                        <img className='modal-arrow-icon' src={Arrow} />
                                        <h4 className='modal-title'>Grading Details</h4>
                                        <button type="button" className="btn-close" onClick={() => setModal({ ...modal, gradingModal: false })} />
                                    </div>
                                    <div className="modal-body">
                                        <div className='accordion-table'>
                                            <div className='row accordion-table-header'>
                                                <div className='col-md-3 px-0'>
                                                    Grading Name
                                                </div>
                                                <div className='col-md-3 px-0'>
                                                    Grading Type
                                                </div>
                                                <div className='col-md-3 px-0'>
                                                    Course Type
                                                </div>
                                            </div>
                                            <div className="accordion" id="accordionExample">
                                                {gradeIds.map((item, index) => (
                                                    <div className="accordion-item mt-2" key={index}>
                                                        <h2 className="accordion-header">
                                                            <div className="row">
                                                                <div className="col-md-12 d-flex align-items-center">
                                                                    <div className="col-md-3 ps-2">
                                                                        <div className="accordion-title">{item.name}</div>
                                                                    </div>
                                                                    <div className="col-md-3">
                                                                        <div className="accordion-title">{item.gradeType}</div>
                                                                    </div>
                                                                    <div className="col-md-5">
                                                                        <div className="accordion-title">{item.courseType}</div>
                                                                    </div>
                                                                    <div className="col-md-1">
                                                                        <button
                                                                            className="btn-get-data"
                                                                            type="button"
                                                                            data-bs-toggle="collapse"
                                                                            data-bs-target={`#collapse${index}`}
                                                                            aria-expanded="true"
                                                                            aria-controls={`collapse${index}`}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </h2>
                                                        <div
                                                            id={`collapse${index}`}
                                                            className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                                                            data-bs-parent="#accordionExample">
                                                            <div className="accordion-body d-flex flex-wrap">
                                                                <table className="table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Letter Grade</th>
                                                                            <th>Min Marks</th>
                                                                            <th>Max Marks</th>
                                                                            <th>Grade Point</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {item.grades.map((grade, gradeIndex) => (
                                                                            <tr key={gradeIndex}>
                                                                                <td>{grade.letter}</td>
                                                                                <td>{grade.min}</td>
                                                                                <td>{grade.max}</td>
                                                                                <td>{grade.point}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-backdrop fade show"></div>
                    </div>
                )}

                {/* Credit Pattern Model */}
                {modal.caModal && (
                    <div>
                        <div className="modal fade modal-type1 show" id="patternModals" tabIndex="-1" aria-labelledby="patternModalLabel" aria-hidden="true" style={{ display: 'block' }}>
                            <div className="modal-dialog modal-lg">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <div className='icon-bg icon-bg-white'><Icons iconName="model" className="icon-20 icon-gray" /></div>
                                        <img className='modal-arrow-icon' src={Arrow} />
                                        <h4 className='modal-title'>Pattern Details</h4>
                                        <button type="button" className="btn-close" onClick={() => setModal({ ...modal, caModal: false })} />
                                    </div>
                                    <div className="modal-body">
                                        <div className='row pattern-card justify-content-around'>
                                            {creditIds.map((item, index) => (
                                                <div className='col-md-5 px-0'>
                                                    <div className="card border">
                                                        <div className="card-body">
                                                            <div className='card-title'>{item.name}</div>
                                                            <div className='mt-4'>
                                                                <table className='table pattern-card-table'>
                                                                    <tr>
                                                                        <td>L</td>
                                                                        <td>T</td>
                                                                        <td>P</td>
                                                                        <td>C</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>{item.lecture}</td>
                                                                        <td>{item.tutorial}</td>
                                                                        <td>{item.practical}</td>
                                                                        <td>{item.credits}</td>
                                                                    </tr>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-backdrop fade show"></div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AddRegulation;
