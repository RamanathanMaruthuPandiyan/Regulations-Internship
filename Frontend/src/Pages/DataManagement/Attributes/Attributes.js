import React, { useState, useEffect } from "react";
import Icons from "../../../Components/Icons";
import { useForm, Controller } from "react-hook-form";
import { getData, postData } from "../../../Services/ApiServices";
import Selector from "../../../Components/Selector";
import { usePagination } from "../../../Services/CommonServices";
import Loader from "../../../Components/Loader";
import AlertComponent from "../../../Components/AlertComponent";
import { useAlertMsg } from "../../../Services/AllServices";
import noRecordFound from "../../../Assets/images/no-record.svg";
import InputText from "../../../Components/InputText";
import Pagination from "../../../Components/Pagination.js";

const Attributes = () => {
    //***** Common Function ******//
    const [paginationDataLimit, setPaginationDataLimit] = useState({
        skip: 0,
        limit: 15,
    });
    const [response, setResponse] = useState({});
    const {
        paginationFunction,
        handleNextPage,
        handlePreviousPage,
        handleInputChange,
        totalPages,
        pagination,
        setPagination,
        selectedDataList,
        setSelectedDataList,
        currentPage,
        setCurrentPage,
    } = usePagination(response, paginationDataLimit);

    //Loader
    const [loading, setLoading] = useState(false);
    //Alert
    const { alert, alertMessage, callAlertMsg } = useAlertMsg();

    let paginationQuery;
    const queryFunction = (isFilter) => {
        if (isFilter) {
            setCurrentPage(1);
            paginationQuery = { skip: 0, limit: pagination.limit || 15 };
            setSelectedDataList(pagination.limit || 15);
            setPagination(paginationQuery);
            setPaginationDataLimit(paginationQuery);
        } else {
            paginationQuery = pagination.limit
                ? { skip: pagination.skip, limit: pagination.limit }
                : paginationDataLimit;
            setPaginationDataLimit(paginationQuery);
        }
    };

    //***** End Common Function ******//

    const [attributesNames, setAttributesNames] = useState([]);
    const { setValue, handleSubmit, reset, control, formState: { errors }, } = useForm();
    const [refresh, setRefresh] = useState(1);

    const [selectedId, setSelectedId] = useState("");
    const [recordData, setRecordData] = useState([]);
    const [modal, setModal] = useState(false);
    const [addValue, setAddValue] = useState(false);

    //set attribute name
    const onSubmit = async ({ value }) => {
        setValue("displayName", value);
        setSelectedId(value);
        await getCardData(value);
    };

    //Add attribute value
    const onModalSubmit = async (data) => {
        try {
            setLoading(true);
            const url = "attributes";
            const result = await postData(url, data);
            setRefresh((prev) => prev + 1);
            if (result) {
                handleModal();
                callAlertMsg(result, "success");
            }
            reset();
            setLoading(false);
        } catch (error) {
            setLoading(false);
            handleModal();
            window.scrollTo(0, 0);
            callAlertMsg(error.response.data.message, "error");
        }
    };

    //Modal for add attribute value
    const handleModal = () => {
        reset();
        setValue("displayName", selectedId);
        setModal((prev) => !prev);
    };

    // Fetch attribute values
    const getCardData = async (selectedId) => {
        if (!selectedId) {
            return;
        }
        setSelectedId(selectedId);
        const url = "attributes/pagination";
        setLoading(true);
        try {
            let query = {};

            queryFunction();

            query = { ...query, ...paginationQuery };

            if (selectedId) {
                const result = await postData(url, {
                    filter: { displayName: selectedId },
                    ...query,
                });
                setResponse(result); // Common
                setRecordData(result.records);
                if (result.readOnly) {
                    setAddValue(false);
                } else {
                    setAddValue(true);
                }
                setLoading(false);
            } else {
                callAlertMsg("No attribute selected", "error");
            }
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, "error");
        }
    };

    // Fetch attribute names
    const getAttributesNames = async () => {
        const url = "attributes/distinct";
        try {
            setLoading(true);
            const result = await getData(url);
            const getAttributesNamesObj = result.map((name) => ({
                value: name,
                label: name,
            }));
            setAttributesNames(getAttributesNamesObj);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, "error");
        }
    };

    //useEffect for fetch attribute names
    useEffect(() => {
        getAttributesNames();
    }, []);

    //useEffect for fetch attribute values
    useEffect(() => {
        if (selectedId) {
            getCardData(selectedId);
        }
    }, [paginationFunction, refresh]);

    return (
        <div>
            <AlertComponent alertMessage={alertMessage} alert={alert} />

            <Loader loading={loading} />

            <div className="row">
                <div className="col">
                    <div className="row">
                        <div className="col-md base-title">
                            <div className='d-flex align-items-center'>
                                <span className="icon-bg icon-bg-gray">
                                    <Icons iconName="gradingtype" className="icon-gradient icon-white" />
                                </span>
                                <span className='font-s16'>Attributes</span>
                            </div>
                        </div>
                    </div>
                    <div className="card-header-custom fixed-card attributes">
                        <div className="card-body p-0">
                            <div className="table-header pb-4">
                                <div className="px-4">

                                    {/* Header */}
                                    <div className="row mt-3 pe-3">
                                        <div className="col-md-12 d-flex justify-content-between">
                                            <div className="col-md-3">
                                                <label className="form-label">Attribute Name</label>
                                                <Selector
                                                    className="select"
                                                    onChange={onSubmit}
                                                    options={attributesNames}
                                                />
                                            </div>
                                            {addValue && (
                                                <div className="col-md-9 d-flex justify-content-end mt-4">
                                                    <label className="d-block"> &nbsp; </label>
                                                    <button type="button" className="btn btn-sm btn-primary" onClick={handleModal} >
                                                        <span className="me-2">
                                                            <Icons iconName="add" className="icon-12 icon-white" />
                                                        </span>
                                                        <span className="align-middle">Add {selectedId}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Table */}

                                    <div className="row my-3 fixed-body">
                                        <div className="col-md-12">
                                            {selectedId ? (
                                                <table className="table-header-gray table-header-fixed">
                                                    <thead>
                                                        <tr>
                                                            <th>
                                                                NAME
                                                            </th>
                                                            <th>
                                                                SHORT NAME
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {recordData.length > 0 ? (
                                                            recordData.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td>{item.values.name}</td>
                                                                    <td>{item.values.shortName}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="2" className="text-center"> No Records Found</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="no-record-found-img">
                                                    <img src={noRecordFound} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Table Pagination */}
                        {selectedId && (
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
                        )}
                    </div>
                </div>
            </div>

            {modal && (
                <div>
                    <div
                        className="modal modal-bg fade show"
                        id="largeModal"
                        tabIndex="-1"
                        aria-labelledby="largeModal"
                        aria-hidden="true"
                        style={{ display: "block" }}
                    >
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id="largeModal">{selectedId}</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        data-bs-dismiss="modal"
                                        aria-label="Close"
                                        onClick={() => handleModal()}
                                    ></button>
                                </div>
                                <form onSubmit={handleSubmit(onModalSubmit)}>
                                    <div className="modal-body p-5">
                                        <div className="row add-mapping">
                                            <div className="col-md-12 mx-auto mb-4">
                                                <label className="form-label">Name</label>
                                                <Controller
                                                    name="name"
                                                    control={control}
                                                    rules={{
                                                        validate: value => value.trim() !== "" || "Name is required",
                                                        required: "Name is required",
                                                        pattern: {
                                                            value: selectedId === "Part Type" ? /^[a-zA-Z0-9 _&]+$/ : selectedId === "Letter Grade" ? /^[a-zA-Z _&+]+$/ : /^[a-zA-Z0-9  _&]+$/,
                                                            message: selectedId === "Part Type" ? "Name must contain only letters, numbers, spaces, underscores and ampersand" : selectedId === "Letter Grade"
                                                                ? "Name must contain only letters, spaces, underscores, ampersand, and plus sign"
                                                                : "Name must contain only letters, numbers, spaces, underscores and ampersand",
                                                        }
                                                    }}
                                                    render={({ field }) => (
                                                        <InputText
                                                            name="name"
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Name"
                                                            value={field.value}
                                                            onChange={(e) => { field.onChange(e.target.value.toUpperCase()) }}
                                                        />
                                                    )}
                                                />
                                                {errors?.name && (
                                                    <span className="text-danger">
                                                        {errors.name.message}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="col-md-12 mx-auto">
                                                <label className="form-label">Short Name</label>
                                                <Controller
                                                    name="shortName"
                                                    control={control}
                                                    rules={{
                                                        validate: value => value.trim() !== "" || "Short name is required",
                                                        required: "Short name is required",
                                                        pattern: {
                                                            value: selectedId === "Part Type" ? /^[a-zA-Z0-9 _&]+$/ : selectedId === "Letter Grade" ? /^[a-zA-Z _&+]+$/ : /^[a-zA-Z0-9  _&:]+$/,
                                                            message: selectedId === "Part Type" ? "Short name must contain only letters, numbers, spaces, underscores and ampersand" : selectedId === "Letter Grade"
                                                                ? "Short Name must contain only letters, spaces, underscores, ampersand, and plus sign"
                                                                : "Short Name must contain only letters, spaces, and underscores and ampersand",
                                                        }
                                                    }}
                                                    render={({ field }) => (
                                                        <InputText
                                                            name="shortName"
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Short Name"
                                                            value={field.value}
                                                            onChange={(e) => { field.onChange(e.target.value.toUpperCase()) }}
                                                        />
                                                    )}
                                                />
                                                {errors?.shortName && (
                                                    <span className="text-danger">
                                                        {errors.shortName.message}
                                                    </span>
                                                )}
                                            </div>

                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            className="btn btn-sm btn-cancel me-3"
                                            onClick={() => handleModal()}
                                        >
                                            Cancel
                                        </button>
                                        <button className="btn btn-sm btn-primary">
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </div>
            )}
        </div>
    );
};

export default Attributes;
