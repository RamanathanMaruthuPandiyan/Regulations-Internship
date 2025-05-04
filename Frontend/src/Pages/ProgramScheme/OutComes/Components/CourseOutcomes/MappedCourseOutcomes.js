import React from 'react'

const MappedCourseOutcomes = ({ selectedCo, selectedLevel, coValues }) => {
    return (
        <div>
            <div className='card description-card description-card-bg'>
                <div className='card-body'>
                    <div className='text-primary mb-4 font-s16'>Course Out Come {selectedCo}</div>
                    <div className='description-box'>
                        {coValues ? coValues.description : 'No outcome value available'}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MappedCourseOutcomes