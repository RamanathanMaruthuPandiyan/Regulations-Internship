import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import BackArrow from '../../../Assets/images/regulationHeader/arrow-back.svg';
import Icons from '../../../Components/Icons';
import InputText from '../../../Components/InputText';
import Loader from '../../../Components/Loader';
import AlertComponent from '../../../Components/AlertComponent';
import { getData, postData, putData } from '../../../Services/ApiServices';
import { useAlertMsg } from '../../../Services/AllServices';
import { handleNumberChange, validateNumber } from '../../../Services/AllServices';

const AddPatterns = () => {

    const { id, type } = useParams();
    const navigate = useNavigate();

    const { control, handleSubmit, formState: { errors }, setValue } = useForm(); /*hook destructured*/

    const { alert, alertMessage, callAlertMsg } = useAlertMsg();

    //Loader
    const [loading, setLoading] = useState(false);

    const [isViewMode, setIsViewMode] = useState(type == "view" ? true : false);

    //Form Submission for Add and Edit
    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const url = 'credits/';
            let result;

            if (id) {
                result = await putData(url, { ...data.patterns, id });
                setLoading(false);
                navigate('/creditAssignment', { state: { success: result } });
            } else {
                result = await postData(url, data.patterns);
                setLoading(false);
                navigate('/creditAssignment', { state: { success: result } });
            }
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error')
        }
    };

    //Get Api for edit using id
    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                setLoading(true);
                try {
                    const result = await getData(`credits/${id}`);
                    setValue('patterns', result);
                    setLoading(false);
                } catch (error) {
                    setLoading(false);
                    callAlertMsg(error.response.data.message, 'error')
                }
            }
        };

        fetchData();
    }, [id]);

    return (
        <div>

            {/* Alert Common */}
            <AlertComponent alertMessage={alertMessage} alert={alert} />

            {/* Loader */}
            <Loader loading={loading} />


            <div className='row'>
                <div className="base-title">
                    <span className='d-flex align-items-center'>
                        <Link to="/creditAssignment">
                            <button className='btn title-back-btn me-2'>
                                <img className='backArrow' src={BackArrow} alt="Back" />
                            </button>
                        </Link>{id ? ((isViewMode) ?
                            (<span className='font-s16'>View Credit Assignment</span>)
                            :
                            (<span className='font-s16'>Edit Credit Assignment</span>)) : (<span className='font-s16'>Add Credit Assignment</span>)
                        }
                    </span>
                </div>
            </div>
            <div className='card p-5 card-background-gray-2'>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className='row mb-4'>
                        <div className="col-sm-6 col-lg-4 form-group">
                            <label className="form-label form-label-flex">
                                <span className='icon-bg icon-bg-gradient'><Icons iconName="model" className="icon-gradient icon-white" /></span> <span> Pattern Name</span> </label>
                            <Controller
                                name="patterns.name"
                                control={control}
                                rules={{
                                    validate: value => value.trim() !== "" || "Pattern name is required",
                                    required: "Pattern name is required"
                                }}
                                render={({ field }) => <input type="text" className="form-control" value={field.value} {...field} onChange={(e) => { field.onChange(e.target.value.toUpperCase()) }} />}
                            />
                            {errors.patterns?.name && <span className="text-danger">{errors.patterns.name.message}</span>}
                        </div>
                    </div>

                    <div className='row mb-5'>
                        <div className='col-md-6'>
                            <label className="form-label form-label-flex">
                                <span className='icon-bg icon-bg-gradient'><Icons iconName="patterndetails" className="icon-gradient icon-white" /></span> Pattern Details
                            </label>
                            <div className='col-md-6'>
                                <table className='table pattern-table'>
                                    <thead>
                                        <tr>
                                            <td>L</td>
                                            <td>T</td>
                                            <td>P</td>
                                            <td>C</td>
                                        </tr>
                                    </thead>
                                </table>
                                <div className="input-group pattern-group validation-parent mt-3">
                                    <Controller
                                        name="patterns.lecture"
                                        control={control}
                                        rules={{
                                            required: true,
                                            max: {
                                                value: 100,
                                                message: "& Maximum value is 100"
                                            },
                                            pattern: {
                                                value: /^[0-9]*[1-9][0-9]*$/,
                                                message: 'Input must be a number greater than 0'
                                            }
                                        }}
                                        render={({ field }) => (
                                            <>
                                                <InputText
                                                    type="number"
                                                    className="form-control py-2"
                                                    {...field}
                                                    onChange={handleNumberChange(field)}
                                                />
                                                {errors.patterns?.lecture && <span className="text-danger">{errors.patterns.lecture.message}</span>}
                                            </>
                                        )}
                                    />
                                    <Controller
                                        name="patterns.tutorial"
                                        control={control}
                                        rules={{
                                            required: true,
                                            max: {
                                                value: 100,
                                                message: "& Maximum value is 100"
                                            },
                                            pattern: {
                                                value: /^[0-9]*[1-9][0-9]*$/,
                                                message: 'Input must be a number greater than 0'
                                            }
                                        }}
                                        render={({ field }) => (
                                            <>
                                                <InputText
                                                    type="number"
                                                    className="form-control py-2"
                                                    {...field}
                                                    onChange={handleNumberChange(field)}
                                                />
                                                {errors.patterns?.tutorial && <span className="text-danger">{errors.patterns.tutorial.message}</span>}
                                            </>
                                        )}
                                    />
                                    <Controller
                                        name="patterns.practical"
                                        control={control}
                                        rules={{
                                            required: true,
                                            max: {
                                                value: 100,
                                                message: "& Maximum value is 100"
                                            },
                                            pattern: {
                                                value: /^[0-9]*[1-9][0-9]*$/,
                                                message: 'Input must be a number greater than 0'
                                            }
                                        }}
                                        render={({ field }) => (
                                            <>
                                                <InputText
                                                    type="number"
                                                    className="form-control py-2"
                                                    {...field}
                                                    onChange={handleNumberChange(field)}
                                                />
                                                {errors.patterns?.practical && <span className="text-danger">{errors.patterns.practical.message}</span>}
                                            </>
                                        )}
                                    />
                                    <Controller
                                        name="patterns.credits"
                                        control={control}
                                        rules={{
                                            required: true,
                                            max: {
                                                value: 100,
                                                message: "& Maximum value is 100"
                                            }
                                        }}
                                        render={({ field }) => (
                                            <>
                                                <InputText
                                                    type="number"
                                                    step="0.1"
                                                    className="form-control py-2"
                                                    {...field}
                                                    onChange={(e) => { validateNumber(e, field) }}
                                                />
                                                {errors.patterns?.credits && <span className="text-danger">{errors.patterns.credits.message}</span>}
                                            </>
                                        )}
                                    />
                                </div>
                                {(errors.patterns?.lecture || errors.patterns?.tutorial || errors.patterns?.practical || errors.patterns?.credits) ||
                                    (errors.patterns?.lecture?.message || errors.patterns?.tutorial?.message || errors.patterns?.practical?.message || errors.patterns?.credits?.message)
                                    ? (
                                        <div className="text-danger d-flex">Enter pattern details</div>
                                    ) : (
                                        <label className="mt-3 text-primary font-s14">Please Enter Pattern Details</label>
                                    )}
                            </div>
                        </div>
                    </div>


                    <div className='row mt-5'>
                        <div className='col-12 text-end'>
                            <button type="button" className="btn btn-cancel me-3 px-5" onClick={() => navigate('/creditAssignment')}>Close</button>
                            <button type="submit" className="btn btn-primary px-5">{id ? 'Update' : 'Add'}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddPatterns
