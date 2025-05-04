import React, { useState, useEffect } from 'react';
import Icons from '../../../Components/Icons';
import Selector from '../../../Components/Selector';
import { getData, deleteData, putData, postData } from '../../../Services/ApiServices';
import '../../../Assets/css/components/dropzone.css';
import { useAppContext } from '../Context/Context';
import { useDropzone } from 'react-dropzone'
import { uploadS3, rejectedFileSize } from '../../../Services/AllServices';
import { useForm, Controller } from 'react-hook-form';

const SemesterTable = ({ access, courses, handleOpenAddCourseModal, getBasicInfo }) => {

    const { setLoading,
        callAlertMsg,
        enumCoursesStatus,
        actionItemData,
        coursesPagination,
        modal,
        modalToggle,
        offeringDeptOptions,
        programId,
        regulationId } = useAppContext();

    const [actionItem, setActionItem] = useState([]);
    const [bulkActionItem, setBulkActionItem] = useState([]);

    const [selectedId, setSelectedId] = useState({ id: null, code: [], action: "" });

    const [isBulkSelectVisible, setIsBulkSelectVisible] = useState(false);

    const [selectedCourseId, setSelectedCourseId] = useState();

    const { control, handleSubmit, reset, formState: { errors }, setValue } = useForm();

    const [isActionsVisible, setIsActionsVisible] = useState(true);

    const [totalCourses, setTotalCourses] = useState(null);

    const [showSelectedItem, setShowSelectedItem] = useState(false);

    // Table Single CheckBox Action
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    //Enum Colors For Pills
    const enumColors = {
        'DR': 'status-badge-secondary',
        'AP': 'status-badge-success',
        'RC': 'status-badge-danger',
        'WA': 'status-badge-warning',
        'CO': 'status-badge-confirm',
    }

    //Modal Close
    const handleCancel = () => {
        reset();
        setSelectAll(false);
        setSelectedId({ id: "", code: [], action: "" });
        setSelectedItems([]);
        modalToggle({ confirmModal: false });
        setIsActionsVisible(true);
        setIsBulkSelectVisible(false);
    };

    // Dynamic Dropdown Function
    const handleActionItem = async (id) => {
        try {
            setLoading(true);
            setSelectedCourseId(id);
            const actionItems = await getData(`courses/action/items/${id}`);
            setActionItem(actionItems);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    // Dynamic Dropdown Function
    const handleBulkActionItem = async () => {
        try {
            setBulkActionItem([]);
            const bulkActionItems = await postData(`courses/bulk/action/items/${programId}`, { selectedItems });
            if (bulkActionItems && bulkActionItems.length) {
                setBulkActionItem(bulkActionItems);
                setIsBulkSelectVisible(true);
            } else {
                setIsBulkSelectVisible(false);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            setBulkActionItem([]);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    const getCourseCodes = (courseIds) => {
        let courseCodeArray = [];
        if (courseIds && courseIds.length && courses && courses.length) {
            courseIds.forEach(courseId => {
                const matchedCourse = courses.find(course => course._id === courseId);
                if (matchedCourse) {
                    courseCodeArray.push(matchedCourse.code);
                }
            });
        }
        return courseCodeArray;
    }

    const onSubmitReason = (data) => {
        handleStateChange(enumCoursesStatus.REQUESTED_CHANGES, data.reason);
        reset();
    };

    const onSubmitOfferingDept = (data) => {
        handleOfferingDepartment(data.offeringDept);
        reset();
    };

    const constructItemObj = () => {
        const items = {};
        if (selectedItems && selectedItems.length) {
            items["selectedItems"] = selectedItems;
        }
        return { items };
    };

    const handleDelete = async (id) => {
        setLoading(true);
        const url = `courses/${id}`;
        try {
            let body = { prgmId: programId };
            let result = await deleteData(url, body);
            setLoading(false);
            handleCloseConfirmModal();
            callAlertMsg(result, 'success');
        } catch (error) {
            setLoading(false);
            handleCloseConfirmModal();
            callAlertMsg(error.response.data.message, 'error');
        }
        coursesPagination();
        getBasicInfo();
    };

    const handleOfferingDepartment = async (deptData) => {
        setLoading(true);
        const url = 'courses/offering/department'
        const data = {
            deptName: deptData.value.name,
            deptCategory: deptData.value.category,
            prgmId: programId
        }
        try {
            let { items } = constructItemObj();
            data["items"] = items;
            const result = await putData(url, data);
            setLoading(false);
            handleCloseConfirmModal();
            callAlertMsg(result, "success");
        } catch (error) {
            setLoading(false);
            handleCloseConfirmModal();
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    const handleGetOfferingDept = async (id, code, action) => {
        setLoading(true);
        const url = `courses/offering/dept/${id}`;
        try {
            const result = await getData(url);
            if (result && Object.keys(result).length) {
                setValue("offeringDept", offeringDeptOptions.find(option => option.value.name === result.offeringDeptName && option.value.category === result.offeringDeptCategory));
            }
            setSelectedId({ id: id, code: [code], action: action });
            setSelectedItems([id]);
            modalToggle({ confirmModal: true });
            setLoading(false);

        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    //Handle State Change
    const handleStateChange = async (destination, reason) => {
        setLoading(true);
        const url = "courses/status";
        try {
            let data = {
                "destination": destination,
                "regulationId": regulationId,
                "prgmId": programId,
            };
            let { items } = constructItemObj();
            data["items"] = items;
            if (destination === enumCoursesStatus.REQUESTED_CHANGES) {
                data.reason = reason;
            }
            const result = await putData(url, data);
            setLoading(false);
            handleCloseConfirmModal();
            callAlertMsg(result, 'success');
        } catch (error) {
            setLoading(false);
            handleCloseConfirmModal();
            callAlertMsg(error.response.data.message, 'error');
        }
        coursesPagination();
        getBasicInfo();
    };

    const handleOpenConfirmModal = (id, code, action) => {
        if (action === "Offering Department") {
            handleGetOfferingDept(id, code, action);
        } else {
            setSelectedId({ id: id, code: [code], action: action });
            setSelectedItems([id]);
            modalToggle({ confirmModal: true });
        }
    };

    const handleCloseConfirmModal = () => {
        setBulkActionItem([]);
        setSelectedId({ id: "", code: [], action: "" });
        setSelectedItems([]);
        modalToggle({ confirmModal: false });
        setSelectAll(false);
        setIsActionsVisible(true);
        setIsBulkSelectVisible(false);
    };

    const handleBulkSelect = (action) => {
        let codes = getCourseCodes(selectedItems);
        setSelectedId({ id: "", code: codes, action: action });
        modalToggle({ confirmModal: true });
    }

    const handleCheckboxChange = (e, id) => {
        if (e.target.checked) {
            setSelectedItems([...selectedItems, id]);
            setIsActionsVisible(false);
        } else {
            setSelectedItems(selectedItems.filter(item => item !== id));
        }
    };

    //Table Select All CheckBox Action
    const handleSelectAllChange = (e) => {
        if (e.target.checked) {
            setSelectAll(true);
            setIsActionsVisible(false);
            setSelectedItems(courses.map(course => course._id));
        } else {
            setIsActionsVisible(true);
            setIsBulkSelectVisible(false);
            setSelectAll(false);
            setSelectedItems([]);
        }
    };

    useEffect(() => {
        if (selectedItems && selectedItems.length == 0) {
            setIsBulkSelectVisible(false);
        }

        if (selectedItems && selectedItems.length) {
            handleBulkActionItem();
            setShowSelectedItem(true);
        } else {
            setIsActionsVisible(true);
            setShowSelectedItem(false);
        }

        if (selectedItems.length && selectedItems.length === courses.length) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedItems]);

    useEffect(() => {
        if (courses && courses.length) {
            setTotalCourses(courses.length);
        } else {
            setTotalCourses(null);
        }
    }, [courses])

    /* -------- DropZone --------*/
    const onDrop = async (acceptedFile, rejectedFile) => {
        try {
            setLoading(true);
            if (acceptedFile.length && selectedCourseId) {
                const file = acceptedFile[0];

                //file upload to aws s3 bucket
                let response = await uploadS3(file);

                let attachmentResult = await putData("courses/upload", { courseId: selectedCourseId, prgmId: programId, attachments: { url: response.filePath, orinalname: file.name, contentType: file.type } })
                setLoading(false)
                callAlertMsg(attachmentResult, "success");
            }

            if (rejectedFile.length) {
                const message = rejectedFile[0].errors.map((e) => e.code == "file-too-small" || e.code == "file-too-large" ? rejectedFileSize(e.message, e.code == "file-too-small") : e.message)
                setLoading(false)
                callAlertMsg(message.join("<br>"), "error")
            }
        } catch (error) {
            setLoading(false)
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf']
        },
        minSize: 0,
        noKeyboard: true,
        maxSize: 2097152,
    });

    const handleFileView = async () => {
        try {
            if (selectedCourseId) {
                setLoading(true);
                let download = await getData(`courses/attachments/${selectedCourseId}`);
                let response = await getData("s3/download/url", { params: { url: download.url } });
                setLoading(false)
                window.open(response.signedUrl);
            }
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    return (
        <div>

            <div className='row mx-1'>
                {showSelectedItem && <div className='col-md-12 d-flex justify-content-between align-items-center bulk-order-content' style={{ background: "#477DE912" }}>
                    <div>
                        Selected - {selectedItems.length} of {totalCourses}
                    </div>
                    {access && isBulkSelectVisible &&
                        <div className="bulk-action-dropdown">
                            <button className="btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <span>Bulk Actions</span>
                                <span>
                                    <Icons iconName="bulkaction_arrow_down" className="bulk-action-down-icon ms-2" />
                                </span>
                            </button>

                            <ul className="dropdown-menu dropdown-menu-order dropdown-menu-end">
                                {(bulkActionItem.includes(actionItemData?.action?.SEND_FOR_APPROVAL)) && (
                                    <li>
                                        <a className="dropdown-item text-success" onClick={() => handleBulkSelect("Send for Approval")}> Send For Approval <Icons iconName="send" className="icon-15 ms-4" />
                                        </a>
                                    </li>
                                )}
                                {(bulkActionItem.includes(actionItemData?.action?.APPROVE)) && (
                                    <li>
                                        <a className="dropdown-item text-success" onClick={() => handleBulkSelect("Mark Approved")}> Mark as Approved <Icons iconName="approved" className="icon-16 ms-3" />
                                        </a>
                                    </li>
                                )}
                                {(bulkActionItem.includes(actionItemData?.action?.CONFIRMED)) && (
                                    <li>
                                        <a className="dropdown-item text-confirm" onClick={() => handleBulkSelect("Confirm")}>Mark as Confirmed <Icons iconName="mark_as_confirm" className="icon-16 ms-3" />
                                        </a>
                                    </li>
                                )}
                                {(bulkActionItem.includes(actionItemData?.action?.REQUEST_CHANGES)) && (
                                    <li>
                                        <a className="dropdown-item text-info" onClick={() => handleBulkSelect("Request Changes")}> Mark as Requested Changes <Icons iconName="request_changes" className="icon-16 ms-4" />
                                        </a>
                                    </li>
                                )}
                                {(bulkActionItem.includes(actionItemData?.action?.OFFERING_DEPARTMENT)) && (
                                    <li>
                                        <a className="dropdown-item text-primary" onClick={() => handleBulkSelect("Offering Department")}> Update Offering Department <Icons iconName="update_department" className="icon-16 ms-4" />
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </div>
                    }
                </div>}
            </div>
            <div className="row">
                <div className='col-md-12 overflow-x-auto mt-3'>
                    <table className="table-header-primary">
                        <thead>
                            <tr>
                                <th rowSpan="2" width="1%">
                                    <input
                                        className="form-check-input font-s14"
                                        type="checkbox" checked={selectAll} onChange={handleSelectAllChange} />
                                </th>
                                <th rowSpan="2">COURSE CODE</th>
                                <th rowSpan="2" className='text-center'>COURSE TITLE</th>
                                <th colSpan="4" className='text-center'>HOURS / WEEK</th>
                                <th rowSpan="2" className='text-center'>PREREQUISITES</th>
                                <th colSpan="3" className='text-center'>MAXIMUM MARKS</th>
                                <th rowSpan="2" className='text-center'>CATEGORY</th>
                                <th rowSpan="2" className='text-center'>STATUS</th>
                                {isActionsVisible && <th rowSpan="2" className='text-center'>ACTION</th>}
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
                            {courses.map((list, index) => (
                                <tr key={index}>
                                    <td>
                                        <input
                                            className="table-checkbox form-check-input"
                                            type="checkbox" name={`checkBox${index}`} id={`checkBox${index}`}
                                            checked={selectedItems.includes(list._id)}
                                            onChange={(e) => handleCheckboxChange(e, list._id)} />
                                    </td>
                                    <td><span className={list?.isPlaceholder ? "tag-placeholder" : "tag-info"}>{list.code}</span></td>
                                    <td>{list.title}</td>
                                    <td className='text-center'>{(list.hoursPerWeek && list.hoursPerWeek.lecture != null) ? list.hoursPerWeek.lecture : "-"}</td>
                                    <td className='text-center'>{(list.hoursPerWeek && list.hoursPerWeek.tutorial != null) ? list.hoursPerWeek.tutorial : "-"}</td>
                                    <td className='text-center'>{(list.hoursPerWeek && list.hoursPerWeek.practical != null) ? list.hoursPerWeek.practical : "-"}</td>
                                    <td className='text-center'>{list.credits != null ? list.credits : "-"}</td>
                                    <td className='text-center'>{(list.prerequisites && list.prerequisites.length) ? list?.prerequisites?.join(', ') : '-'}</td>
                                    <td className='text-center'>{(list.markSplitUp && list.markSplitUp.CA != null) ? list.markSplitUp.CA : "-"}</td>
                                    <td className='text-center'>{(list.markSplitUp && list.markSplitUp.FE != null) ? list.markSplitUp.FE : "-"}</td>
                                    <td className='text-center'>{(list.markSplitUp && list.markSplitUp.total != null) ? list.markSplitUp.total : "-"}</td>
                                    <td className='text-center transform-text'>{list?.category.toLowerCase()}</td>
                                    {enumCoursesStatus && enumCoursesStatus.descriptions &&
                                        Object.entries(enumCoursesStatus.descriptions).map(([keys, value]) => {
                                            if (list.status === keys) {
                                                return (
                                                    <td key={keys} className='text-center' >
                                                        <span className={'status-badge status-badge-regulation ' + enumColors[list.status]}>
                                                            {enumCoursesStatus.descriptions[list.status]}
                                                        </span>
                                                    </td>
                                                );
                                            }
                                            return null;
                                        })
                                    }
                                    {isActionsVisible && <td className="action-dropdown">
                                        <div className='dropdown-schemes' onClick={() => handleActionItem(list._id)}>
                                            <a className='rotate-90' type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-haspopup="true">
                                                <Icons iconName="Frame" className="icon-20" />
                                            </a>
                                            <ul className="dropdown-menu dropdown-menu-end">
                                                {(actionItem.includes(actionItemData?.action?.VIEW)) && (
                                                    <li>
                                                        <a className="dropdown-item text-primary" onClick={() => handleOpenAddCourseModal("view", list._id)}>View  <Icons iconName="vieweye" className="icon-16 icon-primary ms-4" />
                                                        </a>
                                                    </li>
                                                )}
                                                {(actionItem.includes(actionItemData?.action?.EDIT)) && (
                                                    <li>
                                                        <a className="dropdown-item text-primary" onClick={() => handleOpenAddCourseModal("edit", list._id)}> Edit <Icons iconName="edit" className="icon-16 icon-primary ms-4" />
                                                        </a>
                                                    </li>
                                                )}
                                                {(actionItem.includes(actionItemData?.action?.DELETE)) && (
                                                    <li>
                                                        <a className="dropdown-item text-danger" onClick={() => { handleOpenConfirmModal(list._id, list.code, "Delete") }}>Delete  <Icons iconName="trashfilled" className="icon-16 icon-danger ms-4" />
                                                        </a>
                                                    </li>
                                                )}
                                                {(actionItem.includes(actionItemData?.action?.SEND_FOR_APPROVAL)) && (
                                                    <li>
                                                        <a className="dropdown-item text-success" onClick={() => handleOpenConfirmModal(list._id, list.code, "Send for Approval")}> Send For Approval <Icons iconName="send" className="icon-16 icon-success ms-4" />
                                                        </a>
                                                    </li>
                                                )}
                                                {(actionItem.includes(actionItemData?.action?.APPROVE)) && (
                                                    <li>
                                                        <a className="dropdown-item text-success" onClick={() => handleOpenConfirmModal(list._id, list.code, "Mark Approved")}> Mark as Approved <Icons iconName="approved" className="icon-16 ms-3" />
                                                        </a>
                                                    </li>
                                                )}
                                                {(actionItem.includes(actionItemData?.action?.CONFIRMED)) && (
                                                    <li>
                                                        <a className="dropdown-item text-confirm" onClick={() => handleOpenConfirmModal(list._id, list.code, "Confirm")}>Mark as Confirmed <Icons iconName="mark_as_confirm" className="icon-16 ms-3" />
                                                        </a>
                                                    </li>
                                                )}
                                                {(actionItem.includes(actionItemData?.action?.REQUEST_CHANGES)) && (
                                                    <li>
                                                        <a className="dropdown-item text-info" onClick={() => handleOpenConfirmModal(list._id, list.code, "Request Changes")}> Mark as Requested Changes   <Icons iconName="request_changes" className="icon-16 ms-4" />
                                                        </a>
                                                    </li>
                                                )}
                                                {
                                                    (actionItem.includes(actionItemData?.action?.VIEW_SYLLABUS)) &&
                                                    <li>
                                                        <a className="dropdown-item text-primary" onClick={() => handleFileView()}>
                                                            View Syllabus <Icons iconName="vieweye" className="icon-16 icon-primary ms-4" />
                                                        </a>
                                                    </li>
                                                }
                                                {(actionItem.includes(actionItemData?.action?.OFFERING_DEPARTMENT)) && (
                                                    <li>
                                                        <a className="dropdown-item text-primary" onClick={() => handleOpenConfirmModal(list._id, list.code, "Offering Department")}> Update Offering Department  <Icons iconName="update_department" className="icon-16 ms-4" />
                                                        </a>
                                                    </li>
                                                )}
                                                {(actionItem.includes(actionItemData?.action?.UPLOAD_SYLLABUS)) &&
                                                    <li {...getRootProps()}>
                                                        <a className="dropdown-item text-primary">
                                                            Upload Syllabus (Max size: 2 MB)    <Icons iconName="Select_file" className="icon-16 icon-primary ms-4" /></a>
                                                        <input {...getInputProps()}></input>
                                                    </li>
                                                }
                                            </ul>
                                        </div>
                                    </td>}
                                </tr>
                            ))
                            }

                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirm Modal */}
            {
                modal.confirmModal && (
                    <div>
                        <div className="modal fade show" id="confirmModal" tabIndex="-1" aria-labelledby="confirmModal" aria-hidden="true" style={{ display: 'block' }}>
                            <div className="modal-dialog modal-dialog-centered confirm-msg-modal">
                                <div className="modal-content">
                                    <div className="modal-body">
                                        <div className="confirm-modal-title">
                                            <Icons iconName="are_you_sure" className="mt-2 icon-60" />
                                            <span> Are you sure?</span>
                                        </div>
                                        {selectedId.action === "Delete" && (
                                            <p className="confirm-modal-sec text-center">
                                                Do you want to delete the course code <strong>
                                                    {selectedId.code.map((code, index) => (<span key={index}>{code}{index < selectedId.code.length - 1 ? ', ' : ''} </span>))}
                                                </strong> ?
                                            </p>
                                        )}
                                        {selectedId.action === "Send for Approval" && (
                                            <p className="confirm-modal-sec text-center">
                                                Do you want to send the course code(s) <strong>
                                                    {selectedId.code.map((code, index) => (<span key={index}>{code}{index < selectedId.code.length - 1 ? ', ' : ''} </span>))}
                                                </strong> for approval?
                                            </p>
                                        )}
                                        {selectedId.action === "Mark Approved" && (
                                            <p className="confirm-modal-sec text-center">
                                                Do you want to approve the course code(s) <strong>
                                                    {selectedId.code.map((code, index) => (<span key={index}>{code}{index < selectedId.code.length - 1 ? ', ' : ''} </span>))}
                                                </strong> ?
                                            </p>
                                        )}
                                        {selectedId.action === "Request Changes" && (
                                            <p className="confirm-modal-sec text-center">
                                                Do you want to mark the course code(s) <strong>
                                                    {selectedId.code.map((code, index) => (<span key={index}>{code}{index < selectedId.code.length - 1 ? ', ' : ''} </span>))}
                                                </strong> as request changes ?
                                            </p>
                                        )}
                                        {selectedId.action === "Confirm" && (
                                            <p className="confirm-modal-sec text-center">
                                                Do you want to mark the course code(s) <strong>
                                                    {selectedId.code.map((code, index) => (<span key={index}>{code}{index < selectedId.code.length - 1 ? ', ' : ''} </span>))}
                                                </strong> as confirmed ?
                                            </p>
                                        )}
                                        {selectedId.action === "Request Changes" && (
                                            <div className='mt-3'>
                                                <form onSubmit={handleSubmit(onSubmitReason)}>
                                                    <Controller
                                                        name="reason"
                                                        control={control}
                                                        rules={{ required: "Reason is required" }}
                                                        render={({ field }) =>
                                                            <textarea className="form-control"
                                                                placeholder="Reason"
                                                                {...field}
                                                                value={field.value}
                                                            >
                                                            </textarea>}
                                                    />
                                                    {errors.reason && <p className="text-danger">{errors.reason.message}</p>}
                                                    <div className="confirm-modal-button mt-4 mb-0">
                                                        <button type="button" className="btn btn-cancel me-3" onClick={handleCancel}>Cancel</button>
                                                        <button type="submit" className="btn btn-warning">
                                                            Yes, Confirm
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                        {selectedId.action === "Offering Department" && (
                                            <p className="confirm-modal-sec text-center">
                                                Do you want to update offering department for the course code(s) <strong>
                                                    {selectedId.code.map((code, index) => (<span key={index}>{code}{index < selectedId.code.length - 1 ? ', ' : ''} </span>))}
                                                </strong>?
                                            </p>
                                        )}
                                        {selectedId.action === "Offering Department" && (
                                            <div className='mt-3'>
                                                <form onSubmit={handleSubmit(onSubmitOfferingDept)}>
                                                    <Controller
                                                        name="offeringDept"
                                                        control={control}
                                                        rules={{ required: "Offering department is required" }}
                                                        render={({ field: { ref, ...field } }) => <Selector
                                                            className="select"
                                                            placeholder="Select offering department"
                                                            options={offeringDeptOptions}
                                                            isMulti={false}
                                                            isClearable={false}
                                                            value={field.value}
                                                            onChange={(value) => {
                                                                field.onChange(value);
                                                            }}
                                                        />
                                                        }
                                                    />
                                                    {errors.offeringDept && (
                                                        <p className="text-danger">{errors.offeringDept.message}</p>
                                                    )}
                                                    <div className="confirm-modal-button mt-4 mb-0">
                                                        <button type="button" className="btn btn-cancel me-3" onClick={handleCancel}>Cancel</button>
                                                        <button type="submit" className="btn btn-warning">
                                                            Yes, Confirm
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                        <div className="confirm-modal-button">
                                            {selectedId.action !== "Request Changes" && selectedId.action !== "Offering Department" && (
                                                <button type="button" className="btn btn-cancel me-3" onClick={handleCloseConfirmModal}>Cancel</button>)}
                                            {selectedId.action === "Send for Approval" && (
                                                <button type="button" className="btn btn-warning" onClick={() => handleStateChange(enumCoursesStatus.WAITING_FOR_APPROVAL)}>
                                                    Yes, Confirm
                                                </button>)
                                            }
                                            {selectedId.action === "Mark Approved" && (
                                                <button type="button" className="btn btn-warning" onClick={() => handleStateChange(enumCoursesStatus.APPROVED)}>
                                                    Yes, Confirm
                                                </button>
                                            )}
                                            {selectedId.action === "Confirm" && (
                                                <button type="button" className="btn btn-warning" onClick={() => handleStateChange(enumCoursesStatus.CONFIRMED)}>
                                                    Yes, Confirm
                                                </button>
                                            )}
                                            {selectedId.action === "Delete" && (
                                                <button type="button" className="btn btn-warning" onClick={() => handleDelete(selectedId.id)}>
                                                    Yes, Confirm
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-backdrop fade show"></div>
                    </div>
                )
            }
        </div >
    )
}

export default SemesterTable;
