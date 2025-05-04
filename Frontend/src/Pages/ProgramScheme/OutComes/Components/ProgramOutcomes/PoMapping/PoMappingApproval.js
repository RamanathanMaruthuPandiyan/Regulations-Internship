import React from 'react'
import Icons from '../../../../../../Components/Icons';

const PoMappingApproval = ({ setPoMapDetails }) => {
    return (
        <div className='px-5'>
            <div className='d-flex justify-content-between align-items-center mb-3'>
                <div>
                    <span className='me-3'>PO Mapping Details</span>
                    <span className='status-badge status-badge-secondary'>Draft</span>
                </div>
                <div>
                    <button className='btn font-s14 btn-info-outline px-3 me-3' onClick={() => { setPoMapDetails(true); }}>
                        <Icons iconName="edit" className="icon-16 icon-info me-1" />
                        Update</button>

                    <button className='btn font-s14 btn-send-approval px-3'>
                        Send For Approval
                        <Icons iconName="send" className="icon-16 icon-white ms-2" />
                    </button>
                </div>
            </div>

            {/* table */}
            <div className='row'>
                <div className='col-md-9 mb-3 mb-md-0'>
                    <div className='card description-card overflow-auto description-card-bg p-5'>
                        <div className='table-body py-4 px-2'>
                            <table className='mapping-table'>
                                <thead>
                                    <tr>
                                        <th width="5%"></th>
                                        <th>P01</th>
                                        <th>P02</th>
                                        <th>P03</th>
                                        <th>P04</th>
                                        <th>P05</th>
                                        <th>P06</th>
                                        <th>P07</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>PEO1</td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>S</span>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>M</span>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>PEO2</td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>S</span>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>M</span>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>S</span>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>S</span>
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>PEO3</td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>S</span>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>M</span>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>L</span>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>M</span>
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>PEO4</td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>S</span>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>M</span>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>L</span>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                            </a>
                                        </td>
                                        <td>
                                            <a className='mapped-slot'>
                                                <span>M</span>
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className='col-md-3'>
                    <div className='card description-card description-card-bg mb-4'>
                        <div className='card-body'>
                            <div className='text-primary mb-4 font-s16'>Programme Out Come 1</div>
                            <div className='description-box'>
                                Lorem ipsum dolor sit amet,constetur adipiscing elit. Morbi pellentesquam tristique mi a fringilla ut sagittis
                                cursus eros, magna est. Ipsum maecenas risus lobortis commodo..
                            </div>
                        </div>
                    </div>

                    <div className='card description-card description-card-bg'>
                        <div className='card-body'>
                            <div className='text-primary mb-4 font-s16'>Programme Educational Objective 1</div>
                            <div className='description-box'>
                                Lorem ipsum dolor sit amet,constetur adipiscing elit. Morbi pellentesquam tristique mi a fringilla ut sagittis
                                cursus eros, magna est. Ipsum maecenas risus lobortis commodo..
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PoMappingApproval