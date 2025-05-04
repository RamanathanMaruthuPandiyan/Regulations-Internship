import React, { useState, useEffect } from 'react';
import Icons from '../../../Components/Icons';
import CardTagComponent from '../../../Components/CardTagComponent';
import SemesterTable from './SemesterTable';
import { useAppContext } from '../Context/Context';
import { putData, getData } from '../../../Services/ApiServices';


const Semesters = ({ access, courses, handleOpenAddCourseModal, getBasicInfo, freezeButtonAccess }) => {

    const {
        setLoading,
        enumCoursesDisplayStatus,
        regulationId,
        programId,
        callAlertMsg,
        coursesPagination,
        modal,
        modalToggle } = useAppContext();

    const enumSemesterColors = {
        'FR': 'success',
        'NF': 'secondary'
    }

    const [semester, setSemester] = useState(null);

    const [slectedSemester, setSelectedSemester] = useState(null);

    const [isFreezeActive, setIsFreezeActive] = useState(false);

    const [activeAccordion, setActiveAccordion] = useState(0);

    const handleCheckForSemesterConfimed = async (semester) => {
        setLoading(true);
        const url = `courses/is/freeze/active/${semester}/${regulationId}/${programId}`;
        try {
            if (semester != null) {
                const result = await getData(url);
                setIsFreezeActive(result.isFreezeActive);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    const handleFreeze = async (semester) => {
        setLoading(true);
        const data = {
            regulationId: regulationId,
            prgmId: programId,
            semester: semester
        }
        try {
            const result = await putData(`programme/regulations/freeze/semester`, data);
            callAlertMsg(result, 'success');
            coursesPagination();
            handleCloseConfirmModal();
            setLoading(false);
        } catch (error) {
            setLoading(false);
            handleCloseConfirmModal();
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    const handleOpenConfirmModal = (semester) => {
        setSelectedSemester(semester);
        modalToggle({ confirmModalFreeze: true });
    };

    const handleCloseConfirmModal = () => {
        setSelectedSemester(null);
        modalToggle({ confirmModalFreeze: false });
    };

    useEffect(() => {
        if (courses && courses.length > 0 && activeAccordion == 0) {
            const initialSemester = courses[0].semester;
            setSemester(initialSemester);
            handleCheckForSemesterConfimed(initialSemester);
        } else if (courses && courses.length > 0) {
            handleCheckForSemesterConfimed(semester);
        }
    }, [courses]);


    const setSemesterValue = (e, id, semester) => {
        const semesterId = document.getElementById("semester" + id);
        const isExpanded = semesterId.getAttribute("aria-expanded") === 'true';
        if (activeAccordion != id) {
            setIsFreezeActive(false);
        }
        setActiveAccordion(activeAccordion === id ? -1 : id);
        setSemester(isExpanded ? semester : null);
        if (isExpanded) {
            handleCheckForSemesterConfimed(semester);
        }
    }


    return (
        <div>
            {courses &&
                courses.map((item, key) => (
                    <div className="accordion-item" key={key}>
                        <h2 className="accordion-header position-relative">
                            <button className={'accordion-button ' + ((key == 0) ? '' : 'collapsed')} type="button" id={`semester${key}`}
                                data-bs-toggle="collapse" data-bs-target={'#collapseProgram' + key} aria-expanded={(key == 0) ? true : false} aria-controls="collapseOne" onClick={(e) => setSemesterValue(e, key, item['semester'])}>
                                <span className='icon-bg sem-span-icon'>
                                    <Icons iconName="coursetype" className='semester-icon icon-gradient' /></span>
                                <span>{item._id}
                                    {enumCoursesDisplayStatus && enumCoursesDisplayStatus.descriptions &&
                                        Object.entries(enumCoursesDisplayStatus.descriptions).map(([semKey, value]) => {
                                            if (item.status === semKey) {
                                                return (
                                                    <span key={semKey} className={'ms-4 verify-status ' + enumSemesterColors[item.status]}>{enumCoursesDisplayStatus.descriptions[item.status]} </span>
                                                )
                                            }
                                        })
                                    }
                                </span>
                            </button>

                            {(freezeButtonAccess && activeAccordion === key && isFreezeActive) &&
                                (<button className='btn btn-freeze' onClick={() => handleOpenConfirmModal(item.semester)}>
                                    <Icons iconName="lock" className="icon-12 me-2" />
                                    <span className='align-middle'>Freeze</span>
                                </button>)
                            }
                        </h2>
                        <div id={'collapseProgram' + key} className={'accordion-collapse collapse ' + ((key == 0) ? 'show' : '')} data-bs-parent="#programSchemeDetails">
                            <div className="accordion-body">
                                <div className='row mt-3'>
                                    <div className='col-md-12 d-flex flex-no-wrap'>
                                        {item.count && Object.keys(item?.count?.type).map((keyName, keyIndex) => (
                                            <CardTagComponent key={keyIndex} parentClass="primary" title={keyName} count={item.count["type"][keyName]} />
                                        ))}
                                    </div>
                                </div>

                                <div className='row mt-3'>
                                    <div className='col-md-12 d-flex flex-no-wrap'>
                                        {item.count && Object.keys(item?.count?.category).map((keyName, keyIndex) => (
                                            <CardTagComponent key={keyIndex} parentClass="primary" title={keyName} count={item.count["category"][keyName]} />
                                        ))}
                                    </div>
                                </div>

                                <div className='row'>
                                    <div className='col-md-12 d-flex flex-wrap'>
                                        <CardTagComponent parentClass="white" title={'Lecture'} count={item.totalLecture} />
                                        <CardTagComponent parentClass="white" title={'Tutorial'} count={item.totalTutorial} />
                                        <CardTagComponent parentClass="white" title={'Practical'} count={item.totalPractical} />
                                        <CardTagComponent parentClass="white" title={'Credit Score'} count={item.totalCredits} />
                                    </div>
                                </div>

                                <div>
                                    {/* Semester Table Section */}
                                    <SemesterTable access={access} courses={item.courses} handleOpenAddCourseModal={handleOpenAddCourseModal} getBasicInfo={getBasicInfo} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            }

            {modal.confirmModalFreeze &&
                <div>
                    <div className="modal fade show" id="confirmModal" tabIndex="-1" aria-labelledby="confirmModal" aria-hidden="true" style={{ display: 'block' }}>
                        <div className="modal-dialog modal-dialog-centered confirm-msg-modal">
                            <div className="modal-content">
                                <div className="modal-body">
                                    <div className="confirm-modal-title">
                                        <Icons iconName="are_you_sure" className="mt-2 icon-60" />
                                        <span> Are you sure?</span>
                                    </div>
                                    <p className="confirm-modal-sec text-center">
                                        Do you want to freeze <strong>
                                            <span>semester {slectedSemester} </span>
                                        </strong> ?
                                    </p>

                                    <div className="freeze-alert mb-3">
                                        <span>
                                            <Icons iconName="info" className="icon-16 me-2" />
                                        </span>
                                        <span className='align-middle'>Once the semester schedule is freezed, no courses can be added.</span>
                                    </div>

                                    <div className="confirm-modal-button">

                                        <button type="button" className="btn btn-cancel me-3" onClick={handleCloseConfirmModal}>Cancel</button>

                                        <button type="button" className="btn btn-warning" onClick={() => handleFreeze(slectedSemester)}>
                                            Yes, Confirm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </div>
            }

        </div>
    )
}

export default Semesters;