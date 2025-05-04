import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import Icons from '../../../../../Components/Icons'
import { getData, postData, putData } from '../../../../../Services/ApiServices';
import { useAlertMsg } from '../../../../../Services/AllServices';
import AlertComponent from '../../../../../Components/AlertComponent';
import Loader from '../../../../../Components/Loader';
import { useForm, Controller } from 'react-hook-form';
import Selector from '../../../../../Components/Selector';
import { useAppContext as useKeycloakContext } from '../../../../../Keycloak/InitiateKeycloak';
import create from '../../../../../Assets/images/course_Out_Come.svg';
import { enumColors } from '../../../../../Services/AllServices'

const ConfirmedCourseList = ({ mappingEnums, handleNextPageClick, setCourseId, setTitle, prgmRegId }) => {

    //Alert
    const { alert, alertMessage, callAlertMsg } = useAlertMsg();
    const { alert: alertAssignModal, alertMessage: alertAssignMessageModal, callAlertMsg: callAlertAssignMsgModal } = useAlertMsg();

    //Loader
    const [loading, setLoading] = useState(false);

    const [modal, setModal] = useState({ assignFaculty: false });
    const [selectedId, setSelectedId] = useState(null);
    const { control, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm();

    const [courseList, setCourseList] = useState([]);
    const [facultyOptions, setFacultyOptions] = useState([]);
    const { keycloak } = useKeycloakContext();

    // GET Confirmed Course List
    const getConfirmCourseList = async () => {
        setLoading(true);

        const url = `courses/mapping/${prgmRegId}`;
        try {
            const result = await getData(url);
            setCourseList(result);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    // GET CO-Uploders
    const getFaculties = async (existingFaculties = []) => {
        setLoading(true);
        const url = `courses/co/uploaders`;
        try {
            let result = await getData(url);
            let faculties = [];
            result = result?.map((user) => {
                let field = { label: `${user.id} - ${user.name}`, value: user.id };
                if (existingFaculties.includes(user.id)) {
                    faculties.push(field);
                }
                return field;
            })
            setValue("faculty", faculties)
            setFacultyOptions(result);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
            handleModalClose()
        }
    };

    useEffect(() => {
        getConfirmCourseList();
    }, []);

    setTitle("");

    const handleAssignFaculty = (course) => {
        setSelectedId(course._id);
        getFaculties(course.coUploaders)
        setModal({ ...modal, assignFaculty: true });
    }

    const assignFaculty = async ({ faculty }) => {
        setLoading(true);
        const url = `courses/co/uploader/${selectedId}`;
        try {
            faculty = faculty.map((faculty) => faculty.value)
            const result = await putData(url, { facultyIds: faculty });
            setLoading(false);
            callAlertMsg(result, 'success');
            handleModalClose();
        } catch (error) {
            setLoading(false);
            callAlertAssignMsgModal(error.response.data.message, 'error')
            window.scroll(0, 0);
        }

    };


    const handleModalClose = () => {
        setModal({ ...modal, assignFaculty: false });
        setSelectedId("");
        getConfirmCourseList();
    }
    return (
        <>
            {/* Alert Common */}
            <AlertComponent alertMessage={alertMessage} alert={alert} />

            {/* Loader */}
            <Loader loading={loading} />
            <div className='col-md-12 px-3 py-4 font-s16'>
                Confirmed Course List
            </div>
            <div className='col-md-12 px-3'>
                <div className='standard-accordion'>
                    <div className="accordion" id="programSchemeDetails">
                        {courseList.map((courseItem, index) => (
                            courseItem.semWise.length > 0 ? courseItem.semWise.map((semesterItem, semIndex) => (
                                <div className="accordion-item">
                                    <h2 className="accordion-header position-relative">
                                        <button
                                            className="accordion-button collapsed"
                                            type="button"
                                            data-bs-toggle="collapse"
                                            data-bs-target={`#collapseProgram${semIndex}`}
                                            aria-expanded={semIndex === 0}
                                            aria-controls={`collapseProgram${semIndex}`}
                                        >
                                            <span className="icon-bg icon-bg-lightblue">
                                                <Icons iconName="coursetype" className="icon-gradient icon-primary" />
                                            </span>
                                            <span>{semesterItem._id}</span>
                                        </button>
                                    </h2>
                                    <div id={`collapseProgram${semIndex}`}
                                        className={`accordion-collapse collapse ${semIndex === 0 ? 'show' : ''}`}
                                        data-bs-parent="#programSchemeDetails">
                                        <div className="accordion-body">
                                            <div className="row">
                                                <div className='col-md-12 mt-3 overflow-auto'>
                                                    <table className="table-header-primary">
                                                        <thead>
                                                            <tr>
                                                                <th rowSpan="2">Course Code</th>
                                                                <th rowSpan="2" className='text-center'>Course Title</th>
                                                                <th colSpan="4" className='text-center'>Hours / Week</th>
                                                                <th rowSpan="2" className='text-center'>Prerequisites </th>
                                                                <th colSpan="3" className='text-center'>Maximum Marks</th>
                                                                <th rowSpan="2" className='text-center'>Category</th>
                                                                <th rowSpan="2" className='text-center'>Course Outcome Status</th>
                                                                <th rowSpan="2" className='text-center'>Action</th>
                                                                {/* <th rowSpan="2" className='text-center'>Action</th> */}
                                                            </tr>
                                                            <tr>
                                                                <th className='text-center'>L</th>
                                                                <th className='text-center'>T</th>
                                                                <th className='text-center'>P</th>
                                                                <th className='text-center'>C</th>
                                                                <th className='text-center'>CA</th>
                                                                <th className='text-center'>FE</th>
                                                                <th className='text-center'>Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {semesterItem.courses.map((course, courseIndex) => (
                                                                <tr key={`course-${course._id}`}>
                                                                    <td>
                                                                        <span className="tag-info">{course.code}</span>
                                                                    </td>
                                                                    <td>{course.title}</td>
                                                                    <td className="text-center">{course.hoursPerWeek.lecture}</td>
                                                                    <td className="text-center">{course.hoursPerWeek.tutorial}</td>
                                                                    <td className="text-center">{course.hoursPerWeek.practical}</td>
                                                                    <td className="text-center">{course.credits}</td>
                                                                    <td className="text-center">{course.prerequisites.length > 0 ? course.prerequisites.join(', ') : ''}</td>
                                                                    <td className="text-center">{course.markSplitUp.CA}</td>
                                                                    <td className="text-center">{course.markSplitUp.FE}</td>
                                                                    <td className="text-center">{course.markSplitUp.total}</td>
                                                                    <td className="text-center">{course.category}</td>
                                                                    <td className='text-center' >
                                                                        <span className={'status-badge status-badge-regulation ' + enumColors[course.mappingStatus]}>
                                                                            {mappingEnums?.status?.descriptions?.[course.mappingStatus]}
                                                                        </span>
                                                                    </td>
                                                                    <td className="action-dropdown">
                                                                        <div className="dropdown">
                                                                            <a className="btn " type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                                <Icons iconName="Frame" className="icon-20" />
                                                                            </a>
                                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                                {(courseList[0].assignFaculty == true) && < li > <a className="dropdown-item text-primary" onClick={() => handleAssignFaculty(course)}>Assign Faculty <Icons iconName="assign_regulation" className="me-2 icon-16 icon-primary ms-4" /></a></li>}
                                                                                <li><a className="dropdown-item text-success" onClick={() => { handleNextPageClick(); setCourseId(course._id) }}>Proceed <Icons iconName="send" className="me-2 icon-16 icon-success ms-4" /></a></li>
                                                                            </ul>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : <div className='col-sm-7 col-md-5 col-lg-4 col-xl-3 mx-auto mt-5'>
                                <div className='no-co-list-record'>
                                    <img src={create} alt="No record found" />
                                </div>
                                <div className="card-subtitle border-0">
                                    Courses not yet confirmed
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div >
            {
                modal.assignFaculty && (
                    <div>
                        <div className="modal modal-bg fade show" id="largeModal" tabIndex="-1" aria-labelledby="largeModal" aria-hidden="true" style={{ display: 'block' }}>
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title" id="largeModal">Assign Faculty</h5>
                                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => { handleModalClose() }}></button>
                                    </div>
                                    <form onSubmit={handleSubmit(assignFaculty)}>
                                        <div className="modal-body p-4 my-3">
                                            <AlertComponent alertMessage={alertAssignMessageModal} alert={alertAssignModal} />

                                            <div className='row add-mapping'>
                                                <div className='col-md-12'>
                                                    <Controller
                                                        name="faculty"
                                                        control={control}
                                                        rules={{ required: 'Assign faculty is required' }}
                                                        render={({ field: { ref, ...field } }) => (
                                                            <div>
                                                                <Selector
                                                                    {...field}
                                                                    placeholder="Select the regulation"
                                                                    options={facultyOptions}
                                                                    isMulti={true}
                                                                    isClearable={true}
                                                                    closeMenuOnSelect={false}
                                                                />
                                                                {errors.faculty && (
                                                                    <p className="text-danger">{errors.faculty.message}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    />
                                                </div>

                                            </div>
                                        </div>
                                        <div className='modal-footer col-xs-between'>
                                            <button className='btn btn-md btn-cancel me-3' onClick={() => { handleModalClose() }}>Cancel</button>
                                            <button className='btn btn-md btn-submit'>Save</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className="modal-backdrop fade show"></div>
                    </div>)
            }
        </>
    )
}

export default ConfirmedCourseList