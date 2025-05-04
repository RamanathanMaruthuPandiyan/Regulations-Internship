import React, { useState } from "react";


const Pagination = (props) => {
    const [isInputFocused, setIsInputFocused] = useState(false);

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            props.handleInputChange(e);
            setIsInputFocused(false);
        }
    };

    const handleInputChange = (e) => {
        props.setSelectedDataList(e.target.value);
        const options = ["10", "20", "30", "50", "100"];
        if (options.includes(e.target.value)) {
            setIsInputFocused(false);
            props.handleInputChange(e);
        }
    };

    const handleReset = () => {
        props.setSelectedDataList(props.paginationDataLimit.limit);
    }

    return (
        <div className='card-footer table-pagination'>
            <div className="row">
                <div className='d-flex align-items-center justify-content-sm-between col-xs-between'>
                    <div className='col-sm-3 col-md-6 col-xl-9 col-xxl-9 me-3'>
                        <span>{props.currentPage === 1 ? 1 : (props.currentPage - 1) * props.paginationDataLimit.limit + 1} - {Math.min(props.currentPage * props.paginationDataLimit.limit, props.response.totalRecords)} of {props.response.totalRecords}</span>
                    </div>
                    <div className='col-sm-5 col-md-4 col-xl-2 col-xxl-2 d-flex align-items-center justify-content-end'>
                        Rows per page:
                        <div>
                            <input className="form-control datalist"
                                name="dataLimit"
                                type="number"
                                list="datalistOptions"
                                id="exampleDataList"
                                value={props.selectedDataList}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyPress}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => { setIsInputFocused(false); handleReset() }}
                                min="1"
                            />
                            <datalist id="datalistOptions" className='datalistOptions' >
                                <option value="10" />
                                <option value="20" />
                                <option value="30" />
                                <option value="50" />
                                <option value="100" />
                            </datalist>
                        </div>
                    </div>
                    {/* Pagination controls */}
                    <div className='col-sm-4 col-md-2 col-xl-1 col-xxl-1 pagination d-flex justify-content-center'>
                        <button className="btn navigation-left" type="button" disabled={props.currentPage === 1 || isInputFocused} onClick={() => props.handlePreviousPage()} />
                        <div className='mx-2 d-flex align-items-center'>{props.currentPage} / {props.totalPages}</div>
                        <button className="btn navigation-right" type="button" disabled={props.currentPage === props.totalPages || isInputFocused} onClick={() => props.handleNextPage()} />
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Pagination;