import React, { useState, useEffect } from 'react';
import Icons from '../../../Components/Icons.js';
import BatchJobFilter from '../../../Components/BatchJobFilter.js';
import { usePagination, useSorting } from '../../../Services/CommonServices.js';
import { getData, postData } from '../../../Services/ApiServices.js';
import AlertComponent from '../../../Components/AlertComponent.js';
import { useAlertMsg } from '../../../Services/AllServices.js';
import Loader from '../../../Components/Loader.js';
import Search from '../../../Components/Search';
import Pagination from '../../../Components/Pagination.js';

const BatchJobs = () => {

    //States
    const [recordData, setRecordData] = useState([]);
    const [modal, setModal] = useState({ batchJobSummary: false });

    //Alert
    const { alert, alertMessage, callAlertMsg } = useAlertMsg();

    //Loader
    const [loading, setLoading] = useState(false);

    const [jobEnums, setJobEnums] = useState({});
    const [filterStatus, setFilterStatus] = useState([]);

    const [isSyncSummary, setIsSyncSummary] = useState(false);
    const [isMailSummary, setIsMailSummary] = useState(false);

    const [isReasonExist, setIsReasonExist] = useState(false);
    const [isFailed, setIsFailed] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [syncNameEnums, setSyncNameEnums] = useState([]);
    const [mailNameEnums, setMailNameEnums] = useState([]);

    //***** Common Function ******//
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

    const [filterName, setFilterName] = useState([]);

    const { tableSorting, sortingData } = useSorting();

    const [summary, setSummary] = useState({});

    let paginationQuery;

    const queryFunction = (isFilter) => {
        if (isFilter) {
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

    useEffect(() => {
        sessionStorage.removeItem('filter');
        sessionStorage.removeItem('search');
    }, ['']);

    //***** End Common Function ******//
    //Enum Colors For Pills
    const enumColors = {
        'NS': 'status-badge-secondary',
        'CO': 'status-badge-success',
        'ER': 'status-badge-danger',
        'IP': 'status-badge-warning',
    }

    //GET Table Data Function
    const getTableData = async (isFilter) => {
        const url = 'jobs/pagination';
        setLoading(true);
        try {
            let query = {};
            queryFunction(isFilter);
            const filters = JSON.parse(sessionStorage.getItem('filter'));
            const search = sessionStorage.getItem('search');

            if (filters) {
                query.filter = filters;
            }

            if (search) {
                query.search = search;
            }

            if (Object.keys(sortingData).length) {
                query.sort = sortingData;
            }

            query = { ...query, ...paginationQuery }

            const result = await postData(url, query);

            setResponse(result); //Common

            setRecordData(result.records);

            setLoading(false);
        }
        catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    useEffect(() => {
        getTableData();
    }, [paginationFunction, sortingData]);

    useEffect(() => {
        // Enum Regulations data for dropdown
        const getEnums = async () => {
            const url = 'enums/jobs';
            try {
                const enums = await getData(url);
                setJobEnums(enums);
            } catch (error) {
                callAlertMsg(error.response.data.message, 'error');
            }
        };

        getEnums();
    }, []);

    useEffect(() => {
        if (jobEnums && Object.keys(jobEnums).length) {
            setSyncNameEnums([jobEnums.names.Sync_Programmes, jobEnums.names.Sync_BatchYears, jobEnums.names.Sync_Departments]);
            setMailNameEnums([jobEnums.names.Regulation_ChangeStatus, jobEnums.names.Course_ChangeStatus, jobEnums.names.CO_PO_Mapping_ChangeStatus, jobEnums.names.PO_ChangeStatus,
            jobEnums.names.Programme_Regulation_ChangeStatus]);
        }
    }, [jobEnums]);

    //End Pagination Function

    //Filters YEAR
    useEffect(() => {
        //Distinct Year
        const getFilterName = async () => {
            const url = 'jobs/distinct/name';
            try {
                const result = await getData(url);
                setFilterName(result);
            } catch (error) {
                callAlertMsg(error.response.data.message, 'error');
            }
        };

        //Distinct status
        const getFilterStatus = async () => {
            const url = 'jobs/distinct/status';
            try {
                const result = await getData(url);
                setFilterStatus(result);
            } catch (error) {
                callAlertMsg(error.response.data.message, 'error');
            }
        };

        getFilterName();
        getFilterStatus();
    }, [recordData]);

    //Sync api call for programmes,departments and batch years
    const sync = async (field) => {
        setLoading(true);
        const url = `sync/${field}`;
        try {
            const result = await getData(url);
            setLoading(false);
            callAlertMsg(result, 'success');
        } catch (error) {
            setLoading(false);
        } finally {
            getTableData();
        }
    };

    const getSummary = async (id) => {
        setLoading(true);
        const url = `jobs/${id}`;
        try {
            const result = await getData(url);
            const data = {};
            if (result && Object.keys(result).length) {
                data.name = jobEnums.names.descriptions[result.name];
                data.status = jobEnums.status.descriptions[result.status];
                data.created = result.created;
                data.started = result.started || '-';
                data.finished = result.finished || '-';
                data.recordCount = result.recordCount;

                if (result.status === jobEnums.status.Errored) {
                    setIsReasonExist(true);
                    data.reason = result.reason;
                } else {
                    if (syncNameEnums.includes(result.name)) {
                        setIsSyncSummary(true);
                        data.inserted = result.summary.inserted;
                        data.matched = result.summary.matched;
                        data.modified = result.summary.modified;
                        data.removed = result.summary.removed;
                    }
                    if (mailNameEnums.includes(result.name)) {
                        setIsMailSummary(true);
                        data.failed = [];
                        data.success = [];
                        const isFailed = (result.summary && result.summary.failed && result.summary.failed.length) ? true : false;
                        const isSuccess = (result.summary && result.summary.success && result.summary.success.length) ? true : false;
                        if (isFailed) {
                            setIsFailed(isFailed);
                            data.failed = result.summary.failed;
                        }
                        if (isSuccess) {
                            setIsSuccess(isSuccess);
                            data.success = result.summary.success;
                        }
                    }
                }
            }
            setSummary(data);
            setLoading(false);
            setModal({ ...modal, batchJobSummary: true });
        } catch (error) {
            setModal({ ...modal, batchJobSummary: false });
            setLoading(false);
        }
    }

    const handleCloseModal = () => {
        setIsSyncSummary(false);
        setIsMailSummary(false);
        setIsFailed(false);
        setIsReasonExist(false);
        setSummary({});
        setModal({ ...modal, batchJobSummary: false });
    }

    return (
        <div>

            {/* Alert Common */}
            <AlertComponent alertMessage={alertMessage} alert={alert} />

            {/* Loader */}
            <Loader loading={loading} />

            <div className="row regulation-mapping">
                <div className="col">
                    <div className="row">
                        <div className="col-md base-title">
                            <div className='d-flex align-items-center'>
                                <span className="icon-bg icon-bg-primary">
                                    <Icons iconName="jobs_header" className="icon-gradient icon-white" />
                                </span>
                                <span className='font-s16'>Jobs</span>
                            </div>
                            <div className="dropdown cursor-pointer me-1">
                                <button className="btn btn-sm btn-primary" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <span className='align-middle me-2'>Actions</span>
                                    <span className='sub-export'>
                                        <Icons iconName="arrow-down" className="icon-16 icon-white" />
                                    </span>
                                </button>
                                <ul className="dropdown-menu">

                                    <li><a className="dropdown-item">
                                        <Icons iconName="sync" className="me-2 icon-15 icon-blue" />
                                        <span className='align-middle font-s15' onClick={() => sync("programmes")}>Sync Programmes</span></a>
                                    </li>

                                    <li><a className="dropdown-item">
                                        <Icons iconName="sync" className="me-2 icon-15 icon-blue" />
                                        <span className='align-middle font-s15' onClick={() => sync("departments")}>Sync Departments</span></a>
                                    </li>
                                    <li><a className="dropdown-item">
                                        <Icons iconName="sync" className="me-2 icon-15 icon-blue" />
                                        <span className='align-middle font-s15' onClick={() => sync("batch/years")}>Sync Batch Years</span></a>
                                    </li>

                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="card card-shadow">
                        <div className="card-body p-0">
                            <div className="table-header table-accordion-header">
                                <div className="row">
                                    <div className='col-md-12 d-flex justify-content-sm-between col-xs-between'>
                                        <div className="col-md-2 d-flex align-items-center">
                                            <Search getData={getTableData} />
                                        </div>
                                        <div className="col-md-10 pe-4 d-flex flex-row-reverse align-items-center">
                                            <BatchJobFilter getTableData={getTableData} filterName={filterName} jobEnums={jobEnums} filterStatus={filterStatus} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Table Body */}
                            <div className="table-body fixed-table">
                                <table className="table table-default">
                                    <thead>
                                        <tr>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'name')}>NAME</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'created')}>CREATION TIME</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'started')}>START TIME</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'finished')}>COMPLETED TIME</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'completionPercentage')}>COMPLETION PERCENTAGE</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'status')}>STATUS</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'recordCount')}>RECORD COUNT</th>
                                            <th className="text-center">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(recordData && recordData.length && jobEnums && Object.keys(jobEnums).length) ? (
                                            recordData.map((job, i) => (
                                                <tr key={i}>
                                                    <td>{jobEnums.names.descriptions[job.name]}</td>
                                                    <td>{job.created}</td>
                                                    <td>{job.started || "-"} </td>
                                                    <td>{job.finished || "-"} </td>
                                                    <td>{job.completionPercentage} </td>
                                                    <td key={i}>
                                                        <span className={'status-badge status-badge-regulations ' + enumColors[job.status]}>
                                                            {jobEnums.status.descriptions[job.status]}
                                                        </span>
                                                    </td>
                                                    <td>{job.recordCount} </td>
                                                    <td className="action-dropdown">
                                                        <div className="dropdown">
                                                            <a className="btn " type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                <Icons iconName="Frame" className="icon-20" />
                                                            </a>
                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                <li>
                                                                    <a className="dropdown-item text-primary" onClick={() => getSummary(job._id)}>
                                                                        View Summary<Icons iconName="vieweye" className="icon-15 icon-primary ms-4" />
                                                                    </a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className='text-center'>No Records Found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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


            {
                modal.batchJobSummary && (
                    <div>
                        <div className="modal fade modal-type1 show" id="distributionModal" tabIndex="-1" aria-labelledby="distributionModalLabel" aria-hidden="true" style={{ display: 'block' }}>
                            <div className="modal-dialog modal-xl">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <div className='icon-bg icon-bg-white'><Icons iconName="briefcase" className="icon-20 icon-gray" /></div>
                                        <img className='modal-arrow-icon' src={""} />
                                        <h4 className='modal-title'>Job Summary</h4>
                                        <button type="button" className="btn-close" onClick={() => handleCloseModal()} />
                                    </div>
                                    <div className="modal-body">
                                        <div className='card-body'>
                                            <div className='row'>
                                                <div className='col-xs-12 col-sm-12 col-lg-6'>
                                                    <div className='row'>
                                                        <div className='col-xs-12 col-sm-12'>
                                                            <div className='scheme-details-list'>
                                                                <div className='list-title d-flex'>
                                                                    <span className='icon-bg icon-bg-lightblue'>
                                                                        <Icons iconName="Name_jobs" className="icon-19" />
                                                                    </span>
                                                                    <span className='d-flex align-items-center'>Name</span>
                                                                </div>
                                                                <div className='list-name'>
                                                                    <span>{summary.name}</span>
                                                                </div>
                                                            </div>
                                                            <div className='scheme-details-list'>
                                                                <div className='list-title d-flex'>
                                                                    <span className='icon-bg icon-bg-lightblue'>
                                                                        <Icons iconName="total_jobs" className="icon-19" /></span><span className='d-flex align-items-center'>Total </span>
                                                                </div>
                                                                <div className='list-name'>
                                                                    <span>{summary.recordCount}</span>
                                                                </div>
                                                            </div>
                                                            <div className='scheme-details-list'>
                                                                <div className='list-title d-flex'>
                                                                    <span className='icon-bg icon-bg-lightblue'>
                                                                        <Icons iconName="status_batch_job_model" className="icon-17" /></span><span className='d-flex align-items-center'>Status</span>
                                                                </div>
                                                                <div className='list-name'>
                                                                    <span>{summary.status}</span>
                                                                </div>
                                                            </div>
                                                            {isSyncSummary &&
                                                                <div>
                                                                    <div className='scheme-details-list'>
                                                                        <div className='list-title d-flex'>
                                                                            <span className='icon-bg icon-bg-lightblue'>
                                                                                <Icons iconName="inserted_job" className="icon-17" /></span><span className='d-flex align-items-center'>Inserted</span>
                                                                        </div>
                                                                        <div className='list-name'>
                                                                            <span>{summary.inserted}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className='scheme-details-list'>
                                                                        <div className='list-title d-flex'>
                                                                            <span className='icon-bg icon-bg-lightblue'>
                                                                                <Icons iconName="removed_jobs" className="icon-17" /></span><span className='d-flex align-items-center'>Removed</span>
                                                                        </div>
                                                                        <div className='list-name'>
                                                                            <span>{summary.removed}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='col-xs-12 col-sm-12 col-lg-6'>
                                                    <div className='row'>
                                                        <div className='col-xs-12 col-sm-12'>
                                                            <div className='scheme-details-list'>
                                                                <div className='list-title d-flex'>
                                                                    <span className='icon-bg icon-bg-lightblue'>
                                                                        <Icons iconName="programme_duration" className="icon-gradient icon-gray" /></span><span className='d-flex align-items-center'>Creation Time</span>
                                                                </div>
                                                                <div className='list-name'>
                                                                    <span>{summary.created}</span>
                                                                </div>
                                                            </div>
                                                            <div className='scheme-details-list'>
                                                                <div className='list-title d-flex'>
                                                                    <span className='icon-bg icon-bg-lightblue'>
                                                                        <Icons iconName="programme_duration" className="icon-gradient icon-gray" /></span><span className='d-flex align-items-center'>Start Time </span>
                                                                </div>
                                                                <div className='list-name'>
                                                                    <span>{summary.started}</span>
                                                                </div>
                                                            </div>
                                                            <div className='scheme-details-list'>
                                                                <div className='list-title d-flex'>
                                                                    <span className='icon-bg icon-bg-lightblue'>
                                                                        <Icons iconName="programme_duration" className="icon-gradient icon-gray" /></span><span className='d-flex align-items-center'>Completed Time</span>
                                                                </div>
                                                                <div className='list-name'>
                                                                    <span>{summary.finished}</span>
                                                                </div>
                                                            </div>
                                                            {isSyncSummary &&
                                                                <div>
                                                                    <div className='scheme-details-list'>
                                                                        <div className='list-title d-flex'>
                                                                            <span className='icon-bg icon-bg-lightblue'>
                                                                                <Icons iconName="matched_jobs" className="icon-17" /></span><span className='d-flex align-items-center'>Matched</span>
                                                                        </div>
                                                                        <div className='list-name'>
                                                                            <span>{summary.matched}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className='scheme-details-list'>
                                                                        <div className='list-title d-flex'>
                                                                            <span className='icon-bg icon-bg-lightblue'>
                                                                                <Icons iconName="modified_jobs" className="icon-17" /></span><span className='d-flex align-items-center'>Modified</span>
                                                                        </div>
                                                                        <div className='list-name'>
                                                                            <span>{summary.modified}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            }

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {isMailSummary &&
                                                <div className='row mt-4'>
                                                    <div className='col-xs-12 col-sm-12 col-lg-12'>
                                                        {isSuccess &&
                                                            <div className='scheme-details-list'>
                                                                <div className='d-flex w-25 align-items-center'>
                                                                    <span className='icon-bg icon-bg-lightblue'>
                                                                        <Icons iconName="success_job" className="icon-19" /></span><span style={{ fontFamily: "'inter-medium'" }}>Success</span>
                                                                </div>
                                                                <div className='ms-xs-5'>
                                                                    {summary.success && summary.success.length && summary.success.map((mail, index) => (
                                                                        <span key={index} className="status-badge status-badge-lg status-badge-success m-1">{mail}</span>
                                                                    ))}
                                                                </div>
                                                            </div>}
                                                    </div>
                                                    <div className='col-xs-12 col-sm-12 col-lg-12'>
                                                        {isFailed &&
                                                            <div className='scheme-details-list'>
                                                                <div className='d-flex w-25 align-items-center'>
                                                                    <span className='icon-bg icon-bg-lightblue'>
                                                                        <Icons iconName="failed_jobs" className="icon-19" /></span><span style={{ fontFamily: "'inter-medium'" }}>Failed</span>
                                                                </div>
                                                                <div className='ms-xs-5'>
                                                                    {summary.failed && summary.failed.length && summary.failed.map((mail, index) => (
                                                                        <span key={index} className="status-badge status-badge-lg status-badge-danger m-1">{mail}</span>
                                                                    ))}
                                                                </div>
                                                            </div>}
                                                    </div>
                                                </div>
                                            }
                                            {isReasonExist &&
                                                <div className='row'>
                                                    <div className='col-xs-12 col-sm-12 col-lg-6'>
                                                        <div className='row'>
                                                            <div className='col-xs-12 col-sm-12'>
                                                                <div className='scheme-details-list'>
                                                                    <div className='list-title d-flex'>
                                                                        <span className='icon-bg icon-bg-lightblue'>
                                                                            <Icons iconName="reason_jobs" className="icon-17" />
                                                                        </span>
                                                                        <span className='d-flex align-items-center'>Reason</span>
                                                                    </div>
                                                                    <div className='list-name'>
                                                                        <span className='text-danger'>{summary.reason}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            }
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

export default BatchJobs