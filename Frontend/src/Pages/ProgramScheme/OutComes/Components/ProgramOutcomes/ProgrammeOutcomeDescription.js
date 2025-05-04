import React, { useState, useEffect } from "react";
import Icons from "../../../../../Components/Icons";
import { enumColors } from "../../../../../Services/AllServices";

const ProgrammeOutcomeDescription = ({ setShowOutCome, setShowOutComeDesc, poResult, status, mappingEnums, reason, actionItemData, actionItem }) => {

    const [isVisible, setIsVisible] = useState(true);

    const handleToggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    return (
        <>
            <div className='col-md-10 d-flex justify-content-between align-items-center mb-3 mx-auto'>
                <div>PO List<span className={'ms-2 status-badge' + " " + enumColors[status]}>
                    {status === mappingEnums?.status?.REQUESTED_CHANGES && (
                        <span className="cursor-pointer" onClick={handleToggleVisibility}><Icons iconName="request-changes-one" className="icon-reason mx-2 " /></span>
                    )}
                    {mappingEnums?.status?.descriptions[status]}
                </span>
                </div>
                <span>
                    {actionItem?.includes(actionItemData?.action?.EDIT) && (
                        <button className='btn btn-sm btn-info-outline px-3' onClick={() => { setShowOutCome(true); setShowOutComeDesc(false) }}>
                            <Icons iconName="edit" className="icon-14 icon-info me-1" />
                            Update</button>
                    )}
                </span>
            </div>

            {isVisible && status === mappingEnums?.status?.REQUESTED_CHANGES && (
                <div className='col-md-10 mx-auto reason-content mb-3'>
                    {reason}
                </div>
            )}

            <div className='col-md-10 mx-auto'>
                <div className='card description-card'>
                    <div className='card-header'>
                        <span className='badge badge-primary'>PO</span>
                        <span className='description-title ms-3'>Description</span>
                    </div>
                    <div className='card-body pb-3'>
                        {poResult && Object.entries(poResult).map(([key, value]) => (
                            <p className="d-flex" key={key}>
                                <div>
                                    <div>
                                        <span className='badge badge-light-blue font-s12'>{key?.toUpperCase()}</span>
                                    </div>
                                </div>
                                <span className='ms-3 font-s16'>{value}</span>
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProgrammeOutcomeDescription