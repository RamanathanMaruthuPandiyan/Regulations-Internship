import React, { useState, useEffect } from 'react';
import MappingFilter from '../../Components/RegulationMappingFilter';
import Icons from '../../Components/Icons';
import { usePagination, useSorting } from '../../Services/CommonServices';
import { getData, postData } from './../../Services/ApiServices';
import Search from '../../Components/Search';
import Selector from '../../Components/Selector';
import { useForm, Controller } from 'react-hook-form';
import Alert from "../../Components/Alert.js";
import AlertComponent from '../../Components/AlertComponent.js';
import { useAlertMsg } from '../../Services/AllServices';
import Loader from '../../Components/Loader';
import Pagination from '../../Components/Pagination.js';

const RegulationMapping = () => {
    //States
    const [recordData, setRecordData] = useState([]);
    const [batchYear, setBatchYear] = useState([]);

    const [modal, setModal] = useState({ reassignRegulation: false, assignRegulation: false });

    const [programData, setProgramData] = useState([]);
    const [regulationYear, setRegulationYear] = useState([]);
    const [selectedId, setSelectedId] = useState(null);

    const [errorMessage, setErrorMessage] = useState("");

    const { control, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm({ defaultValues: { batchYear: "", regulation: "", academicTerm: "" } });

    //Alert
    const { alert, alertMessage, callAlertMsg } = useAlertMsg();
    const { alert: aleartAssignModal, alertMessage: alertAssignMessageModal, callAlertMsg: callAlertAssignMsgModal } = useAlertMsg();
    const { alert: aleartReassignModal, alertMessage: alertReassignMessageModal, callAlertMsg: callAlertReassignMsgModal } = useAlertMsg();

    const [isAlertArray, setIsAlertArray] = useState(false);

    const [isAcademicTermDisabled, setIsAcademicTermDisabled] = useState(true);
    const [isBatchDetailsDisabled, setIsBatchDetailsDisabled] = useState(true);
    const [isRegulationDisabled, setIsRegulationDisabled] = useState(true);

    const [batchYearOptions, setBatchYearOptions] = useState([]);
    const [regulationOptions, setRegulationOptions] = useState([]);

    const [academicTermOptions, setAcademicTermOptions] = useState([]);

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

    const { tableSorting, sortingData } = useSorting();

    const BatchYear = watch("batchYear");

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
        const url = 'regulation/batch/years/pagination';
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

    const handleOpenAssignModal = () => {
        callAlertMsg(false);
        fetchAcademicTerm();
        setModal({ assignRegulation: true });
    }

    const handleOpenReassignModal = (id) => {
        callAlertMsg(false);
        setSelectedId(id);
        setModal({ reassignRegulation: true });
    }

    const fetchAcademicTerm = async () => {
        setLoading(true);
        callAlertAssignMsgModal(false);
        const url = "regulation/batch/years/active/academic/terms";
        try {
            const result = await getData(url);
            setAcademicTermOptions(result);
            setIsAcademicTermDisabled(false);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertAssignMsgModal(error.response.data.message, 'error');
        }
    }

    const checkWheatherGroupExist = async (id) => {
        const url = `regulation/batch/years/check/group/exist/${id}`;
        try {
            setLoading(true);
            await getData(url);
            setLoading(false);
            handleOpenReassignModal(id);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    const fetchUnassignedPrgms = async (academicTerm) => {
        const academicId = academicTerm.value;
        setIsBatchDetailsDisabled(true);
        callAlertAssignMsgModal(false);
        const url = `regulation/batch/years/unassigned/prgms/${academicId}`;
        try {
            setLoading(true);
            const result = await getData(url);
            if (result && result.length) {
                setBatchYearOptions(result);
                setIsBatchDetailsDisabled(false);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertAssignMsgModal(error.response.data.message, 'error');
        }
    }

    const handleBatchYearChange = async (selectedBatchYear) => {
        try {
            setRegulationOptions([]);
            setIsRegulationDisabled(true);
            callAlertAssignMsgModal(false);
            if (selectedBatchYear && selectedBatchYear.length) {
                callAlertAssignMsgModal(false);
                let programmes = selectedBatchYear.map((batchYear) => ({ prgmId: batchYear.data.prgmId, semester: batchYear.data.semester }));
                const url = "regulation/batch/years/list/regulations";
                const result = await postData(url, { programmes });
                setRegulationOptions(result);
                setLoading(false);
                setIsRegulationDisabled(false);
            }
        } catch (error) {
            setLoading(false);
            callAlertAssignMsgModal(error.response.data.message, 'error');
        }
    }

    //Form submission
    const reassignRegulation = async (data) => {
        data.regulationId = data.regulation.value;
        data.id = selectedId;
        setLoading(true);
        try {
            const url = `regulation/batch/years/reassign`;
            const result = await postData(url, data);
            callAlertMsg(result, 'success');
            handleModalClose();
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertReassignMsgModal(error.response.data.message, 'error');
        }
    };

    const assignRegulation = async (data) => {
        setIsAlertArray(false);
        setErrorMessage("");
        setLoading(true);
        const url = "regulation/batch/years/assign";
        try {
            const constructData = {
                regulationId: data.regulation.value,
                batches: Array.from(new Set(data.batchYear.map((batchYear) => ({
                    batchIds: batchYear.data.batchIds,
                    semester: batchYear.data.semester,
                    prgmId: batchYear.data.prgmId,
                    batchYear: batchYear.data.batchYear
                }))))
            };
            const result = await postData(url, constructData);
            handleModalClose();
            callAlertMsg(result, 'success')
        } catch (error) {
            setLoading(false);
            window.scroll(0, 0);
            if (error.response.data.name == "multiErr") {
                setIsAlertArray(true);
                setErrorMessage(error.response.data.message);
            } else {
                callAlertAssignMsgModal(error.response.data.message, 'error');
            }
        }

    };

    const handleModalClose = () => {
        reset();
        setIsAlertArray(false);
        setSelectedId(null);
        setErrorMessage("");
        setRegulationOptions([]);
        setBatchYearOptions([]);
        setLoading(false);
        getTableData();
        callAlertAssignMsgModal(false);
        callAlertReassignMsgModal(false);
        setIsAcademicTermDisabled(true);
        setIsBatchDetailsDisabled(true);
        setIsRegulationDisabled(true);
        setModal({ assignRegulation: false, reasignRegulation: false });
    }

    //Filters BatchYear, RegulationYear, programee
    useEffect(() => {
        setLoading(true);
        const getBatchYear = async () => {
            let field = "Batch Year";
            const url = `regulation/batch/years/filter/${field}`;
            try {
                const result = await getData(url);
                setBatchYear(result);
                setLoading(false);
            } catch (error) {
                setLoading(false);
                callAlertMsg(error.response.data.message, 'error');
            }
        };

        const getProgramData = async () => {
            let field = "Programme";
            const url = `regulation/batch/years/filter/${field}`
            try {
                const result = await getData(url);
                setProgramData(result);
                setLoading(false);
            } catch (error) {
                setLoading(false);
                callAlertMsg(error.response.data.message, 'error');
            }
        };

        const getRegulationYear = async () => {
            let field = "Regulation Year";
            const url = `regulation/batch/years/filter/${field}`;
            try {
                const result = await getData(url);
                setRegulationYear(result);
                setLoading(false);
            } catch (error) {
                setLoading(false);
                callAlertMsg(error.response.data.message, 'error');
            }
        };
        getBatchYear();
        getProgramData();
        getRegulationYear();
    }, [recordData]);


    //Get Api for selector
    useEffect(() => {
        if (modal.reassignRegulation && selectedId !== null) {
            const fetchData = async () => {
                const url = `regulation/batch/years/${selectedId}`;
                setLoading(true);
                try {
                    const result = await getData(url);
                    const regulationNamesObj = result.map(type => ({
                        value: type._id,
                        label: `${type.year} - ${type.version} - ${type.title}`
                    }));
                    setRegulationOptions(regulationNamesObj);
                    setLoading(false);
                } catch (error) {
                    setLoading(false);
                    callAlertReassignMsgModal(error.response.data.message, 'error');
                }
            };
            fetchData();
        }
    }, [modal.regulationMapping, selectedId]);

    useEffect(() => {
        setValue("regulation", "");
    }, [BatchYear]);

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
                                    <Icons iconName="Regualtion_mapping_header" className="icon-gradient icon-white" />
                                </span>
                                <span className='font-s16'>Regulations Mapping</span>
                            </div>
                            <button className="btn btn-sm btn-primary" onClick={() => { handleOpenAssignModal() }}> <Icons iconName="assign_regulation" className="me-2 icon-16 icon-white" /><span className='align-middle'>Assign Regulation</span></button>
                        </div>
                    </div>

                    <div className="card card-shadow">
                        <div className="card-body p-0">
                            {/* Table Header */}
                            <div className="table-header table-accordion-header">
                                <div className="row">
                                    <div className='col-md-12 d-flex justify-content-sm-between col-xs-between'>
                                        <div className="col-md-2 d-flex align-items-center">
                                            <Search getData={getTableData} />
                                        </div>

                                        <div className="col-md-10 d-flex flex-row-reverse align-items-center">
                                            <MappingFilter getData={getTableData} batchYear={batchYear} programData={programData} regulationYear={regulationYear} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="table-body fixed-table">
                                <table className="table table-default">
                                    <thead className="cursor-pointer">
                                        <tr>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'prgm.dept')}>DEPARTMENT</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'prgm.name')}>PROGRAMME</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'batchYear')}>BATCH</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'semester')}>SEMESTER</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'sectionName')}>SECTION NAME</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'regulation.year')}>REGULATION</th>
                                            <th className="text-center">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recordData.length > 0 ? (
                                            recordData.map((item, i) => (
                                                <tr key={i}>
                                                    <td >{item.dept.name}</td>
                                                    <td >{item.prgm.name}</td>
                                                    <td>{item.batchYear} </td>
                                                    <td>{item.semester} </td>
                                                    <td>{item.sectionName} </td>
                                                    <td >{item.regulation.year} - {item.regulation.version} - {item.regulation.title} </td>

                                                    <td className="action-dropdown">
                                                        <div className="dropdown">
                                                            <a className="btn " type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                <Icons iconName="Frame" className="icon-20" />
                                                            </a>
                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                <li><a className="dropdown-item text-orange" onClick={() => { checkWheatherGroupExist(item._id) }}>Reassign Regulation <Icons iconName="reassignregulations" className="icon-20 icon-orange ms-3" /></a></li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className='text-center'>No Records Found</td>
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

            {modal.assignRegulation && (
                <div className="modal modal-bg fade show" style={{ display: 'block' }} id="addModal" data-bs-backdrop="static" data-bs-keyboard="false"
                    tabIndex="-1" aria-labelledby="addModal" aria-hidden="true">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <div className="me-2 icon-bg">
                                    <Icons iconName="edit_bg" className="icon-20 icon-gray" />
                                </div>
                                <h5 className="modal-title" id="addModal">Assign Regulation</h5>
                                <button type="button" className="btn-close" onClick={() => { handleModalClose() }}></button>
                            </div>
                            <form onSubmit={handleSubmit(assignRegulation)}>
                                <div className="modal-body px-4">
                                    <AlertComponent alertMessage={alertAssignMessageModal} alert={aleartAssignModal} />
                                    {isAlertArray &&
                                        <Alert alertShow={true}
                                            alertClose={true}
                                            style="danger"
                                            title="Error"
                                            message={errorMessage} />
                                    }

                                    <div className='row px-4'>
                                        <div className='col-12'>
                                            <div className="modal-label">
                                                <div className='label-title'>
                                                    <span className='text-nowrap'>Academic term</span>
                                                </div>
                                                <Controller
                                                    name="academicTerm"
                                                    control={control}
                                                    rules={{ required: "Academic term is required" }}
                                                    render={({ field: { ref, ...field } }) => <Selector
                                                        className="select"
                                                        placeholder="Select the academic term"
                                                        closeMenuOnSelect={true}
                                                        options={academicTermOptions}
                                                        isMulti={false}
                                                        isClearable={false}
                                                        value={field.value}
                                                        disabled={isAcademicTermDisabled}
                                                        onChange={(value) => {
                                                            field.onChange(value);
                                                            fetchUnassignedPrgms(value);
                                                            setValue("batchYear", "");
                                                            setIsRegulationDisabled(true);
                                                        }}
                                                    />
                                                    }
                                                />
                                                {errors.batchYear && (
                                                    <p className="text-danger">{errors.academicTerm.message}</p>
                                                )}
                                            </div>
                                            <div className="modal-label">
                                                <div className='label-title'>
                                                    <span className='text-nowrap me-2'>Batch Details</span><span data-toggle="tooltip" title='Programme schemes freezed semester only be listed below.'><Icons iconName="info" className="icon-20 icon-gray" /></span>
                                                </div>
                                                <Controller
                                                    name="batchYear"
                                                    control={control}
                                                    rules={{ required: "Batch details is required" }}
                                                    render={({ field: { ref, ...field } }) => <Selector
                                                        className="select"
                                                        placeholder="Select the batch detail"
                                                        closeMenuOnSelect={false}
                                                        options={batchYearOptions}
                                                        isMulti={true}
                                                        isClearable={false}
                                                        value={field.value}
                                                        disabled={isBatchDetailsDisabled}
                                                        onChange={(value) => {
                                                            field.onChange(value);
                                                        }}
                                                        onBlur={() => handleBatchYearChange(field.value)}
                                                    />
                                                    }
                                                />
                                                {errors.batchYear && (
                                                    <p className="text-danger">{errors.batchYear.message}</p>
                                                )}
                                            </div>

                                            <div className="col-md-12">
                                                <div className="modal-label">
                                                    <div className='label-title'>
                                                        <span className='text-nowrap'>Regulation</span>
                                                    </div>
                                                    <Controller
                                                        name="regulation"
                                                        control={control}
                                                        rules={{ required: "Regulation  is required" }}
                                                        render={({ field: { ref, ...field } }) => <Selector
                                                            className="select"
                                                            placeholder="Select the regulation"
                                                            closeMenuOnSelect={true}
                                                            options={regulationOptions}
                                                            isMulti={false}
                                                            isClearable={false}
                                                            value={field.value}
                                                            disabled={isRegulationDisabled}
                                                            onChange={(value) => {
                                                                field.onChange(value);
                                                            }}
                                                        />
                                                        }
                                                    />
                                                    {errors.regulation && (
                                                        <p className="text-danger">{errors.regulation.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-cancel px-5 px-xs-2 me-3" onClick={() => { handleModalClose() }}>Close</button>
                                    <button type="submit" className="btn btn-submit px-5 px-xs-2">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>)
            }

            {
                modal.reassignRegulation && (
                    <div>
                        <div className="modal modal-bg fade show" id="largeModal" tabIndex="-1" aria-labelledby="largeModal" aria-hidden="true" style={{ display: 'block' }}>
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title" id="largeModal">Reassign Regulation</h5>
                                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => { handleModalClose() }}></button>
                                    </div>
                                    <form onSubmit={handleSubmit(reassignRegulation)}>
                                        <div className="modal-body p-4 my-3">
                                            <AlertComponent alertMessage={alertReassignMessageModal} alert={aleartReassignModal} />

                                            <div className='row add-mapping'>
                                                <div className='col-md-12'>
                                                    <Controller
                                                        name="regulation"
                                                        control={control}
                                                        rules={{ required: 'Mapping is required' }}
                                                        render={({ field: { ref, ...field } }) => (
                                                            <div>
                                                                <Selector
                                                                    {...field}
                                                                    placeholder="Select the regulation"
                                                                    options={regulationOptions}
                                                                    isMulti={false}
                                                                    isClearable={false}
                                                                />
                                                                {errors.regulation && (
                                                                    <p className="text-danger">{errors.regulation.message}</p>
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

        </div >
    )
}

export default RegulationMapping