import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Pagination from "../../../Components/Pagination.js";
import Icons from '../../../Components/Icons';
import Search from '../../../Components/Search';
import AlertComponent from '../../../Components/AlertComponent';
import Loader from '../../../Components/Loader';
import { getData, postData, deleteData } from '../../../Services/ApiServices';
import { usePagination } from '../../../Services/CommonServices';
import { useAlertMsg } from '../../../Services/AllServices';

const CreditAssignment = () => {

    //State
    const navigate = useNavigate();
    const location = useLocation()
    const { success } = location.state || {};
    const [creditAssign, setCreditAssign] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [action, setAction] = useState(true);
    const [modal, setModal] = useState({ creditDelete: false });
    const [userName, setUserName] = useState("");

    //Loader
    const [loading, setLoading] = useState(false);

    // Pagination
    const [paginationDataLimit, setPaginationDataLimit] = useState({ "skip": 0, "limit": 16 });
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

    const { alert, alertMessage, callAlertMsg } = useAlertMsg();

    let paginationQuery;
    const queryFunction = (search) => {
        if (search) {
            setCurrentPage(1);
            paginationQuery = { "skip": 0, "limit": (pagination.limit || 16) };
            setSelectedDataList(pagination.limit || 16);
            setPagination(paginationQuery);
            setPaginationDataLimit(paginationQuery);
        } else {
            paginationQuery = pagination.limit ? { "skip": pagination.skip, "limit": pagination.limit } : paginationDataLimit;
            setPaginationDataLimit(paginationQuery);
        }
    }

    const getTableData = async () => {

        const url = 'credits/pagination';
        setLoading(true);
        try {
            let query = {};

            queryFunction();

            const search = sessionStorage.getItem('search');

            if (search) {
                query.search = search;
            }

            query = { ...query, ...paginationQuery }

            const result = await postData(url, query);

            setResponse(result); //Common

            setCreditAssign(result.records);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error')
        }
    };

    useEffect(() => {
        sessionStorage.removeItem('search');
    }, ['']);

    useEffect(() => {
        getTableData();
    }, [paginationFunction])


    // After Form submission alert will get call
    const alertFunction = () => {
        if (success) {
            callAlertMsg(success, 'success');
            navigate(location.pathname, { replace: true, state: undefined });
        }
    };

    //Navigation Function for add and edit
    const handleNavigation = (type, id) => {
        if (id) {
            if (action === false) {
                navigate(`/creditAssignment/${type}/${id}`);
            } else {
                window.scrollTo(0, 0);
                callAlertMsg("Credit pattern already used, cannot edit.", 'error');
            }
        } else {
            navigate(`/creditAssignment/${type}`);
        }
    };

    // Api call for show action Button
    const handleDropdownClick = async (cardId) => {
        setSelectedCardId(cardId);
        if (!cardId) {
            return;
        }
        setLoading(true);
        const url = `credits/check/usage/${cardId}`;
        try {
            const result = await getData(url);
            setAction(result.isUsed);
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
        setModal({ ...modal, creditDelete: true });
        window.scrollTo(0, 0);
    };


    //Delete Function
    const handleDelete = async () => {
        setLoading(true);
        if (action === false) {
            const url = `credits/${selectedCardId}`;
            try {
                const result = await deleteData(url);
                callAlertMsg(result, 'success');
                setSelectedCardId(null);
                setAction(true)
                getTableData();
                setModal({ ...modal, creditDelete: false });
                setLoading(false);
            } catch (error) {
                setLoading(false);
                callAlertMsg(error.response.data.message, 'error')
                setSelectedCardId(null)
            }
        }
        else {
            setModal({ ...modal, creditDelete: false });
            setLoading(false);
            callAlertMsg("Credit pattern already used, cannot delete.", 'error');
        }
    };

    //call the Alert function
    useEffect(() => {
        alertFunction();
    }, [alertMessage]);

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
                                <span className='font-s16'>Credit Assignment</span>
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
                                                <button className="btn btn-sm btn-primary" onClick={() => handleNavigation('add')}> <Icons iconName="add" className="me-2 icon-12 icon-white" />Add Credit Pattern<span></span></button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table */}

                                    <div className='row mt-4 pattern-card fixed-body'>
                                        {creditAssign.length > 0 ? (
                                            creditAssign.map((item, i) => (
                                                <div key={item._id} className='col-sm-6 col-lg-4 ' >
                                                    <div className="card">
                                                        <div className="card-body">
                                                            <div className='d-flex justify-content-between align-items-center'>
                                                                <div className='card-title mb-0'>{item.name}</div>
                                                                <div className="dropdown" onClick={() => handleDropdownClick(item._id)}>
                                                                    <a data-bs-toggle="dropdown" aria-expanded="false">
                                                                        <Icons iconName="Frame" className="icon-20" />
                                                                    </a>
                                                                    <ul className="dropdown-menu dropdown-menu-start">
                                                                        <>
                                                                            <li><a className="dropdown-item text-primary" onClick={() => handleNavigation('edit', item._id)}>Edit <Icons iconName="edit" className="icon-15 icon-primary ms-4" /></a></li>
                                                                            <li><a className="dropdown-item text-danger" onClick={() => handleOpenModal(item._id, item.name)}>Delete  <Icons iconName="trashfilled" className="icon-15 icon-danger ms-4" /></a></li>
                                                                        </>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                            <div className='mt-4'>
                                                                <table className='table pattern-card-table'>
                                                                    <tbody>
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
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                            )) : (
                                            <div className='text-center my-5'>No Records Found</div>
                                        )}

                                    </div>

                                    {modal.creditDelete && (
                                        <div>
                                            <div className="modal fade show" id="failureModal" tabIndex="-1" aria-labelledby="failureModal" aria-hidden="true" style={{ display: 'block' }}>
                                                <div className="modal-dialog modal-dialog-centered failure-modal">
                                                    <div className="modal-content">
                                                        <div className="modal-body text-center">
                                                            <div className="failure-modal-title">
                                                                <Icons iconName="delete" className="icon-40" />
                                                            </div>
                                                            <p className="failure-modal-msg mb-4">Are you sure you want to <br />
                                                                delete the credit <strong>{userName}</strong></p>
                                                            <div className="failure-modal-button">
                                                                <button type="button" className="btn btn-purple me-3" onClick={() => setModal({ modal, creditDelete: false })}>Cancel</button>
                                                                <button type="button" className="btn btn-danger" onClick={(event) => handleDelete(event)}>Delete</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="modal-backdrop fade show"></div>
                                        </div>)}
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
        </div >
    )
}

export default CreditAssignment