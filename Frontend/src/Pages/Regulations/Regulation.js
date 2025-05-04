import React, { useState, useEffect } from 'react';
import RegulationFilter from '../../Components/RegulationFilter';
import Icons from '../../Components/Icons';
import { usePagination, useSorting } from '../../Services/CommonServices';
import { getData, postData, putData, deleteData } from './../../Services/ApiServices';
import Search from '../../Components/Search';
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, Controller } from 'react-hook-form';
import Loader from '../../Components/Loader';
import AlertComponent from '../../Components/AlertComponent';
import { useAlertMsg } from '../../Services/AllServices';
import { useAppContext } from '../../Keycloak/InitiateKeycloak';
import Pagination from '../../Components/Pagination.js';

const Regulation = () => {
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

  //Loader
  const [loading, setLoading] = useState(false);

  //Alert
  const { alert, alertMessage, callAlertMsg } = useAlertMsg();

  const { keycloak } = useAppContext();


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

  useEffect(() => {
    getTableData();
  }, [paginationFunction, sortingData]);

  //***** End Common Function ******//

  // States
  const navigate = useNavigate();
  const [recordData, setRecordData] = useState([]);
  const location = useLocation()
  let { success } = location.state || {};
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const [selectedId, setSelectedId] = useState({ id: null, title: "", action: "" });
  const [actionItemData, setActionItemData] = useState([]);
  const [actionItem, setActionItem] = useState([]);
  const [filterYear, setFilterYear] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const [filterProgrammes, setFilterProgrammes] = useState([]);
  const [enumStatus, setEnumStatus] = useState({});

  //Modal
  const [modal, setModal] = useState({ confirmModal: false, deleteModal: false });

  //Modal Close
  const handleCancel = () => {
    reset();
    setModal({ ...modal, confirmModal: false });
  };

  //GET Table Data Function
  const getTableData = async (isFilter) => {
    const url = 'regulations/pagination';
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

    } catch (error) {
      setLoading(false);
      callAlertMsg(error.response.data.message, 'error');
    }

  };

  // Dynamic Dropdown API
  const getActionItems = async (id) => {
    try {
      const result = await getData(`regulations/action/items/${id}`);
      setActionItem(result);
    } catch (error) {
      callAlertMsg(error.response.data.message, 'error');
    }
  };

  useEffect(() => {

    // Enum Regulations data for dropdown
    const getEnumStatus = async () => {
      const url = 'enums/regulations';
      try {
        const enums = await getData(url);
        setEnumStatus(enums);
      } catch (error) {
        callAlertMsg(error.response.data.message, 'error');
      }
    };

    //Enum Action Item
    const getEnumActionItems = async () => {
      const url = `enums/actionItems`;
      try {
        const actionItemEnums = await getData(url);
        setActionItemData(actionItemEnums);
      } catch (error) {
        callAlertMsg(error.response.data.message, 'error');
      }
    };

    getEnumStatus();
    getEnumActionItems();

  }, []);

  //Data for filters
  useEffect(() => {
    //Distinct Year
    const getFilterYear = async () => {
      const url = 'regulations/distinct/year';
      try {
        const result = await getData(url);
        setFilterYear(result);
      } catch (error) {
        callAlertMsg(error.response.data.message, 'error');
      }
    };

    //Distinct status
    const getFilterStatus = async () => {
      const url = 'regulations/distinct/status';
      try {
        const result = await getData(url);
        setFilterStatus(result);
      } catch (error) {
        callAlertMsg(error.response.data.message, 'error');
      }
    };

    //Distinct Programmes
    const getFilterProgrammes = async () => {
      const url = 'regulations/role/programmes';
      try {
        const result = await getData(url);
        setFilterProgrammes(result);
      } catch (error) {
        callAlertMsg(error.response.data.message, 'error');
      }
    };

    getFilterYear();
    getFilterProgrammes();
    getFilterStatus();
  }, [recordData]);

  //Enum Colors For Pills
  const enumColors = {
    'DR': 'status-badge-secondary',
    'AP': 'status-badge-success',
    'RC': 'status-badge-danger',
    'WA': 'status-badge-warning',
  }

  // Handle Redirect ADD,VIEW,EDIT
  const handleNavigation = (type, id) => {
    if (id) {
      navigate(`/AddRegulation/${type}/${id}`);
    } else {
      navigate(`/AddRegulation/${type}`);
    }
  };

  //Delete
  const handleDelete = async (id) => {
    setLoading(true);
    const url = `regulations/${id}`;
    try {
      const result = await deleteData(url);
      setModal({ ...modal, confirmModal: false });
      callAlertMsg(result, 'success');
      id = null;
      getTableData();
    } catch (error) {
      setLoading(false);
      setModal({ ...modal, confirmModal: false });
      callAlertMsg(error.response.data.message, 'error');
    }
  };

  // Mark as request change Reason Submit
  const onSubmit = (data) => {
    handleStateChange(selectedId.itemID, enumStatus.status.REQUESTED_CHANGES, data.reason);
    getTableData();
    reset();
  };

  //Handle Open Modal
  const handleOpenModal = (itemID, title, action) => {
    setSelectedId({ itemID, title, action });
    setModal({ ...modal, confirmModal: true });
  };

  //Handle State Change
  const handleStateChange = async (selectedCardId, destination, reason) => {
    setLoading(true);
    const url = `regulations/status/${selectedCardId}`;
    try {
      let data = { "destination": destination };

      if (destination === enumStatus.status.REQUESTED_CHANGES) {
        data.reason = reason;
      }
      const result = await putData(url, data);
      setModal({ ...modal, confirmModal: false });
      callAlertMsg(result, 'success');
      getTableData();
    } catch (error) {
      setLoading(false);
      setModal({ ...modal, confirmModal: false });
      callAlertMsg(error.response.data.message, 'error');
    }
  };

  useEffect(() => {
    getTableData();
  }, [paginationFunction, sortingData]);

  // Alert FUnction
  const alertFunction = () => {
    if (success) {
      callAlertMsg(success, 'success');
      navigate(location.pathname, { replace: true, state: undefined });
    }
  };

  useEffect(() => {
    alertFunction();
  }, []);

  function truncateText(text, wordLimit) {
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  }

  return (
    <div>
      <AlertComponent alertMessage={alertMessage} alert={alert} />
      {/* Loader */}
      <Loader loading={loading} />

      <div className="row">
        <div className="col">
          <div className="row mt-2">
            <div className="col-md base-title">
              <div className='d-flex align-items-center'>
                <span className="icon-bg icon-bg-primary">
                  <Icons iconName="regualtion_headers" className="icon-gradient icon-white" />
                </span>
                <span className='font-s16'>Regulations</span>
              </div>
              {keycloak.principal.userActionItems.has("addRegulations") &&
                <button className="btn btn-sm btn-primary" onClick={() => handleNavigation('create')}> <Icons iconName="add" className="me-2 icon-12 icon-white" /><span className='align-middle'>Add Regulation</span></button>}
            </div>
          </div>

          <div className="card card-shadow">
            <div className="card-body p-0">
              {/* Table Header */}
              <div className="table-header table-accordion-header">
                <div className="row">
                  <div className='col-md-12 d-flex justify-content-sm-between col-xs-between'>
                    <div className="col-md-2 d-flex align-items-center " data-toggle="tooltip" title='Regulation Year, Description'>
                      <Search getData={getTableData} />
                    </div>
                    <div className="col-md-10 d-flex flex-row-reverse align-items-center">
                      <RegulationFilter getTableData={getTableData} filterYear={filterYear} filterProgrammes={filterProgrammes} filterStatus={filterStatus} enumStatus={enumStatus} />
                    </div>
                  </div>
                </div>
              </div>
              {/* Table Body */}
              <div className="table-body fixed-table">
                <table className="table table-default">
                  <thead className="cursor-pointer">
                    <tr>
                      <th className="sorting" onClick={(e) => tableSorting(e, 'year')}>REGULATION YEAR</th>
                      <th className="sorting" onClick={(e) => tableSorting(e, 'version')}>VERSION</th>
                      <th className="sorting" onClick={(e) => tableSorting(e, 'prgmCount')}>PROGRAMME COUNT</th>
                      <th className="sorting" onClick={(e) => tableSorting(e, 'title')}>DESCRIPTION</th>
                      <th className="sorting" onClick={(e) => tableSorting(e, 'status')}>STATUS</th>
                      <th className="text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordData.length > 0 ? (
                      recordData.map((item, i) => (
                        <tr key={i}>
                          <td>{item.year}</td>
                          <td>Version {item.version}</td>
                          <td>{item.prgmCount}</td>
                          <td>{truncateText(item.title, 5)}</td>
                          {enumStatus.status && enumStatus.status.descriptions &&
                            Object.entries(enumStatus.status.descriptions).map(([key, value]) => {
                              if (item.status === key) {
                                return (
                                  <td key={key}>
                                    <span className={'status-badge status-badge-regulation ' + enumColors[item.status]}>
                                      {enumStatus.status.descriptions[item.status]}
                                    </span>
                                  </td>
                                );
                              }
                              return null;
                            })
                          }
                          <td className="action-dropdown">
                            <div className="dropdown" onClick={() => getActionItems(item._id)}>
                              <a className="btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <Icons iconName="Frame" className="icon-20" />
                              </a>
                              <ul className="dropdown-menu dropdown-menu-end">
                                {actionItem.includes(actionItemData?.action?.VIEW) && (
                                  <li>
                                    <a className="dropdown-item text-primary" onClick={() => handleNavigation('view', item._id)}>
                                      View <Icons iconName="vieweye" className="icon-16 icon-primary ms-4" />
                                    </a>
                                  </li>
                                )}
                                {actionItem.includes(actionItemData?.action?.EDIT) && (
                                  <li>
                                    <a className="dropdown-item text-primary" onClick={() => handleNavigation('edit', item._id)}>
                                      Edit <Icons iconName="edit" className="icon-16 icon-primary ms-4" />
                                    </a>
                                  </li>
                                )}
                                {actionItem.includes(actionItemData?.action?.DELETE) && (
                                  <li>
                                    <a className="dropdown-item text-danger" data-bs-toggle="modal" data-bs-target="#failureModal" onClick={() => setSelectedId({ ...selectedId, id: item._id, title: `${item.year}-${item.version}-${item.title}` })}>
                                      Delete <Icons iconName="trashfilled" className="icon-16 icon-danger ms-4" />
                                    </a>
                                  </li>
                                )}
                                {actionItem.includes(actionItemData?.action?.SEND_FOR_APPROVAL) && (
                                  <li>
                                    <a className="dropdown-item text-success" onClick={() => handleOpenModal(item._id, `${item.year}-${item.version}-${item.title}`, "Send for Approval")}>
                                      Send For Approval <Icons iconName="send" className="icon-16 icon-success ms-4" />
                                    </a>
                                  </li>
                                )}
                                {actionItem.includes(actionItemData?.action?.APPROVE) && (
                                  <li>
                                    <a className="dropdown-item text-success" onClick={() => handleOpenModal(item._id, `${item.year}-${item.version}-${item.title}`, "Mark Approved")}>
                                      Mark as Approved <Icons iconName="approved" className="icon-16 ms-3" />
                                    </a>
                                  </li>
                                )}
                                {actionItem.includes(actionItemData?.action?.REQUEST_CHANGES) && (
                                  <li>
                                    <a className="dropdown-item text-info" onClick={() => handleOpenModal(item._id, `${item.year}-${item.version}-${item.title}`, "Request Changes")}>
                                      Mark as Requested Changes <Icons iconName="request_changes" className="icon-16 ms-4" />
                                    </a>
                                  </li>
                                )}
                                {actionItem.includes(actionItemData?.action?.CLONE) && (
                                  <li>
                                    <a className="dropdown-item text-primary" onClick={() => handleNavigation('clone', item._id)}>
                                      Clone<Icons iconName="clone" className="icon-16 icon-primary ms-4" />
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
                        <td colSpan="6" className='text-center'>No Records Found</td>
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

          {/* Delete Modal */}
          <div className="modal fade" id="failureModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="failureModal" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered failure-modal">
              <div className="modal-content">
                <div className="modal-body text-center">
                  <div className="failure-modal-title">
                    <Icons iconName="delete" className="icon-40" />
                  </div>
                  <p className="failure-modal-msg mb-4">Are you Sure you want to <br />
                    delete <strong>'{selectedId.title}' </strong>?</p>
                  <div className="failure-modal-button">
                    <button type="button" className="btn btn-purple me-3" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" className="btn btn-danger" data-bs-dismiss="modal" onClick={() => handleDelete(selectedId.id)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success Modal */}
          <div className="modal fade" id="successModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="successModal" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered msg-modal">
              <div className="modal-content">
                <div className="modal-body text-center">
                  <div className="msg-modal-title">
                    <Icons iconName="thankyou" className="icon-50" />
                    <span> Thank you!</span>
                  </div>
                  <p className="msg-modal-sec mb-4">The form was submitted successfully</p>
                  <div className="msg-modal-button">
                    <button type="button" className="btn btn-purple" data-bs-dismiss="modal">Ok</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Modal */}
          {modal.confirmModal && (
            <div>
              <div className="modal fade show" id="confirmModal1" tabIndex="-1" aria-labelledby="confirmModal" aria-hidden="true" style={{ display: 'block' }}>
                <div className="modal-dialog modal-dialog-centered confirm-msg-modal">
                  <div className="modal-content">
                    <div className="modal-body">
                      <div className="confirm-modal-title">
                        <Icons iconName="are_you_sure" className="mt-2 icon-60" />
                        <span> Are you sure?</span>
                      </div>
                      {selectedId.action === "Send for Approval" && (
                        <p className="confirm-modal-sec text-center">Do you want to send the regulation <strong>'{selectedId.title}' </strong> for approval?</p>
                      )}
                      {selectedId.action === "Mark Approved" && (
                        <p className="confirm-modal-sec text-center">Do you want to approve the regulation <strong>'{selectedId.title}' </strong> ?</p>
                      )}
                      {selectedId.action === "Request Changes" && (
                        <p className="confirm-modal-sec text-center">Do you want to mark the regulation <strong>'{selectedId.title}' </strong> as request changes ?</p>)}

                      {selectedId.action === "Request Changes" && (
                        <div className='mt-3'>
                          <form onSubmit={handleSubmit(onSubmit)}>
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
                      <div className="confirm-modal-button">
                        {selectedId.action !== "Request Changes" && (
                          <button type="button" className="btn btn-cancel me-3" onClick={() => setModal({ ...modal, confirmModal: false })}>Cancel</button>)}
                        {
                          selectedId.action === "Send for Approval" && (
                            <button type="button" className="btn btn-warning" onClick={() => handleStateChange(selectedId.itemID, enumStatus.status.WAITING_FOR_APPROVAL)}>
                              Yes, Confirm
                            </button>
                          )
                        }
                        {selectedId.action === "Mark Approved" && (
                          <button type="button" className="btn btn-warning" onClick={() => handleStateChange(selectedId.itemID, enumStatus.status.APPROVED)}>
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
          )}
        </div>
      </div>

    </div>

  )
}

export default Regulation;