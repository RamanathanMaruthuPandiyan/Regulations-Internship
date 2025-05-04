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

function MarkDistribution() {

  //State
  const navigate = useNavigate();
  const location = useLocation()
  const { success } = location.state || {};
  const [markDistribution, setMarkDistribution] = useState([]);
  const [actionItem, setActionItem] = useState([]);
  const [modal, setModal] = useState({ distributionDelete: false });
  const [selectedId, setSelectedId] = useState(null);
  const [distributionName, setDistributionName] = useState(null);
  const [attributeEnum, setAttributeEnum] = useState({ courseType: "" });

  //Loader
  const [loading, setLoading] = useState(false);

  //Alert
  const { alert, alertMessage, callAlertMsg } = useAlertMsg();

  const [actionItemData, setActionItemData] = useState([]);

  const { tableSorting, sortingData } = useSorting();

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
    const url = 'evaluation/schemes/pagination';
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
      let courseType = await getData('attributes/enums/by/type');
      setAttributeEnum({ courseType });

      setResponse(result);

      setMarkDistribution(result.records); //Common
      setLoading(false);

    } catch (error) {
      setLoading(false);
      callAlertMsg(error.response.data.message, 'error');
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
      navigate(`/addDistribution/${type}/${id}`);
    } else {
      navigate(`/addDistribution/${type}`);
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
    setLoading(true);
    const url = `evaluation/schemes/action/items/${id}`;
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
  const handleOpenDeleteModal = (id, name) => {
    setDistributionName(name);
    setSelectedId(id);
    setModal({ ...modal, distributionDelete: true });
  };

  const handleCloseDeleteModal = () => {
    setDistributionName(null);
    setSelectedId(null);
    setModal({ ...modal, distributionDelete: false });
  }

  //Delete Function
  const handleDelete = async () => {
    setLoading(true);
    const url = `evaluation/schemes/${selectedId}`;
    try {
      const result = await deleteData(url);
      handleCloseDeleteModal();
      setLoading(false);
      callAlertMsg(result, 'success');
    } catch (error) {
      setLoading(false);
      handleCloseDeleteModal();
      callAlertMsg(error.response.data.message, 'error');
    }
    getTableData();
  };

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
            <div className="base-title">
              <div className='d-flex align-items-center'>
                <span className="icon-bg icon-bg-gray">
                  <Icons iconName="model" className="icon-gradient icon-white" />
                </span>
                <span className='font-s16'>Evaluation Schemes</span>
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
                        <button className="btn btn-sm btn-primary" onClick={() => handleNavigation('add')}> <Icons iconName="add" className="me-2 icon-12 icon-white" /><span className='align-middle'>Add Evaluation Scheme</span></button>
                      </div>
                    </div>
                  </div>

                  {/* Table */}

                  <div className="row my-3 fixed-body">
                    <div className="col-md-12">
                      <table className="table-header-gray table-header-fixed">
                        <thead className='cursor-pointer'>
                          <tr>
                            <th className="sorting" onClick={(e) => tableSorting(e, 'name')} rowspan="2">DISTRIBUTION NAME</th>
                            <th className="sorting" onClick={(e) => tableSorting(e, 'courseType')} rowspan="2">COURSE TYPE</th>
                            <th colspan="3" className='text-center'>MARK DISTRIBUTION</th>
                            <th rowspan="2" className='text-center'>ACTION</th>
                          </tr>
                          <tr className='text-center additional-header'>
                            <th className="sorting" onClick={(e) => tableSorting(e, 'CA.scaled')}><span>CA</span></th>
                            <th className="sorting" onClick={(e) => tableSorting(e, 'FE.scaled')}><span>FE</span></th>
                            <th className="sorting" onClick={(e) => tableSorting(e, 'total')}><span>Total</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(markDistribution && markDistribution.length) ?
                            (markDistribution.map((item, i) => (
                              <tr>
                                <td>{item.name}</td>
                                <td className='transform-text'>{attributeEnum.courseType.values[item.courseType].toLowerCase()}</td>
                                <td className='text-center'>{item.CA.scaled}</td>
                                <td className='text-center'>{item.FE.scaled}</td>
                                <td className='text-center'>{item.total}</td>
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
                                          <a className="dropdown-item text-danger" onClick={() => handleOpenDeleteModal(item._id, item.name)}>Delete <Icons iconName="trashfilled" className="icon-15 icon-danger ms-4" />
                                          </a>
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            ))) : (
                              <tr>
                                <td colSpan="6" className='text-center'>No Records Found</td>
                              </tr>
                            )
                          }
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
      {modal.distributionDelete && (
        <div>
          <div className="modal fade show" id="failureModal" tabIndex="-1" aria-labelledby="failureModal" aria-hidden="true" style={{ display: 'block' }}>
            <div className="modal-dialog modal-dialog-centered failure-modal">
              <div className="modal-content">
                <div className="modal-body text-center">
                  <div className="failure-modal-title">
                    <Icons iconName="delete" className="icon-40" />
                  </div>
                  <p className="failure-modal-msg mb-4">Are you sure you want to <br />
                    delete Mark Distribution <strong>{distributionName}</strong></p>
                  <div className="failure-modal-button">
                    <button type="button" className="btn btn-purple me-3" onClick={() => handleCloseDeleteModal()}>Cancel</button>
                    <button type="button" className="btn btn-danger" onClick={() => handleDelete()}>Delete</button>
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

export default MarkDistribution