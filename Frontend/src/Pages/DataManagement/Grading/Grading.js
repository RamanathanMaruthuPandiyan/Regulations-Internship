import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Pagination from "../../../Components/Pagination.js";
import Icons from '../../../Components/Icons';
import Search from '../../../Components/Search';
import AlertComponent from '../../../Components/AlertComponent';
import Loader from '../../../Components/Loader';
import { getData, postData, deleteData } from '../../../Services/ApiServices';
import { usePagination, useSorting } from '../../../Services/CommonServices';
import { useAlertMsg } from '../../../Services/AllServices';

const Grading = () => {

    //State
    const navigate = useNavigate();
    const location = useLocation()
    const { success } = location.state || {};
    const [getGrading, setGetGrading] = useState([]);
    const [attributeEnum, setAttributeEnum] = useState({ gradeType: "", courseType: "" });
    const [actionItem, setActionItem] = useState([]);
    const [actionItemData, setActionItemData] = useState([]);
    const [modal, setModal] = useState({ gradingDelete: false });
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [userName, setUserName] = useState("");
    //Loader
    const [loading, setLoading] = useState(false);
    const { tableSorting, sortingData } = useSorting();

    //Alert
    const { alert, alertMessage, callAlertMsg } = useAlertMsg();

    //Pagination
    const [paginationDataLimit, setPaginationDataLimit] = useState({ "skip": 0, "limit": 15 });
    const [response, setResponse] = useState({});

    const { paginationFunction,
        handleNextPage,
        handlePreviousPage,
        handleInputChange,
        totalPages,
        pagination,
        setPagination,
        selectedDataList,
        setSelectedDataList,
        currentPage,
        setCurrentPage } = usePagination(response, paginationDataLimit);

    let paginationQuery;
    const queryFunction = (search) => {
        if (search) {
            setCurrentPage(1);
            paginationQuery = { "skip": 0, "limit": (pagination.limit || 15) };
            setSelectedDataList(pagination.limit || 15);
            setPagination(paginationQuery);
            setPaginationDataLimit(paginationQuery);
        } else {
            paginationQuery = pagination.limit ? { "skip": pagination.skip, "limit": pagination.limit } : paginationDataLimit;
            setPaginationDataLimit(paginationQuery);
        }
    }

    const getTableData = async () => {
        const url = 'grades/pagination';
        setLoading(true);
        try {
            let query = {};
            queryFunction();
            const search = sessionStorage.getItem('search');

            if (search) {
                query.search = search;
            }

            if (Object.keys(sortingData).length) {
                query.sort = sortingData;
            }

            query = { ...query, ...paginationQuery }

            const result = await postData(url, query);
            let gradeType = await getData('attributes/enums/by/gradeType');
            let courseType = await getData('attributes/enums/by/type');

            setAttributeEnum({ gradeType, courseType });

            setResponse(result);

            setGetGrading(result.records); //Common
            setLoading(false);
        } catch (error) {
            callAlertMsg(error.response.data.message, 'error');
            setLoading(false);
        }

    };

    useEffect(() => {
        sessionStorage.removeItem('search');
    }, ['']);

    useEffect(() => {
        getTableData();
    }, [paginationFunction, sortingData]);

    //End Pagination Function


    // After Form submission alert will get call
    const alertFunction = () => {
        if (success) {
            callAlertMsg(success, 'success');
            navigate(location.pathname, { replace: true, state: undefined });
        }
    };


    //Navigation Function for add, edit and view
    const handleNavigation = (type, id) => {
        if (id) {
            navigate(`/grading/${type}/${id}`);
        } else {
            navigate(`/grading/${type}`);
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

    // Api call for show action Button
    const handleDropdownClick = async (id) => {
        setSelectedCardId(id);
        if (!id) {
            return;
        }
        setLoading(true);
        const url = `grades/action/items/${id}`;
        try {
            const result = await getData(url);
            setActionItem(result);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    //delete Modal Function
    const handleOpenModal = (id, name) => {
        setUserName(name);
        setSelectedCardId({ id });
        setModal({ ...modal, gradingDelete: true });
    };

    //Delete Function
    const handleDelete = async (id) => {
        setLoading(true);
        setSelectedCardId(id);
        const url = `grades/${selectedCardId}`;
        try {
            const result = await deleteData(url);
            id = null
            handleModalClose();
            setLoading(false);
            getTableData();
            callAlertMsg(result, 'success');
        } catch (error) {
            setLoading(false);
            handleModalClose();
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    const handleModalClose = () => {
        setModal({ ...modal, gradingDelete: false });
    }
    //call the Alert function
    useEffect(() => {
        alertFunction();
        getActionEnum();
    }, []);

    return (
        <div>

            {/* Alert Common */}
            <AlertComponent alertMessage={alertMessage} alert={alert} />

            {/* Loader */}
            <Loader loading={loading} />

            <div className="row">
                <div className="col">
                    <div className="row">
                        <div className="col-md base-title">
                            <div className='d-flex align-items-center'>
                                <span className="icon-bg icon-bg-gray">
                                    <Icons iconName="model" className="icon-gradient icon-white" />
                                </span>
                                <span className='font-s16'>Grading</span>
                            </div>
                        </div>

                    </div>
                    <div className="card-header-custom fixed-card">
                        <div className="card-body p-0">
                            <div className="table-header py-4">
                                <div className="px-4">

                                    {/* Header */}
                                    <div className="row mt-3 px-1">
                                        <div className="col-md-12 d-flex justify-content-between">
                                            <div className="col-md-3">
                                                <Search getData={getTableData} />
                                            </div>
                                            <div className="col-md-9 d-flex justify-content-end">
                                                <button className="btn btn-sm btn-primary" onClick={() => handleNavigation('add')}> <Icons iconName="add" className="me-2 icon-12 icon-white" /><span className='align-middle'>Add Grading</span></button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table */}

                                    <div className="row my-3 fixed-body">
                                        <div className="col-md-12">
                                            <table className="table-header-gray table-header-fixed">
                                                <thead className="cursor-pointer">
                                                    <tr>
                                                        <th className="sorting" onClick={(e) => tableSorting(e, 'name')}>GRADING NAME</th>
                                                        <th className="sorting" onClick={(e) => tableSorting(e, 'gradeType')}>GRADE TYPE</th>
                                                        <th className="sorting" onClick={(e) => tableSorting(e, 'courseType')}>COURSE TYPE</th>
                                                        <th className='text-center'>ACTION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getGrading.length > 0 ? (
                                                        getGrading.map((item, i) => (
                                                            <tr key={item._id}>
                                                                <td >{item.name}</td>
                                                                <td >{attributeEnum.gradeType.values[item.gradeType]}</td>
                                                                <td >{attributeEnum.courseType.values[item.courseType]}</td>
                                                                <td className="action-dropdown">
                                                                    <div className="dropdown" onClick={() => handleDropdownClick(item._id)}>
                                                                        <a className="btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                            <Icons iconName="Frame" className="icon-20" />
                                                                        </a>
                                                                        <ul className="dropdown-menu dropdown-menu-end">
                                                                            {(actionItem.includes(actionItemData?.action?.VIEW)) && (
                                                                                <li>
                                                                                    <a className="dropdown-item text-primary" onClick={() => handleNavigation('view', item._id)}>View <Icons iconName="vieweye" className="icon-15 icon-primary ms-4" />
                                                                                    </a>
                                                                                </li>
                                                                            )}
                                                                            {(actionItem.includes(actionItemData?.action?.EDIT)) && (
                                                                                <li>
                                                                                    <a className="dropdown-item text-primary" onClick={() => handleNavigation('edit', item._id)}>Edit <Icons iconName="edit" className="icon-15 icon-primary ms-4" />
                                                                                    </a>
                                                                                </li>
                                                                            )}
                                                                            {(actionItem.includes(actionItemData?.action?.DELETE)) && (
                                                                                <li>
                                                                                    <a className="dropdown-item text-danger" onClick={() => handleOpenModal(item._id, item.name)}>Delete  <Icons iconName="trashfilled" className="icon-15 icon-danger ms-4" />
                                                                                    </a>
                                                                                </li>
                                                                            )}
                                                                        </ul>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" className='text-center'>No Records Found</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Table Pagination */}

                        <Pagination
                            currentPage={currentPage}
                            paginationDataLimit={paginationDataLimit}
                            response={response}
                            selectedDataList={selectedDataList}
                            setSelectedDataList={setSelectedDataList}
                            handleInputChange={handleInputChange}
                            handlePreviousPage={handlePreviousPage}
                            handleNextPage={handleNextPage}
                            totalPages={totalPages}
                        />
                    </div>
                </div>
            </div>




            {/* Delete Modal */}
            {modal.gradingDelete && (
                <div>
                    <div className="modal fade show" id="failureModal" tabIndex="-1" aria-labelledby="failureModal" aria-hidden="true" style={{ display: 'block' }}>
                        <div className="modal-dialog modal-dialog-centered failure-modal">
                            <div className="modal-content">
                                <div className="modal-body text-center">
                                    <div className="failure-modal-title">
                                        <Icons iconName="delete" className="icon-40" />
                                    </div>
                                    <p className="failure-modal-msg mb-4">Are you sure you want to <br />
                                        delete Grading <strong>{userName}</strong></p>
                                    <div className="failure-modal-button">
                                        <button type="button" className="btn btn-purple me-3" onClick={() => setModal({ modal, gradingDelete: false })}>Cancel</button>
                                        <button type="button" className="btn btn-danger" onClick={() => handleDelete(selectedCardId)}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </div>)}
        </div>
    )
}

export default Grading