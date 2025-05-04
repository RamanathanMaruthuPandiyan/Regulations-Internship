import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller, useFieldArray } from 'react-hook-form';

import InputText from '../../../Components/InputText';
import Icons from '../../../Components/Icons';
import Selector from '../../../Components/Selector';
import AlertComponent from '../../../Components/AlertComponent';
import Loader from '../../../Components/Loader';
import { getData, postData, putData } from '../../../Services/ApiServices';
import { useAlertMsg } from '../../../Services/AllServices';
import { handleNumberChange } from '../../../Services/AllServices';
import { Link } from 'react-router-dom';
import BackArrow from '../../../Assets/images/regulationHeader/arrow-back.svg';

function AddGrading() {

    const { id, type } = useParams();
    const navigate = useNavigate();
    const { control, handleSubmit, formState: { errors }, setValue, getValues } = useForm({
        defaultValues: {
            grading: {
                "grades": [{ letter: "", min: "", max: "", point: "" }] // Initial array with one empty object
            },
        },
    }); //hook destructured

    // extracting the `fields` array, `append` , renaming , `remove` function to`handleRemoveRow`
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'grading.grades'
    });

    const { alert, alertMessage, callAlertMsg } = useAlertMsg();

    const [isViewMode, setIsViewMode] = useState(type == "view" ? true : false); // State to manage view/edit mode
    const [gradeType, setGradeType] = useState([])
    const [courseType, setCourseType] = useState([])
    const [letterGrade, setLetterGrade] = useState([]);
    const [selectedGrades, setSelectedGrades] = useState([]);

    //Loader
    const [loading, setLoading] = useState(false);


    const handleRemoveRow = (index) => {
        const letterToRemove = getValues(`grading.grades[${index}].letter`);

        if (letterToRemove && Object.keys(letterToRemove).length) {
            setSelectedGrades(prevSelectedGrades =>
                prevSelectedGrades.filter(grade => grade.value !== letterToRemove.value)
            );
        }

        remove(index);
    };

    //Add Row
    const handleAddRow = () => {
        if (fields.length < letterGrade.length) {
            append({ letter: "", min: "", max: "", point: "" });
        }
    };


    const handleGradeChange = (index, value) => {
        const updatedGrades = [...selectedGrades];
        updatedGrades[index] = value;
        setSelectedGrades(updatedGrades);
    };

    //Form Submission for Add and Edit
    const onSubmit = async (data) => {
        data = data.grading;
        data.courseType = data.courseType.value;
        data.gradeType = data.gradeType.value;
        data.grades = data.grades.map((item) => {
            return { "letter": item.letter.value, "min": item.min, "max": item.max, "point": item.point }
        })
        setLoading(true);
        if (id) {
            try {
                // Update the existing pattern
                const url = 'grades/';
                const result = await putData(url, { ...data, id: id });
                setLoading(false);
                navigate('/grading', {
                    state: { success: result }
                })
            } catch (error) {
                setLoading(false);
                window.scrollTo(0, 0);
                callAlertMsg(error.response.data.message, 'error')
            }

        } else {
            try {
                // add the pattern
                const url = 'grades/';
                const result = await postData(url, { ...data });
                navigate('/grading', {
                    state: { success: result }
                })
                setLoading(false);
            } catch (error) {
                setLoading(false);
                window.scrollTo(0, 0);
                callAlertMsg(error.response.data.message, 'error')
            }
        };
    }

    //Api call for Select-inputs
    useEffect(() => {
        let gradeTypeObj, courseTypesObj, letterGradesObj;
        const fetchOptions = async () => {
            setLoading(true);
            try {
                const gradeTypes = await getData('attributes/distinct/gradeType');
                const courseTypes = await getData('attributes/distinct/type');
                const letterGrades = await getData('attributes/distinct/letterGrade');

                gradeTypeObj = gradeTypes.map(grade => ({ value: grade.shortName, label: grade.name }));
                courseTypesObj = courseTypes.map(course => ({ value: course.shortName, label: course.name }));
                letterGradesObj = letterGrades.map(letter => ({ value: letter.shortName, label: letter.shortName }));

                setGradeType(gradeTypeObj);
                setCourseType(courseTypesObj);
                setLetterGrade(letterGradesObj);
                if (id) {
                    handleGetGrading();
                }
                setLoading(false);
            } catch (error) {
                setLoading(false);
                window.scrollTo(0, 0);
                callAlertMsg(error.response.data.message, 'error')
            }

        };
        fetchOptions();


        //Api call for edit by using id
        const handleGetGrading = async () => {

            const url = `grades/${id}`;
            if (id) {
                setLoading(true);
                try {
                    const result = await getData(url);
                    setValue("grading.name", result.name);
                    setValue("grading.grades", result.grades)
                    setValue('grading.gradeType', gradeTypeObj.find(option => option.value === result.gradeType));
                    setValue('grading.courseType', courseTypesObj.find(option => option.value === result.courseType));
                    result.grades.map((item, index) => {
                        setValue(`grading.grades[${index}].letter`, letterGradesObj.find(option => option.value === result.grades[index].letter));
                    });

                    const selectedLetters = result.grades.map(grade => ({ value: grade.letter }));
                    setSelectedGrades(selectedLetters);
                    setLoading(false);

                } catch (error) {
                    setLoading(false);
                    window.scrollTo(0, 0);
                    callAlertMsg(error.response.data.message, 'error')
                }
            }

        }
        fetchOptions();
    }, [id, setValue, setLoading, setGradeType, setCourseType, setLetterGrade, setSelectedGrades]);


    return (
        <div>

            {/* Alert Common */}
            <AlertComponent alertMessage={alertMessage} alert={alert} />

            {/* Loader */}
            <Loader loading={loading} />

            <div className='row'>
                <div className="base-title">
                    <span className='d-flex align-items-center'>
                        <Link to="/grading">
                            <button className='btn title-back-btn me-2'>
                                <img className='backArrow' src={BackArrow} alt="Back" />
                            </button>
                        </Link>{id ? ((isViewMode) ?
                            (<span className='font-s16'>View Grading</span>)
                            :
                            (<span className='font-s16'>Edit Grading</span>)) : (<span className='font-s16'>Add Grading</span>)
                        }
                    </span>
                </div>
            </div>
            <div className='card p-5 card-background-gray-2'>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className='row mb-5'>
                        <div className='col-md-5'>
                            <div className='row'>
                                <div className='col-md-11'>
                                    <label className="form-label form-label-flex">
                                        <span className='icon-bg icon-bg-primary'><Icons iconName="model" className="icon-gradient icon-white" /></span><span> Grading Name</span></label>
                                    <Controller
                                        name="grading.name"
                                        control={control}
                                        rules={{ validate: value => value.trim() !== "" || "Grading name is required", required: "Grading name is required" }}
                                        render={({ field }) => (
                                            <InputText
                                                placeholder="Grading Name"
                                                {...field}
                                                value={field.value}
                                                disabled={isViewMode}
                                                onChange={(e) => { field.onChange(e.target.value.toUpperCase()) }}
                                            />
                                        )}
                                    />
                                    {errors.grading?.name && (
                                        <p className="text-danger">{errors.grading.name.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className='col-md-5 col-lg-7 col-xl-7'>
                            <div className='row'>
                                <div className='col-md-6'>
                                    <label className="form-label form-label-flex"><span className='icon-bg icon-bg-primary'><Icons iconName="gradingtype" className="icon-gradient icon-white" /></span><span> Grading Type</span></label>

                                    <Controller
                                        name="grading.gradeType"
                                        control={control}
                                        rules={{ required: "Grade type is required" }}
                                        render={({ field }) => (
                                            <Selector
                                                className="select"
                                                options={gradeType}
                                                isMulti={false}
                                                isClearable={false}
                                                value={field.value}
                                                onChange={(value) => { field.onChange(value) }}
                                                disabled={isViewMode}
                                            />
                                        )}
                                    />
                                    {errors.grading?.gradeType && (
                                        <p className="text-danger">{errors.grading.gradeType.message}</p>
                                    )}
                                </div>
                                <div className='col-md-6'>
                                    <label className="form-label form-label-flex"><span className='icon-bg icon-bg-primary'><Icons iconName="coursetype" className="icon-gradient icon-white" /></span><span> Course Type</span></label>

                                    <Controller
                                        name="grading.courseType"
                                        control={control}
                                        rules={{ required: "Course type is required" }}
                                        render={({ field }) => (
                                            <Selector
                                                className="select"
                                                options={courseType}
                                                isMulti={false}
                                                isClearable={false}
                                                value={field.value}
                                                onChange={(value) => { field.onChange(value) }}
                                                disabled={isViewMode}
                                            />
                                        )}
                                    />
                                    {errors.grading?.courseType && (
                                        <p className="text-danger">{errors.grading.courseType.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <>
                        {fields.map((field, index) => (
                            <div className='row mb-35 px-4' key={field.id}>
                                <div className='col-md-5'>
                                    <div className='row'>
                                        <div className='col-md-11'>
                                            <div className='row'>
                                                <div className='col-md-6'>
                                                    <label className="form-label mb-2 font-s14">Letter Grade</label>

                                                    <Controller
                                                        name={`grading.grades[${index}].letter`}
                                                        control={control}
                                                        rules={{ required: "Letter grade is required" }}
                                                        render={({ field }) => (
                                                            <Selector
                                                                className="select"
                                                                options={letterGrade.filter(option => !selectedGrades.some(grade => grade.value === option.value))}
                                                                isMulti={false}
                                                                isClearable={false}
                                                                value={field.value}
                                                                onChange={(value) => { handleGradeChange(index, value); field.onChange(value) }}
                                                                disabled={isViewMode}
                                                            />
                                                        )}
                                                    />
                                                    {errors.grading?.grades?.[index]?.letter && (
                                                        <p className="text-danger">{errors.grading.grades[index].letter.message}</p>
                                                    )}
                                                </div>
                                                <div className='col-md-6'>
                                                    <label className="form-label mb-2 font-s14">Minimum Marks</label>

                                                    <Controller
                                                        name={`grading.grades[${index}].min`}
                                                        control={control}
                                                        rules={{
                                                            validate: {
                                                                required: value => value !== undefined && value !== '' || "Minimum marks is required",
                                                                max: value => value <= 100 || "Maximum value is 100",
                                                                pattern: value => /^[0-9]*[0-9][0-9]*$/.test(value) || 'Input must be a number greater than or equal to 0.'
                                                            }
                                                        }}
                                                        render={({ field }) => (
                                                            <>
                                                                <InputText
                                                                    type="number"
                                                                    placeholder="Minimum Marks"
                                                                    {...field}
                                                                    value={field.value}
                                                                    onChange={handleNumberChange(field)}
                                                                    disabled={isViewMode}
                                                                />
                                                                {errors.grading?.grades?.[index]?.min && (
                                                                    <p className="text-danger">{errors.grading.grades[index].min.message}</p>
                                                                )}
                                                            </>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='col-md-5 col-lg-7 col-xl-7'>
                                    <div className='row'>
                                        <div className='col-md-6 col-lg-4 col-xl-4'>
                                            <label className="form-label mb-2 font-s14">Maximum Marks</label>

                                            <Controller
                                                name={`grading.grades[${index}].max`}
                                                control={control}
                                                rules={{
                                                    validate: {
                                                        required: value => value !== undefined && value !== '' || "Maximum marks is required",
                                                        max: value => value <= 100 || "Maximum value is 100",
                                                        pattern: value => /^[0-9]*[0-9][0-9]*$/.test(value) || 'Input must be a number greater than or equal to 0.'
                                                    }
                                                }}
                                                render={({ field }) => (
                                                    <InputText
                                                        type="number"
                                                        placeholder="Maximum Marks"
                                                        {...field}
                                                        value={field.value}
                                                        onChange={handleNumberChange(field)}
                                                        disabled={isViewMode}
                                                    />
                                                )}
                                            />
                                            {errors.grading?.grades?.[index]?.max && (
                                                <p className="text-danger">{errors.grading.grades[index].max.message}</p>
                                            )}
                                        </div>
                                        <div className='col-md-6 col-lg-4 col-xl-4'>
                                            <label className="form-label mb-2 font-s14">Grade Point</label>

                                            <Controller
                                                name={`grading.grades[${index}].point`}
                                                control={control}
                                                rules={{
                                                    validate: {
                                                        required: value => value !== undefined && value !== '' || "Grade point is required",
                                                        max: value => value <= 100 || "Maximum value is 100",
                                                        pattern: value => /^[0-9]*[0-9][0-9]*$/.test(value) || 'Input must be a number greater than or equal to 0.'
                                                    }
                                                }}
                                                render={({ field }) => (
                                                    <InputText
                                                        type="number"
                                                        placeholder="Grade Point"
                                                        {...field}
                                                        value={field.value}
                                                        onChange={handleNumberChange(field)}
                                                        disabled={isViewMode}
                                                    />
                                                )}
                                            />
                                            {errors.grading?.grades?.[index]?.point && (
                                                <p className="text-danger">{errors.grading.grades[index].point.message}</p>
                                            )}
                                        </div>
                                        <div className='col-md-4 col-lg-4 col-xl-4 d-flex align-items-center pt-4'>
                                            {(fields.length < letterGrade.length) && !isViewMode && index === fields.length - 1 && (
                                                <div className='me-3'>
                                                    <a className='add-btn' onClick={handleAddRow}>
                                                        <Icons iconName="addcircle" className="icon-15 icon-primary me-1" />Add
                                                    </a>
                                                </div>
                                            )}

                                            {!isViewMode && index !== 0 && (
                                                <div className='delete-icon-bg'>
                                                    <a className='remover-btn' onClick={() => handleRemoveRow(index)}>
                                                        <Icons iconName="delete" className="icon-15" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                    <div className='row mt-5'>
                        <div className='col-12 text-end'>
                            <button type="button" className="btn btn-cancel me-3 px-5" onClick={() => navigate('/grading')}>Close</button>
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

export default AddGrading;
