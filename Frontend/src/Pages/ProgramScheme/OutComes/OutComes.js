import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import BackArrow from '../../../Assets/images/regulationHeader/arrow-back.svg';
import ProgramOutcome from './Components/ProgramOutcomes/ProgramOutcome.js';
import Loader from '../../../Components/Loader.js';
import AlertComponent from '../../../Components/AlertComponent.js';
import { useAlertMsg } from '../../../Services/AllServices.js';
import CourseOutcomes from './Components/CourseOutcomes/CourseOutcomes'

const OutComes = () => {

    const navigate = useNavigate();

    //Alert
    const { alert, alertMessage, callAlertMsg } = useAlertMsg();

    //Loader
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState()

    const [cardActive, setCardActive] = useState(true);

    const [activeStep, setActiveStep] = useState(0);

    const [CourseActiveStep, setCourseActiveStep] = useState(0);

    const [state, setState] = useState(useLocation().state)


    const handleProgram = () => {
        setCardActive(true);
    };

    const handleCourse = () => {
        setCardActive(false);
    };

    const getData = () => {
        let result = sessionStorage.getItem("programmeData") || "";
        if (result) {
            result = JSON.parse(result);
            return {
                preveiousPath: result.preveiousPath,
                programmeId: result.programmeId,
                regulationId: result.regulationId,
                prgmRegId: result.prgmRegId,
                programmeName: result.programmeName,
                regulationYear: result.regulationYear
            }
        }
        navigate("/programmeScheme")
    }

    useEffect(() => {
        if (state) {
            sessionStorage.setItem("programmeData", JSON.stringify(state));
        }
        else {
            let result = getData();
            setState(result)
        }
    }, [])

    return (
        <div>
            {/* Alert */}
            <AlertComponent alertMessage={alertMessage} alert={alert} />

            {/* Loader */}
            <Loader loading={loading} />


            <div className='row'>
                <div className="base-title m-0">
                    <span className='d-flex align-items-center'>
                        <button type='button' className='btn title-back-btn me-2' onClick={() => navigate(state?.preveiousPath)}>
                            <img className='backArrow' src={BackArrow} alt="Back" />
                        </button>
                        <span className='font-s16'>OBE - {title && !cardActive ? title : `${state?.programmeName} , Regulation - ${state?.regulationYear}`}</span>
                    </span>
                </div>
            </div>


            <div className='d-flex justify-content-center my-3'>
                <div className='bg-blue'>
                    <button
                        className={`btn ${cardActive ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => handleProgram()}
                    >
                        Programme Out Come
                    </button>

                    <button
                        className={`btn ms-3 ${!cardActive ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => handleCourse()}
                    >
                        Course Out Come
                    </button>
                </div>
            </div>


            {state && <div className="row d-flex justify-content-center">
                <div className='col-md-12'>
                    <div className="outcomes-card card">
                        <div>
                            {cardActive ? (

                                <ProgramOutcome activeStep={activeStep} setActiveStep={setActiveStep} prgmRegId={state?.prgmRegId} callAlertMsg={callAlertMsg} setLoading={setLoading} />

                            ) : (

                                <CourseOutcomes setTitle={setTitle} activeStep={CourseActiveStep} setActiveStep={setCourseActiveStep} regulationId={state?.regulationId} prgmRegId={state?.prgmRegId} setLoading={setLoading} callAlertMsg={callAlertMsg} />

                            )}
                        </div>
                    </div>

                </div>
            </div>}

        </div>


    )
}

export default OutComes