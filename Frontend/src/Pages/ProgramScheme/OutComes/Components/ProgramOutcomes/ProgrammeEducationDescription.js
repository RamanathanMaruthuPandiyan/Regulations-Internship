import React, { useState } from "react";
import Icons from "../../../../../Components/Icons";
import { putData } from '../../../../../Services/ApiServices';
import { useForm, Controller } from 'react-hook-form';
import { enumColors } from "../../../../../Services/AllServices";

const ProgrammeEducationDescription = ({ setShowEducationalObjective, setShowEducationalObjectiveDesc, peoResult, prgmRegId, callAlertMsg, setLoading, status, mappingEnums, getCardData, reason, actionItemData, actionItem }) => {

    const { control, handleSubmit, reset, formState: { errors } } = useForm();

    const [modal, setModal] = useState({ sendApproval: false });
    const [destination, setDestination] = useState()
    const [isVisible, setIsVisible] = useState(true);

    const handleToggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    const handleApprovalSubmit = async () => {
        try {
            const url = `programme/regulations/status/${prgmRegId}`;
            const result = await putData(url, { destination });
            setLoading(false);
            callAlertMsg(result, 'success');
            getCardData();
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error')
        }
    }

    const onSubmit = async (data) => {
        try {
            const url = `programme/regulations/status/${prgmRegId}`;
            const result = await putData(url, { destination, reason: data.reason });
            setLoading(false);
            callAlertMsg(result, 'success');
            getCardData();
            setModal({ ...modal, sendApproval: false })
            reset();
        } catch (error) {
            setLoading(false);
            setModal({ ...modal, sendApproval: false })
            callAlertMsg(error.response.data.message, 'error')
        }
    };


    return (
        <>
            <div className='col-md-12 col-lg-10 mx-auto d-flex justify-content-between align-items-center mb-3'>
                <div>PEO List<span className={'ms-sm-0 ms-lg-2 status-badge' + " " + enumColors[status]}>
                    {status === mappingEnums?.status?.REQUESTED_CHANGES && (
                        <span className="cursor-pointer" onClick={handleToggleVisibility}><Icons iconName="request-changes-one" className="icon-reason me-1" /></span>
                    )}
                    {mappingEnums?.status?.descriptions[status]}</span>
                </div>
                <div>
                    {actionItem?.includes(actionItemData?.action?.EDIT) && (

                        <button className='btn btn-sm btn-info-outline me-4 mb-2 mb-md-0' onClick={() => { setShowEducationalObjective(true); setShowEducationalObjectiveDesc(false) }}>
                            <Icons iconName="edit" className="icon-14 icon-info me-1" />
                            Update
                        </button>
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

            </div >

            {isVisible && status === mappingEnums?.status?.REQUESTED_CHANGES && (
                <div className='col-md-12 col-lg-10 mx-auto reason-content mb-3'>
                    {reason}
                </div>
            )
            }

            <div className='col-md-12 col-lg-10 mx-auto'>
                <div className='card description-card'>
                    <div className='card-header d-flex justify-content-between'>
                        <div>
                            <span className='badge badge-primary'>PEO</span>
                            <span className='description-title ms-3'>Description</span>
                        </div>
                    </div>
                    <div className='card-body pb-3'>
                        {Object.keys(peoResult).map((value, key) => (
                            <p className='d-flex' key={key}>
                                <div>
                                    <span className='badge badge-light-blue font-s12'>{"PEO" + " " + (parseInt(key) + 1)}</span>
                                </div>
                                <span className='ms-3 font-s16'>{peoResult[value]}</span>
                            </p>
                        ))}
                    </div>
                </div>
            </div>

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
                                            <p className="confirm-modal-sec text-center">Do you want to send the programme related outcomes for approval ?</p>
                                        )}
                                        {destination === mappingEnums.status.APPROVED && (
                                            <p className="confirm-modal-sec text-center">Do you want to mark the programme related outcomes as 'Approved' ?</p>
                                        )}
                                        {destination === mappingEnums.status.REQUESTED_CHANGES && (
                                            <p className="confirm-modal-sec text-center">Do you want to mark the programme related outcomes as 'Requested Changes' ? Specify the reason.</p>)}

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
        </>
    )
}

export default ProgrammeEducationDescription