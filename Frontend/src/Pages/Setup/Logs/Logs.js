import React, { useState, useEffect } from 'react';
import Icons from '../../../Components/Icons.js';
import LogFilter from '../../../Components/LogFilter.js';
import { usePagination, useSorting } from '../../../Services/CommonServices.js';
import { getData, postData } from '../../../Services/ApiServices.js';
import AlertComponent from '../../../Components/AlertComponent.js';
import { useAlertMsg } from '../../../Services/AllServices.js';
import Loader from '../../../Components/Loader.js';
import Search from '../../../Components/Search.js';
import Pagination from '../../../Components/Pagination.js';

const BatchJobs = () => {

    //States
    const [recordData, setRecordData] = useState([]);

    //Alert
    const { alert, alertMessage, callAlertMsg } = useAlertMsg();

    //Loader
    const [loading, setLoading] = useState(false);

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

    const [filter, setFilter] = useState({ entity: [], status: [] });

    const { tableSorting, sortingData } = useSorting();

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

    //GET Table Data Function
    const getTableData = async (isFilter) => {
        const url = 'logs/pagination';
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

    //End Pagination Function

    // Filters YEAR
    useEffect(() => {
        //Distinct Entity
        const getFilterEntity = async () => {
            const url = 'logs/distinct/entity';
            try {
                const result = await getData(url);
                setFilter((prev) => ({ ...prev, entity: result }));
            } catch (error) {
                callAlertMsg(error.response.data.message, 'error');
            }
        };

        //Distinct action
        const getFilterAction = async () => {
            const url = 'logs/distinct/action';
            try {
                const result = await getData(url);
                setFilter((prev) => ({ ...prev, action: result }));
            } catch (error) {
                callAlertMsg(error.response.data.message, 'error');
            }
        };

        getFilterEntity();
        getFilterAction();
    }, [recordData]);

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
                                    <Icons iconName="logs" className="icon-gradient icon-white" />
                                </span>
                                <span className='font-s16'>Logs</span>
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
                                            <LogFilter getTableData={getTableData} entities={filter.entity} actions={filter.action} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Table Body */}
                            <div className="table-body fixed-table">
                                <table className="table table-default">
                                    <thead>
                                        <tr>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'entity')} width="250px">ENTITY</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'action')} width="250px">ACTION</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'on')} width="250px">ON</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'by')} width="250px">BY</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'message')} >MESSAGE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(recordData && recordData.length) ? (
                                            recordData.map((log, i) => (
                                                <tr key={i}>
                                                    <td>{log.entity || "-"}</td>
                                                    <td>{log.action || "-"}</td>
                                                    <td>{log.on || "-"} </td>
                                                    <td>{log.by || "-"} </td>
                                                    <td className='text-break'>{log.msg || "-"} </td>

                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className='text-center'>No Records Found</td>
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
        </div >
    )
}

export default BatchJobs