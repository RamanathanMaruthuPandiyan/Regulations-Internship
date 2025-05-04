import React from 'react'

const MappedProgramOutcomes = ({ selectedPo, coPoMappingDetails }) => {
    return (
        <div>
            <div className='card description-card description-card-bg mb-4'>
                <div className='card-body'>
                    <div className='text-primary mb-4 font-s16'>{selectedPo}</div>
                    <div className='description-box'>
                        {coPoMappingDetails.find(detail => Object.keys(detail).includes(selectedPo))?.[selectedPo] || 'No description available'}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default MappedProgramOutcomes