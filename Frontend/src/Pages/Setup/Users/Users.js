import React, { useState, useEffect } from "react";
import Icons from "../../../Components/Icons";
import { useForm, Controller } from "react-hook-form";
import { getData, postData, putData, deleteData } from "../../../Services/ApiServices";
import Selector from "../../../Components/Selector";
import { usePagination, useSorting } from "../../../Services/CommonServices";
import Loader from "../../../Components/Loader";
import AlertComponent from "../../../Components/AlertComponent";
import { useAlertMsg } from "../../../Services/AllServices";
import Search from '../../../Components/Search';
import Pagination from '../../../Components/Pagination.js';

const UserManagement = () => {
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

    const { tableSorting, sortingData } = useSorting();
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

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [result, setResult] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [schemeRole, setSchemeRole] = useState({ isSchemeRole: false, schemeRoles: ["SCHEME FACULTY", "SCHEME APPROVER I", "OBE APPROVER", "PO UPLOADER"] });

    const { setValue, handleSubmit, reset, control, formState: { errors }, watch } = useForm({ defaultValues: { user: "", roles: [], programmes: [], departments: [] } });

    const [selectedId, setSelectedId] = useState("");
    const [recordData, setRecordData] = useState([]);
    const [modal, setModal] = useState(false);

    const User = watch("user")
    const Roles = watch("roles");
    const Departments = watch("departments");
    const Programmes = watch("programmes");

    // Fetch users
    const getTableData = async () => {

        const url = "users/pagination";
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

            query = { ...query, ...paginationQuery };

            const result = await postData(url, {
                ...query,
            });
            setResponse(result);
            setRecordData(result.records);
            setLoading(false);
        }
        catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, "error");
        }
    };

    useEffect(() => {
        sessionStorage.removeItem('search');
    }, ['']);

    //Modal for add or edit user
    const handleModal = () => {
        reset();
        setSelectedId("");
        setModal((prev) => !prev);
    };

    //Add or edit user
    const onModalSubmit = async ({ user: userId, roles, departments: departmentIds, programmes: programmeIds }) => {
        setLoading(true);
        userId = userId.value;
        roles = roles.map((role) => role.value);
        departmentIds = departmentIds.map((department) => department.value);
        programmeIds = programmeIds.map((programme) => programme.value);
        const url = "users";
        if (selectedId) {
            try {
                const result = await putData(url, { userId, roles, departmentIds, programmeIds });
                if (result) {
                    handleModal();
                    callAlertMsg(result, "success");
                }
                getUsers();
                getTableData();
                reset();
                setLoading(false);
            } catch (error) {
                setLoading(false);
                handleModal();
                window.scrollTo(0, 0);
                callAlertMsg(error.response.data.message, "error");
            }
        } else {
            try {
                const result = await postData(url, { userId, roles, departmentIds, programmeIds });
                if (result) {
                    handleModal();
                    callAlertMsg(result, "success");
                }
                getUsers();
                getTableData();
                reset();
                setLoading(false);
            } catch (error) {
                setLoading(false);
                handleModal();
                window.scrollTo(0, 0);
                callAlertMsg(error.response.data.message, "error");
            }
        }
    };

    //Edit
    const handleEdit = async (data) => {
        setLoading(true);
        setSelectedId(data.userId);
        let userOptions = { "label": `${data.userId} - ${data.firstName}`, "value": data.userId };
        let roleOptions = roles.filter((role) => data.roles.includes(role.value));
        let departmentOptions = departments.filter((department) => data.departmentIds.includes(department.value));
        let programmeOptions = programmes.filter((programme) => data.programmeIds.includes(programme.value));
        setValue("user", userOptions);
        setValue("roles", roleOptions);
        setValue("departments", departmentOptions);
        setValue("programmes", programmeOptions);
        setModal(true);
    };

    //Delete
    const handleDelete = async (id) => {
        setLoading(true);
        const url = `users/${id}`;
        try {
            const result = await deleteData(url);
            callAlertMsg(result, 'success');
            setSelectedId("");
            getTableData();
            getUsers();
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    // Fetch user data
    const getUsers = async () => {
        const url = "users/filter";
        try {
            setLoading(true);
            const result = await getData(url);
            const users = result.map((user) => ({ "label": `${user.id} - ${user.name}`, "value": user.id }));
            setUsers(users);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    // Fetch user roles
    const getRoles = async () => {
        const url = "users/user/roles";
        try {
            setLoading(true);
            const result = await getData(url);
            const roles = result.map((role) => ({ "label": role, "value": role }));
            setRoles(roles);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    // Fetch departments
    const getDepartments = async () => {
        const url = "departments/distinct";
        try {
            setLoading(true);
            const result = await getData(url);
            const departments = result.map((department) => { return { "label": `${department.name}-${department.category}`, "value": department._id } });
            setDepartments(departments);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    // Fetch programmes by department
    const getProgrammes = async (departments = []) => {
        const url = "programme/regulations/distinct";
        try {
            setLoading(true);
            departments = departments.map((department) => department.value);
            const result = await postData(url, { departments });
            setResult(result);
            const programmes = result.map((programme) => { return { "label": `${programme.name}-${programme.category}-${programme.type}-${programme.mode}`, "value": programme._id } });
            setProgrammes(programmes);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    //useEffect for fetch options
    useEffect(() => {
        getUsers();
        getRoles();
        getDepartments();
        getProgrammes();
    }, []);

    //useEffect for fetch users
    useEffect(() => {
        getTableData();
    }, [paginationFunction, sortingData]);

    //useEffect for handle roles
    useEffect(() => {
        setSchemeRole((prev) => ({ ...prev, isSchemeRole: false }));
        if (Roles && Roles.length) {
            for (let role of Roles) {
                if (schemeRole.schemeRoles.includes(role.value)) {
                    setSchemeRole((prev) => ({ ...prev, isSchemeRole: true }));
                    break;
                }
            }
        }
        else {
            setValue("departments", []);
            setValue("programmes", []);
        }
    }, [Roles])

    //useEffect for handle programmes
    useEffect(() => {
        if (!loading) {

            if (Programmes?.length) {
                let selectedDepartments = Departments.map((obj) => obj.value);
                let selectedProgrammes = Programmes.map((obj) => obj.value);
                let filteredProgrammes = result.filter((obj) => selectedProgrammes.includes(obj._id) && selectedDepartments.includes(obj.dept)).map((obj) => obj._id);
                filteredProgrammes = Programmes.filter((prgm) => filteredProgrammes.includes(prgm.value));
                setValue("programmes", filteredProgrammes);
            }
        }
        if (Departments && Departments.length) {
            getProgrammes(Departments);
        }
        setLoading(false);
    }, [Departments]);


    return (
        <div>
            <AlertComponent alertMessage={alertMessage} alert={alert} />

            <Loader loading={loading} />

            <div className="row ">
                <div className="col">
                    <div className="row">
                        <div className="col-md base-title">
                            <div className='d-flex align-items-center'>
                                <span className="icon-bg icon-bg-primary">
                                    <Icons iconName="userprofile_jobs" className="icon-gradient icon-white" />
                                </span>
                                <span className='font-s16'>Manage Users</span>
                            </div>
                            <div className="col-md-8 text-end">
                                <button type="button" className="btn btn-sm btn-primary" onClick={handleModal} >
                                    <span >
                                        <Icons iconName="add" className="icon-12 icon-white" />
                                    </span>
                                    <span className="ms-2 align-middle">Add Roles</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="card card-shadow">
                        <div className="card-body p-0">
                            <div className="table-header table-accordion-header">
                                <div className="row">
                                    <div className='col-md-12 d-flex'>
                                        <div className="d-flex flex-row-reverse align-items-center">
                                            <Search getData={getTableData} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}

                            <div className="table-body fixed-table">
                                <table className="table table-default">
                                    <thead>
                                        <tr>
                                            <th className="text-nowrap sorting" onClick={(e) => tableSorting(e, 'userId')}>FACULTY ID</th>
                                            <th className="text-nowrap sorting" onClick={(e) => tableSorting(e, 'firstName')}>FACULTY NAME</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'roles')}>ROLES</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'departments.name')}>DEPARTMENTS</th>
                                            <th className="sorting" onClick={(e) => tableSorting(e, 'programmes.name')}>PROGRAMMES</th>
                                            <th className="text-center pe-5">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recordData.length > 0 ? (
                                            recordData.map((item, index) => (
                                                <tr key={index} >
                                                    <td>{item.userId}</td>
                                                    <td className="text-nowrap transform-text">{item.firstName.toLowerCase()}</td>
                                                    <td>{item.roles.map((role) => <span className="status-badge status-badge-lg status-badge-secondary m-1">{role}</span>)}</td>
                                                    <td>{item.departments.map(({ name }) => <span className="status-badge status-badge-lg status-badge-secondary m-1">{name}</span>)}</td>
                                                    <td>{item.programmes.map(({ name }) => <span className="status-badge status-badge-lg status-badge-secondary m-1">{name}</span>)}</td>
                                                    <td className="action-dropdown align-middle pe-5">
                                                        <div className="dropdown" >
                                                            <a className="btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                <Icons iconName="Frame" className="icon-20" />
                                                            </a>
                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                <li>
                                                                    <a className="dropdown-item text-primary" onClick={() => { handleEdit(item) }}>
                                                                        Manage Roles <Icons iconName="edit" className="icon-15 icon-primary ms-4" />
                                                                    </a>
                                                                </li>
                                                                <li>
                                                                    <a className="dropdown-item text-danger" data-bs-toggle="modal" data-bs-target="#failureModal" onClick={() => { setSelectedId(item.userId) }}>
                                                                        Remove All Roles<Icons iconName="trashfilled" className="icon-15 icon-danger ms-4" />
                                                                    </a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center"> No Records Found</td>
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

            {/* Delete Modal */}

            <div className="modal fade" id="failureModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="failureModal" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered failure-modal">
                    <div className="modal-content">
                        <div className="modal-body text-center">
                            <div className="failure-modal-title">
                                <Icons iconName="delete" className="icon-40" />
                            </div>
                            <p className="failure-modal-msg mb-4">Are you sure you want to <br />
                                delete <strong>{selectedId.title} </strong>?</p>
                            <div className="failure-modal-button">
                                <button type="button" className="btn btn-purple me-3" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal" onClick={() => handleDelete(selectedId)}>Delete</button>
                            </div>
                        </div>
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
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id="largeModal">{selectedId ? "Manage" : "Add"} Roles</h5>
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
                                            <div className="col-md-12 mx-auto mb-3">
                                                <label className="form-label">User</label>
                                                <Controller
                                                    name="user"
                                                    control={control}
                                                    rules={{ required: "User data is required" }}
                                                    render={({ field }) => (
                                                        <Selector
                                                            className="select"
                                                            options={users}
                                                            isClearable={false}
                                                            closeMenuOnSelect={true}
                                                            disabled={selectedId}
                                                            value={field.value}
                                                            onChange={(e) => field.onChange(e)}
                                                        />
                                                    )}
                                                />
                                                {errors.user && (
                                                    <p className="text-danger">{errors.user.message}</p>
                                                )}
                                            </div>
                                            <div className="col-md-12 mx-auto mb-3">
                                                <label className="form-label">Roles</label>
                                                <Controller
                                                    name="roles"
                                                    control={control}
                                                    rules={{ required: "Roles is required" }}
                                                    render={({ field }) => (
                                                        <Selector
                                                            className="select"
                                                            options={roles}
                                                            isMulti={true}
                                                            disabled={!Object.keys(User).length}
                                                            closeMenuOnSelect={false}
                                                            value={field.value}
                                                            onChange={(e) => { field.onChange(e) }}
                                                        />
                                                    )}
                                                />
                                                {errors.roles && (
                                                    <p className="text-danger">{errors.roles.message}</p>
                                                )}
                                            </div>
                                            {schemeRole.isSchemeRole && <> <div className="col-md-12 mx-auto mb-3">
                                                <label className="form-label">Departments</label>
                                                <Controller
                                                    name="departments"
                                                    control={control}
                                                    rules={{ required: "Department is required" }}
                                                    render={({ field }) => (
                                                        <Selector
                                                            className="select"
                                                            options={departments}
                                                            isMulti={true}
                                                            closeMenuOnSelect={false}
                                                            disabled={!Roles.length}
                                                            value={field.value}
                                                            onChange={(e) => field.onChange(e)}
                                                        />
                                                    )}
                                                />
                                                {errors.departments && (
                                                    <p className="text-danger">{errors.departments.message}</p>
                                                )}
                                            </div>
                                                <div className="col-md-12 mx-auto mb-3">
                                                    <label className="form-label">Programmes</label>
                                                    <Controller
                                                        name="programmes"
                                                        control={control}
                                                        rules={{ required: "Programme is required" }}
                                                        render={({ field }) => (
                                                            <Selector
                                                                className="select"
                                                                options={programmes}
                                                                isMulti={true}
                                                                closeMenuOnSelect={false}
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(e)}
                                                                disabled={!programmes.length}
                                                            />
                                                        )}
                                                    />
                                                    {errors.programmes && (
                                                        <p className="text-danger">{errors.programmes.message}</p>
                                                    )}
                                                </div>
                                            </>}

                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            className="btn btn-cancel"
                                            onClick={() => handleModal()}
                                        >
                                            Cancel
                                        </button>
                                        <button className="btn btn-submit ms-3">
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

export default UserManagement;
