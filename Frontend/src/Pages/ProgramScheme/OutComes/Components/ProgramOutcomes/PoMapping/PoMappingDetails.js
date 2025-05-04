
import React, { useState } from 'react';

const PoMappingDetails = () => {
    const [currentIndex, setCurrentIndex] = useState(-1);
    const values = ['', 'S', 'M', 'L'];

    const handleCheckboxClick = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % values.length);
    };

    return (
        <div className='px-5'>
            <div className='row'>
                <div className='col-md-12 mb-4'>
                    <span className='font-s16'>PO Mapping Details </span>
                </div>
                <div className='col-md-12 d-flex mb-5'>
                    <button className='badge badge-primary badge-primary-lg'>P01</button>
                    <button className='badge badge-white'>P01</button>
                    <button className='badge badge-white'>P02</button>
                    <button className='badge badge-white'>P03</button>
                    <button className='badge badge-white'>P04</button>
                    <button className='badge badge-white'>P05</button>
                    <button className='badge badge-white'>P06</button>
                </div>
            </div>

            <div className='row'>
                <div className='col-md-8'>
                    <div className='card description-card description-card-bg'>
                        <div className='card-body pt-5'>

                            <div className='d-flex align-items-center mb-4'>
                                <div className='w-10'>
                                    <span className={`badge badge-white me-5 ${currentIndex > 0 ? 'active' : ''}`}>PEO1</span>
                                </div>
                                <div className='w-80'>
                                    <div className={`description-box ${currentIndex > 0 ? 'active' : ''}`}>
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sit tortor bibendum laoreet
                                        nisl, suspendisse sed. Dis aenean feugiat lobortis arcu, orci. Lectus.
                                    </div>
                                </div>
                                <div className='w-10 text-center'>
                                    <span
                                        className={`description-checkbox ${currentIndex > 0 ? 'active' : ''}`}
                                        onClick={handleCheckboxClick}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {currentIndex >= 0 && values[currentIndex]}
                                    </span>
                                </div>
                            </div>

                            <div className='d-flex align-items-center mb-4'>
                                <div className='w-10'>
                                    <span className='badge badge-white me-5'>PEO2</span>
                                </div>
                                <div className='w-80'>
                                    <div className='description-box'>
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sit tortor bibendum laoreet
                                        nisl, suspendisse sed. Dis aenean feugiat lobortis arcu, orci. Lectus.
                                    </div>
                                </div>
                                <div className='w-10 text-center'>
                                    <span className='description-checkbox'></span>
                                </div>
                            </div>

                            <div className='d-flex align-items-center mb-4'>
                                <div className='w-10'>
                                    <span className='badge badge-white me-5'>PEO3</span>
                                </div>
                                <div className='w-80'>
                                    <div className='description-box'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sit tortor bibendum laoreet
                                        nisl, suspendisse sed. Dis aenean feugiat lobortis arcu, orci. Lectus.
                                    </div>
                                </div>
                                <div className='w-10 text-center'>
                                    <span className='description-checkbox'></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='col-md-4'>
                    <div className='card description-card description-card-bg'>
                        <div className='card-body'>
                            <div className='text-primary mb-4 font-s16'>Programme Out Come 1</div>
                            <div className='description-box'>
                                Lorem ipsum dolor sit amet,constetur adipiscing elit. Morbi pellentesquam tristique mi a fringilla ut sagittis
                                cursus eros, magna est. Ipsum maecenas
                                risus lobortis commodo augue diam neque. In vel,
                                <br></br>
                                commodo augue diam neque. In vel, maecenastortor
                                pretium consectetur. Bibendum ut ligula risus a suscipit Bibendum ut
                                <br></br>
                                ligula risus a suscipit Bibendum ut ligula risus a suscipit
                                cursus eros, magna est.
                                <br></br>
                                Ipsum maecenas risus lobortis
                                commodo augue diam neque. In vel,
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PoMappingDetails;
