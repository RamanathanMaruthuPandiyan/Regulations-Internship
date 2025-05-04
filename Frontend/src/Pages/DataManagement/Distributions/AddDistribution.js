import React, { useState, useEffect, useRef } from 'react';

import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller, useWatch } from 'react-hook-form';

import InputText from '../../../Components/InputText';
import Icons from '../../../Components/Icons';
import Selector from '../../../Components/Selector';
import CaComponent from './CaComponent';
import FeComponent from './FeComponent';
import AlertComponent from '../../../Components/AlertComponent';
import Loader from '../../../Components/Loader';
import Alert from "../../../Components/Alert.js";
import { getData, postData, putData } from '../../../Services/ApiServices';
import { useAlertMsg, validateNumber } from '../../../Services/AllServices';
import { handleNumberChangeEvalScheme } from '../../../Services/AllServices';
import { Link } from 'react-router-dom';
import BackArrow from '../../../Assets/images/regulationHeader/arrow-back.svg';

const AddDistribution = () => {

    const { id, type } = useParams();
    const navigate = useNavigate();

    const { control, handleSubmit, formState: { errors }, setValue, getValues } = useForm({
        defaultValues: {
            evaluationScheme: {
                "CA_Components": [
                    {
                        name: '',
                        marks: {
                            actual: null,
                            scaled: null
                        },
                        hasSubComponent: false,
                        sub: [{ "name": '', "marks": { actual: null, scaled: null }, "hasSubComponent": false, "hasConversion": false }],
                        hasConversion: false
                    }
                ],
                "FE_Components": [
                    {
                        name: "",
                        marks: {
                            actual: null,
                            scaled: null
                        },
                        hasSubComponent: false,
                        hasConversion: false,
                        sub: []
                    }
                ]
            }
        },
    });
    const formRef = useRef(null);
    const { alert, alertMessage, callAlertMsg } = useAlertMsg();
    const [isViewMode, setIsViewMode] = useState(type == "view" ? true : false); // State to manage view/edit mode
    const [courseType, setCourseType] = useState([]);

    const [isAlertArray, setIsAlertArray] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    //Loader
    const [loading, setLoading] = useState(false);

    const distributionType = ([
        { value: "CA", label: "CA" },
        { value: "FE", label: "FE" },
        { value: "BOTH", label: "BOTH" }
    ]);

    const componentTypes = useWatch({
        control,
        name: 'evaluationScheme.distributionType',
    }) || [];

    // Ensure componentTypes is an array
    const hasBoth = componentTypes.value === 'BOTH';
    const hasCa = componentTypes.value === 'CA';
    const hasFe = componentTypes.value === 'FE';

    const onError = (errorsAll) => {

        const findFirstError = (errors, prefix = '') => {
            for (const key in errors) {
                if (errors[key].type) {
                    return prefix + key;
                }
                if (typeof errors[key] === 'object') {
                    const nestedError = findFirstError(errors[key], `${prefix}${key}.`);
                    if (nestedError) {
                        return nestedError;
                    }
                }
            }
            return null;
        };

        if (Object.keys(errorsAll.evaluationScheme).length > 0) {
            const firstError = findFirstError(errorsAll.evaluationScheme);
            if (firstError) {
                const errorElement = formRef.current.querySelector(`[name="${firstError}"]`);
                if (errorElement) {
                    //errorElement.focus();
                    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    };

    const errorFormating = (error) => {
        return error.join("<br>");
    }


    //Form Submission for Add and Edit
    const onSubmit = async (data) => {
        setIsAlertArray(false);
        setErrorMessage("");
        data = data.evaluationScheme;
        data.distributionType = data.distributionType.value;
        data.courseType = data.courseType.value;

        if (data.distributionType == 'CA') {
            data.FE_Components = [];
            data.markSplitUp.FE = { "actual": 0, "scaled": 0 };

        } else if (data.distributionType == 'FE') {
            data.CA_Components = [];
            data.markSplitUp.CA = { "actual": 0, "scaled": 0 };
        }

        if (data.distributionType == 'BOTH' && (data.markSplitUp.CA.scaled + data.markSplitUp.FE.scaled) != data.markSplitUp.total) {
            callAlertMsg('Sum of CA and FE components is not matched with the over all distribution mark.', 'error');
            window.scrollTo(0, 0);
            return
        } else if (data.distributionType == 'CA' && data.markSplitUp.CA.scaled != data.markSplitUp.total) {
            callAlertMsg('CA component mark is not matched with the over all distribution mark.', 'error');
            window.scrollTo(0, 0);
            return
        } else if (data.distributionType == 'FE' && data.markSplitUp.FE.scaled != data.markSplitUp.total) {
            callAlertMsg('FE component mark is not matched with the over all distribution mark.', 'error');
            window.scrollTo(0, 0);
            return
        }
        setLoading(true);
        if (id) {
            try {
                // Update the existing pattern
                const url = 'evaluation/schemes/';
                const result = await putData(url, { ...data, id: id });
                setLoading(false);
                if (result) {
                    navigate('/markDistribution', {
                        state: { success: result }
                    });
                }
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

        } else {
            try {
                // add the pattern
                const url = 'evaluation/schemes/';
                const result = await postData(url, { ...data });
                if (result) {
                    navigate('/markDistribution', {
                        state: { success: result }
                    });
                }
                setLoading(false);

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

    };

    const handleDistributionTypeChange = (option) => {
        if (option.value == 'CA') {
            setValue(`evaluationScheme.FE_Components`, [{
                name: "", marks: { actual: null, scaled: null },
                hasSubComponent: false, hasConversion: false,
                sub: [{ "name": '', "marks": { actual: null, scaled: null }, "hasSubComponent": false, "hasConversion": false }],
            }]);
            setValue(`evaluationScheme.markSplitUp.FE`, { "actual": null, "scaled": null });

        } else if (option.value == 'FE') {
            setValue(`evaluationScheme.CA_Components`, [{
                name: '', marks: { actual: null, scaled: null },
                hasSubComponent: false, hasConversion: false,
                sub: [{ "name": '', "marks": { actual: null, scaled: null }, "hasSubComponent": false, "hasConversion": false }],
            }]);
            setValue(`evaluationScheme.markSplitUp.CA`, { "actual": null, "scaled": null });
        }
    }

    //Conversion Yes or No Change to set field value
    const handleConversion = (category, scope, index) => {
        if (category) {
            setValue(`evaluationScheme.${scope}[${index}.marks.scaled]`, undefined);
        } else {
            setValue(`evaluationScheme.${scope}[${index}.marks.scaled]`, getValues().evaluationScheme[scope][index].marks.actual);
        }
    };

    const handleConductingChange = (e, field, scope, index) => {
        validateNumber(e, field);
        setTimeout(function () {
            if (!getValues().evaluationScheme[scope][index].hasConversion) {
                handleConversion(false, scope, index)
            }
        }, 10)
    };

    //Api call for Select-inputs
    useEffect(() => {
        let courseTypesObj;
        const getCourseType = async () => {
            const url = `attributes/distinct/type`
            setLoading(true);

            try {
                const result = await getData(url);

                courseTypesObj = result.map(type => ({ value: type.shortName, label: type.name }));

                setCourseType(courseTypesObj);

                if (id) {
                    handleGet();
                }
                setLoading(false);
            } catch (error) {
                setLoading(false);
                callAlertMsg(error.response.data.message, 'error')
            }
        }
        getCourseType();

        //Api call for edit by using id
        const handleGet = async () => {

            const url = `evaluation/schemes/${id}`;
            setLoading(true);

            if (id) {
                try {
                    const result = await getData(url);

                    setValue('evaluationScheme', result);
                    setValue('evaluationScheme.distributionType', distributionType.find(option => option.value === result.distributionType))
                    setValue('evaluationScheme.courseType', courseTypesObj.find(option => option.value === result.courseType));
                    setLoading(false);
                } catch (error) {
                    setLoading(false);
                    callAlertMsg(error.response.data.message, 'error')
                }
            }

        }
    }, []);

    return (
        <div>
            {/* Alert Common */}
            <AlertComponent alertMessage={alertMessage} alert={alert} />

            {/* Loader */}
            <Loader loading={loading} />

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
                        <Link to="/markDistribution">
                            <button className='btn title-back-btn me-2'>
                                <img className='backArrow' src={BackArrow} alt="Back" />
                            </button>
                        </Link>{id ? ((isViewMode) ?
                            (<span className='font-s16'>View Evaluation Scheme</span>)
                            :
                            (<span className='font-s16'>Edit Evaluation Scheme</span>)) : (<span className='font-s16'>Add Evaluation Scheme</span>)
                        }
                    </span>
                </div>
            </div>
            <div>
                <form ref={formRef} onSubmit={handleSubmit(onSubmit, onError)}>
                    <div className='card card-gradient p-5'>
                        <div className='row'>

                            <div className='col-md-6'>
                                <div className='row'>
                                    <div className='col-md-6'>
                                        <label className="form-label form-label-flex"><span className='icon-bg icon-bg-primary'><Icons iconName="model" className="icon-gradient icon-white" /></span><span> Distribution Name</span></label>
                                        <Controller
                                            name="evaluationScheme.name"
                                            control={control}
                                            rules={{ validate: value => value.trim() !== "" || "Distribution name is required", required: "Distribution name is required" }}
                                            render={({ field }) => <InputText
                                                name="name"
                                                type="text"
                                                className="form-control"
                                                value={field.value}
                                                placeholder="Distribution Name"
                                                onChange={(e) => { field.onChange(e.target.value.toUpperCase()) }}
                                                disabled={isViewMode} />} />
                                        {errors?.evaluationScheme?.name && <span className="text-danger">{errors.evaluationScheme.name.message}</span>}
                                    </div>
                                    <div className='col-md-6'>
                                        <label className="form-label form-label-flex"><span className='icon-bg icon-bg-primary'><Icons iconName="gradingtype" className="icon-gradient icon-white" /></span><span> Distribution Type</span></label>
                                        <Controller
                                            name="evaluationScheme.distributionType"
                                            control={control}
                                            rules={{ required: "Distribution type is required" }}
                                            render={({ field }) => <Selector
                                                name="distributionType"
                                                className="select"
                                                options={distributionType}
                                                isMulti={false}
                                                isClearable={false}
                                                value={field.value}
                                                onChange={(value) => {
                                                    field.onChange(value);
                                                    handleDistributionTypeChange(value)
                                                }}
                                                disabled={isViewMode}
                                            />
                                            }
                                        />
                                        {errors?.evaluationScheme?.distributionType && <p className="text-danger">{errors.evaluationScheme.distributionType.message}</p>}
                                    </div>
                                </div>
                            </div>
                            <div className='col-md-6'>
                                <div className='row'>
                                    <div className='col-md-6'>
                                        <label className="form-label form-label-flex"><span className='icon-bg icon-bg-primary'><Icons iconName="gradingtype" className="icon-gradient icon-white" /></span><span> Course Type</span></label>
                                        <Controller
                                            name="evaluationScheme.courseType"
                                            control={control}
                                            rules={{ required: "Course type is required" }}
                                            render={({ field }) => <Selector
                                                name="courseType"
                                                className="select"
                                                options={courseType}
                                                isMulti={false}
                                                isClearable={false}
                                                value={field.value}
                                                onChange={(value) => { field.onChange(value); }}
                                                disabled={isViewMode} />} />
                                        {errors?.evaluationScheme?.courseType && <p className="text-danger">{errors.evaluationScheme.courseType.message}</p>}
                                    </div>
                                    <div className='col-md-6'>
                                        <label className="form-label form-label-flex"><span className='icon-bg icon-bg-primary'><Icons iconName="coursetype" className="icon-gradient icon-white" /></span><span> Overall Mark Distribution</span></label>
                                        <Controller
                                            name="evaluationScheme.markSplitUp.total"
                                            control={control}
                                            rules={{
                                                required: "Overall mark is required",
                                                max: {
                                                    value: 500,
                                                    message: "Maximum value is 500"
                                                },
                                                pattern: {
                                                    value: /^[0-9]*[1-9][0-9]*$/,
                                                    message: 'Input must be a number greater than 0.'
                                                }
                                            }}
                                            render={({ field }) => <InputText
                                                name="markSplitUp.total"
                                                type="number"
                                                className="form-control"
                                                placeholder="Overall Mark"
                                                value={field.value}
                                                onChange={handleNumberChangeEvalScheme(field)}
                                                disabled={isViewMode} />} />
                                        {errors?.evaluationScheme?.markSplitUp?.total && <span className="text-danger">{errors.evaluationScheme.markSplitUp.total.message}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        {hasCa || hasBoth ? (<CaComponent
                            control={control}
                            isViewMode={isViewMode}
                            errors={errors}
                            Controller={Controller}
                            getValues={getValues}
                            setValue={setValue}
                            handleConversion={handleConversion}
                            handleConductingChange={handleConductingChange}
                        />) : ""
                        }
                        {hasFe || hasBoth ? (
                            <FeComponent
                                control={control}
                                isViewMode={isViewMode}
                                errors={errors}
                                Controller={Controller}
                                getValues={getValues}
                                setValue={setValue}
                                handleConversion={handleConversion}
                                handleConductingChange={handleConductingChange}
                            />) : ""}
                    </div>
                    <div className='row my-5'>
                        <div className='col-md-12 text-end'>
                            <button type="button" className='btn btn-cancel me-3 px-5' onClick={() => navigate('/markDistribution')}>Close</button>
                            {!isViewMode && (
                                <button type="submit" className="btn btn-primary px-5">{id ? 'Update' : 'Add'}</button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>

    )
}

export default AddDistribution