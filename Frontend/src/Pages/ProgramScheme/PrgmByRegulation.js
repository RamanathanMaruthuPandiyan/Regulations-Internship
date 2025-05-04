import React, { useState, useEffect } from 'react';
import Icons from '../../Components/Icons.js';
import PrgmByRegulationFilter from '../../Components/PrgmByRegulationFilter.js';
import { useForm, Controller } from 'react-hook-form';
import { getData, postData } from '../../Services/ApiServices.js';
import Selector from '../../Components/Selector.js';
import { useNavigate, useLocation } from "react-router-dom";
import { usePagination } from '../../Services/CommonServices.js';
import Loader from '../../Components/Loader.js';
import AlertComponent from '../../Components/AlertComponent.js';
import { useAlertMsg } from '../../Services/AllServices.js';
import Search from '../../Components/Search.js';
import noRecordFound from '../../Assets/images/no-record.svg'
import Pagination from '../../Components/Pagination.js';
import { useFilter } from '../../Services/CommonServices.js';

const ProgramScheme = () => {

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


    //Loader
    const [loading, setLoading] = useState(false);

    //Alert
    const { alert, alertMessage, callAlertMsg } = useAlertMsg();

    const filterItems = useFilter();

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

    const navigate = useNavigate();
    const location = useLocation();
    const [regulationsNames, setRegulationsNames] = useState([]);
    const { setValue, handleSubmit, control, getValues, formState: { errors } } = useForm();
    const [selectedId, setSelectedId] = useState();
    const [recordData, setRecordData] = useState([]);
    const [filterData, setFilterData] = useState();

    //Onsubmit
    const onSubmit = async (data) => {
        sessionStorage.removeItem('filter');
        filterItems.setFilter({});
        if (data.regulationName) {
            setFilterData();
            await getCardData(data);
        }
    };

    // Get Card Function
    const getCardData = async (isFilter) => {

        const dataValue = getValues().regulationName;
        if (!dataValue) {
            return
        }
        const url = 'programme/regulations/pagination';
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

            query = { ...query, ...paginationQuery }

            const selectedRegulation = getValues().regulationName;
            const selectedId = selectedRegulation?.value;
            setSelectedId(selectedId);

            if (selectedId) {
                const result = await postData(url, { regulationId: selectedId, ...query });
                setResponse(result); // Common
                setRecordData(result.records);
                setLoading(false);
            } else {
                callAlertMsg('No regulation selected', 'error');
            }

        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    // Department Invalid
    const renderDept = (dept) => {
        if (typeof dept === 'object' && !Array.isArray(dept) && dept !== null) {
            return JSON.stringify(dept);
        }
        return dept;
    };


    // DropDown Regulation year API
    const getRegulationNames = async () => {
        const url = 'regulations/approved';
        try {
            const result = await getData(url);

            const getRegulationsNamesObj = result.map(type => ({
                value: type._id,
                label: `${type.year} - ${type.version} - ${type.title}`
            }));

            setRegulationsNames(getRegulationsNamesObj);
        } catch (error) {
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    // Navigate Next Page
    const handleSchemeDetailsPage = async (regulationId, programId) => {
        navigate(`/schemeDetails/${regulationId}/${programId}`);
    }

    useEffect(() => {
        const regId = location.state?.regulationId;
        if (regulationsNames && regulationsNames.length && regId) {
            setValue("regulationName", regulationsNames.find(option => option.value === regId));
            getCardData();
        }
    }, [location.state, regulationsNames]);

    useEffect(() => {
        getRegulationNames();
        renderDept();
    }, []);

    useEffect(() => {
        if (selectedId) {
            getCardData();
        }
    }, [paginationFunction]);

    useEffect(() => {
        //Filter data for filters.
        const getFilterData = async () => {
            if (selectedId) {
                const url = `programme/regulations/filter/${selectedId}`;
                try {
                    const result = await getData(url);
                    setFilterData(result);
                } catch (error) {
                    callAlertMsg(error.response.data.message, 'error');
                }
            }
        };
        getFilterData();
    }, [recordData]);


    return (
        <div>
            <AlertComponent alertMessage={alertMessage} alert={alert} />
            {/* Loader */}
            <Loader loading={loading} />
            <div className="row">
                <div className="col">
                    <div className="row">
                        <div className="col-md base-title">
                            <div className='d-flex align-items-center'>
                                <span className="icon-bg icon-bg-primary">
                                    <Icons iconName="programme_schemes_header" className="icon-gradient icon-white" />
                                </span>
                                <span className='font-s16'>Programmes by Regulation</span>
                            </div>
                        </div>
                    </div>
                    <div className="card-header-custom">
                        <div className="card-body p-0">
                            <div className="table-header pb-4">
                                <div className="row table-accordion-header">
                                    <div className='col-md-12 d-flex justify-content-sm-between col-xs-between'>
                                        <div className="col-md-2 d-flex align-items-center">
                                            <button className="btn-get-data" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTable" aria-expanded="true" aria-controls="collapseTable" />
                                            <Search getData={getCardData} disabled={!selectedId} />
                                        </div>
                                        {recordData.length > 0 && (<div className="col-md-10 d-flex flex-row-reverse align-items-center">
                                            <PrgmByRegulationFilter useFilter={filterItems} getCardData={getCardData} filterData={filterData} />
                                        </div>)}
                                    </div>
                                </div>
                                <div id="collapseTable" className="accordion-collapse px-4 collapse show" >
                                    <form onSubmit={handleSubmit(onSubmit)}>

                                        <div className="row ps-3">
                                            <div className='d-flex'>
                                                <div className='col-md-6 col-sm-10 col-xl-6 col-xxl-6 me-2'>
                                                    <label className="form-label">Regulation</label>
                                                    <Controller
                                                        name="regulationName"
                                                        control={control}
                                                        rules={{ required: "Regulation name is required" }}
                                                        render={({ field }) => (
                                                            <Selector
                                                                className="select"
                                                                isMulti={false}
                                                                isClearable={false}
                                                                value={field.value}
                                                                onChange={(value) => field.onChange(value)}
                                                                options={regulationsNames}
                                                            />
                                                        )}
                                                    />
                                                    {errors.regulationName && <p className="text-danger">{errors.regulationName.message}</p>}
                                                </div>
                                                <div className="table-header-form mt-1">
                                                    <label className="d-block"> &nbsp; </label>
                                                    <button type="submit" className="btn btn-primary">Proceed</button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>

                                </div>
                            </div>
                            {/* Table Body */}
                            <div className="table-body table-body-program-scheme px-3 pt-4 pb-5">
                                {recordData.length > 0 ? (
                                    <div className="row px-3">
                                        {recordData.map((card, index) => (
                                            <div key={index} className="col-12 col-lg-6 col-xl-4 mb-4">
                                                <a onClick={() => handleSchemeDetailsPage(selectedId, card.prgmId)} className="text-decoration-none">
                                                    <div className='card card-header-blue'>
                                                        <div className='card-header'>
                                                            <span className='icon-bg icon-bg-white'>
                                                                <Icons iconName="programmenames" className="icon-17 icon-primary" />
                                                            </span> {card.name || 'N/A'}
                                                        </div>
                                                        <div className='card-body'>
                                                            <div className='card-label'>
                                                                <div className='d-flex'>
                                                                    <span className='icon-bg icon-bg-lightblue'>
                                                                        <Icons iconName="department_card" className="icon-gradient icon-gray" />
                                                                    </span>
                                                                    <span className='card-text-label'>Department </span>:
                                                                    <span className="ps-2">{renderDept(card.dept) || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <div className='card-label'>
                                                                <div className='d-flex'>
                                                                    <span className='icon-bg icon-bg-lightblue'>
                                                                        <Icons iconName="programme_type_card" className="icon-gradient icon-gray" />
                                                                    </span>
                                                                    <span className='card-text-label'>Programme Type </span>:
                                                                    <span className="ps-2">{card.type || 'N/A'} - {card.category || "N/A"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className='no-record-found-img'>
                                        <img src={noRecordFound} />
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Table Pagination */}
                        {recordData.length > 0 &&
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
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProgramScheme