import React, { useState } from 'react';

const CoPoMappingDetails = ({ poList, existingDescList, mappingEnum, mappedList, setMappedList, mappingEnums }) => {

    const [selectedPo, setSelectedPo] = useState(Object.keys(poList)[0] || '');

    // Handle Click Description checkbox
    const handleCheckboxClick = (poKey, descKey) => {
        setMappedList((prevIndexes) => ({
            ...prevIndexes,
            [poKey]: {
                ...prevIndexes[poKey],
                [descKey]: ((prevIndexes[poKey]?.[descKey] + 1) % mappingEnum.length) || 0
            }
        }));
    };

    const showPoDescription = (key) => {
        setSelectedPo(key);
    };

    return (
        <>
            <div className='row'>
                <div className='col-md-12 mb-4'>
                    <span className='font-s16'>CO-PO & PSO Mapping Details </span>
                </div>
                <div className='col-md-8 d-flex flex-wrap mb-4'>
                    {Object.entries(poList).map(([key]) => (
                        <button
                            key={key}
                            style={{ minWidth: '90px' }}
                            className={`badge ${selectedPo === key ? 'badge-primary badge-primary-lg m-1' : 'badge-white m-1'}`}
                            onClick={() => showPoDescription(key)}
                        >
                            {key?.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className='col-md-4'>
                    <div className='d-flex justify-content-end'>
                        {Object.keys(mappingEnums?.level?.descriptions).map((name) => <div className='d-flex align-items-center'>
                            <span className='description-checkbox legends ms-4'>{name}</span><span className='ps-2'> - {mappingEnums?.level?.descriptions[name]}</span>
                        </div>)}
                    </div>
                </div>
            </div>

            {selectedPo.length > 0 && (
                <div className='row'>
                    {selectedPo && (
                        <div className='col-lg-8 col-md-12 mb-0 mb-md-3'>
                            <div className='card description-card description-card-bg'>
                                <div className='card-body pt-5'>
                                    {Object.entries(existingDescList).map(([key, value]) => (
                                        <div className='d-flex align-items-center mb-4' key={key}>
                                            <div className='w-75px'>
                                                <span
                                                    className={`badge badge-white me-5 ${mappedList[selectedPo]?.[key] > -1 && mappingEnum[mappedList[selectedPo][key]] !== '' ? 'active' : ''}`}
                                                >
                                                    {key}
                                                </span>
                                            </div>
                                            <div className='w-100'>
                                                <div
                                                    className={`description-box ${mappedList[selectedPo]?.[key] > -1 && mappingEnum[mappedList[selectedPo][key]] !== '' ? 'active' : ''}`}
                                                >
                                                    {value.description}
                                                </div>
                                            </div>
                                            <div className='text-center'>
                                                <span
                                                    className={`description-checkbox ${mappedList[selectedPo]?.[key] > -1 && mappingEnum[mappedList[selectedPo][key]] !== '' ? 'active' : ''}`}
                                                    onClick={() => handleCheckboxClick(selectedPo, key)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {mappedList[selectedPo]?.[key] >= 0 && mappingEnum[mappedList[selectedPo][key]]}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}


                    {selectedPo && (
                        <div className='col-md-12 col-lg-4'>
                            <div className='card description-card description-card-bg'>
                                <div className='card-body'>
                                    <div className='text-primary mb-4 font-s16'>Programme Outcome - {selectedPo}</div>
                                    <div className='description-box'>
                                        {poList[selectedPo]}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default CoPoMappingDetails;
