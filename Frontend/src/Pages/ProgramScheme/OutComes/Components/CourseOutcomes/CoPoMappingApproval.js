import React, { useState } from 'react'
import Icons from '../../../../../Components/Icons'
import MappedCourseOutcomes from './MappedCourseOutcomes'
import MappedProgramOutcomes from './MappedProgramOutcomes'
import TableCell from './TableCell'
import { putData } from '../../../../../Services/ApiServices';
import { useForm, Controller } from 'react-hook-form';
import { enumColors } from '../../../../../Services/AllServices'

const CoPoMappingApproval = ({ setShowApprovalPage, coPoMappingDetails, actionItem, actionItemData, mappingEnums, courseId, callAlertMsg, getCoPoMappingDetails, getCoData, setLoading, setRefresh, status, reason }) => {

    const { control, handleSubmit, reset, formState: { errors } } = useForm();

    const [coDescription, setCoDescription] = useState("")
    const [selectedPo, setSelectedPo] = useState(null);
    const [selectedCo, setSelectedCo] = useState(null);
    const [modal, setModal] = useState({ sendForApprovalModal: false });
    const [destination, setDestination] = useState()
    const [isVisible, setIsVisible] = useState(true);

    const handleToggleVisibility = () => {
        setIsVisible(!isVisible);
    };


    // Step 1: Extract all unique COs
    const uniqueCOs = Array.from(
        new Set(coPoMappingDetails.flatMap((detail) => detail.courseOutcome.map((outcome) => Object.keys(outcome)[0])))
    );

    // Step 2: Extract PO headers dynamically from the data
    const poHeaders = coPoMappingDetails.map((detail) => Object.keys(detail)[0])

    // Step 3: Function to get the level for a given PO and CO
    const getLevel = (po, co) => {
        const poDetail = coPoMappingDetails.find((detail) => detail[po]);
        if (poDetail) {
            const coDetail = poDetail.courseOutcome.find((outcome) => outcome[co]);
            return coDetail ? coDetail.level : "";
        }
        return "";
    };

    const getAverage = (po) => {
        const data = coPoMappingDetails.find((detail) => {
            if (detail[po]) {
                return detail?.average
            }
        })
        return data?.average;
    };

    //Get Co description for mapped details
    const getCoLevel = (po, co) => {
        const getPoDetail = coPoMappingDetails.find((detail) => detail[po]);
        if (!getPoDetail) {
            return null;
        }
        const getCoDetail = getPoDetail.courseOutcome.find((outcome) => outcome[co]);
        if (!getCoDetail) {
            return null;
        }
        return getCoDetail[co];
    };


    // Handler for clicking a table cell
    const handleCellClick = (po, co) => {
        setCoDescription(getCoLevel(po, co));
        setSelectedPo(po);
        setSelectedCo(co);
    };

    const handleApprovalSubmit = async () => {
        setLoading(true);
        try {
            const url = `courses/mapping/status/${courseId}`;
            const result = await putData(url, { destination });
            callAlertMsg(result, 'success');
            setRefresh((prev) => prev + 1)
            setLoading(false);

        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error')
        }
    }

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const url = `courses/mapping/status/${courseId}`;
            const result = await putData(url, { destination, reason: data.reason });
            callAlertMsg(result, 'success');
            setLoading(false);
            setModal({ ...modal, sendApproval: false })
            reset();
            setRefresh((prev) => prev + 1)
        } catch (error) {
            setLoading(false);
            setModal({ ...modal, sendApproval: false })
            callAlertMsg(error.response.data.message, 'error')
        }
    };


    return (
        <div>
            <div className='d-flex justify-content-between align-items-center mb-3'>
                <div className='col-md-6 d-flex align-items-center justify-content-between'>
                    <div >CO-PO & PSO Mapping Details<span className={'ms-sm-0 ms-lg-2 status-badge' + " " + enumColors[status]}>
                        {status === mappingEnums?.status?.REQUESTED_CHANGES && (
                            <span className="cursor-pointer" onClick={handleToggleVisibility}><Icons iconName="request-changes-one" className="icon-reason me-1" /></span>
                        )}
                        {mappingEnums?.status?.descriptions[status]}</span>
                    </div>
                </div>
                <div className={actionItem?.includes(actionItemData?.action?.REQUEST_CHANGES) && actionItem?.includes(actionItemData?.action?.EDIT) ? 'col-md-6 d-flex justify-content-between' : 'col-md-6 d-flex justify-content-between ps-6'}>
                    <div>
                        <div className='d-flex justify-content-end'>
                            {Object.keys(mappingEnums?.level?.descriptions).map((name) => <div className='d-flex align-items-center'>
                                <span className='description-checkbox legends ms-4'>{name}</span><span className='ps-2'> - {mappingEnums?.level?.descriptions[name]}</span>
                            </div>)}
                        </div>
                    </div>
                    <div>
                        {actionItem?.includes(actionItemData?.action?.EDIT) && (
                            <button className='btn font-s14 btn-info-outline px-3 me-3' onClick={() => { setShowApprovalPage(true); }}>
                                <Icons iconName="edit" className="icon-16 icon-info me-1" />
                                Update</button>
                        )}

                        {actionItem?.includes(actionItemData?.action?.SEND_FOR_APPROVAL) && (
                            <button type="button" className='btn btn-sm btn-send-approval me-4 mb-2 mb-md-0' onClick={() => { setModal({ ...modal, sendApproval: true }); setDestination(mappingEnums.status.WAITING_FOR_APPROVAL) }}>
                                <span className="align-middle"> Send For Approval</span>
                                <Icons iconName="send" className="icon-16 icon-white ms-2" />
                            </button>
                        )}


                        {actionItem?.includes(actionItemData?.action?.REQUEST_CHANGES) && (
                            <>
                                <button type="button" className='btn btn-sm btn-outline-req-changes me-4 mb-2 mb-md-0' onClick={() => { setModal({ ...modal, sendApproval: true }); setDestination(mappingEnums.status.REQUESTED_CHANGES) }}>
                                    <Icons iconName="request-changes-one" className="icon-14 icon-request me-2" />
                                    <span className="align-middle">Mark as Requested Changes</span>
                                </button>

                                <button type="button" className='btn btn-sm btn-send-approval' onClick={() => { setModal({ ...modal, sendApproval: true }); setDestination(mappingEnums.status.APPROVED) }}>
                                    <Icons iconName="approved-one" className="icon-15 icon-white me-1" />
                                    <span className="align-middle"> Mark as Approved</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {isVisible && status === mappingEnums?.status?.REQUESTED_CHANGES && (
                <div className='col-md-12 col-lg-12 mx-auto reason-content reason-content-custom mb-3'>
                    {reason}
                </div>
            )}

            {/* table */}
            <div className='row'>
                <div className='col-md-12 col-lg-9 mb-md-3'>
                    <div className='card description-card overflow-auto description-card-bg p-5'>
                        <div className='table-body'>
                            <table className='mapping-table'>
                                <thead>
                                    <tr>
                                        <th width="5%"></th>
                                        {poHeaders.map((header, index) => (
                                            <th key={index}>{header?.toUpperCase()}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {uniqueCOs.sort().map((co, index) => (
                                        <tr key={index}>
                                            <td>{co}</td>
                                            {poHeaders.map((po, i) => (
                                                <TableCell className='mapped-slot' key={i} level={getLevel(po, co)} onClick={() => handleCellClick(po, co)} />
                                            ))}
                                        </tr>
                                    ))}
                                    <tr>
                                        <td className="fw-normal">Average</td>
                                        {poHeaders.map((po, i) => (
                                            <TableCell className='average-slot' key={i} level={getAverage(po)} />
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className='col-md-12 col-lg-3'>
                    <MappedProgramOutcomes selectedPo={selectedPo} coPoMappingDetails={coPoMappingDetails} />

                    <MappedCourseOutcomes selectedCo={selectedCo} coValues={coDescription} />
                </div>
            </div>

            {/* Send for approval */}
            {/* Confirm Modal */}
            {
                modal.sendApproval && (
                    <div>
                        <div className="modal fade show" id="confirmModal" tabIndex="-1" aria-labelledby="confirmModal" aria-hidden="true" style={{ display: 'block' }}>
                            <div className="modal-dialog modal-dialog-centered confirm-msg-modal">
                                <div className="modal-content">
                                    <div className="modal-body">
                                        <div className="confirm-modal-title">
                                            <Icons iconName="are_you_sure" className="mt-2 icon-60" />
                                            <span> Are you sure?</span>
                                        </div>
                                        {destination === mappingEnums.status.WAITING_FOR_APPROVAL && (
                                            <p className="confirm-modal-sec text-center">Do you want to send the CO-PO & PSO for approval?</p>
                                        )}
                                        {destination === mappingEnums.status.APPROVED && (
                                            <p className="confirm-modal-sec text-center">Do you want to approve the CO-PO & PSO ?</p>
                                        )}
                                        {destination === mappingEnums.status.REQUESTED_CHANGES && (
                                            <p className="confirm-modal-sec text-center">Do you want to mark the CO-PO & PSO as request changes ?</p>)}

                                        {destination === mappingEnums.status.REQUESTED_CHANGES && (
                                            <div className='mt-3'>
                                                <form>
                                                    <Controller
                                                        name="reason"
                                                        control={control}
                                                        rules={{ required: "Reason is required" }}
                                                        render={({ field }) =>
                                                            <textarea className="form-control"
                                                                placeholder="Reason"
                                                                {...field}
                                                            >
                                                            </textarea>}
                                                    />
                                                    {errors.reason && <p className="text-danger">{errors.reason.message}</p>}
                                                    <div className="confirm-modal-button mt-4 mb-0">
                                                        <button type="button" className="btn btn-cancel me-3" onClick={() => { setModal({ ...modal, sendApproval: false }) }}>Cancel</button>
                                                        <button type="button" className="btn btn-warning" onClick={handleSubmit(onSubmit)}>
                                                            Yes, Confirm
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}

                                        <div className="confirm-modal-button">
                                            {destination !== mappingEnums.status.REQUESTED_CHANGES && (
                                                <>
                                                    <button type="button" className="btn btn-cancel me-3" onClick={() => { setModal({ ...modal, sendApproval: false }) }}>Cancel</button>
                                                    <button type="button" className="btn btn-warning" onClick={() => { setModal({ ...modal, sendApproval: false }); handleApprovalSubmit(); }}>
                                                        Yes, Confirm
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-backdrop fade show"></div>
                    </div>
                )
            }
        </div>
    )
}

export default CoPoMappingApproval