import React, { useRef, useState } from 'react';
import Icons from './Icons';
import '../Assets/css/components/filters.css';
import CheckBox from './CheckBox';
import { useFilter } from '../Services/CommonServices';
import DateCalendar from './DateCalender';


const BatchJobFilter = ({ getTableData, filterName, jobEnums, filterStatus }) => {

    const todoRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const dateFormat = "dd/MM/yyyy";
    const [isGetFilterCalled, setIsGetFilterCalled] = useState(false);

    const [date, setDate] = useState(null);
    const { loadFilterOption, loadDateFilter, clearAllFilter, filter } = useFilter();

    const toggleFilter = () => {
        setIsVisible(!isVisible);
        const filterToggle = todoRef.current;
        if (isVisible) {
            filterToggle.style.display = "none";
        } else {
            filterToggle.style.display = "block";
        }
    };

    const getFilters = (filter) => {

        if (Object.keys(filter).length) {
            setIsGetFilterCalled(true);
            sessionStorage.setItem('filter', JSON.stringify(filter));
        } else {
            sessionStorage.removeItem('filter');
        }

        setTimeout(function () {
            getTableData(true);
        })
    }

    const clearTableData = () => {
        toggleFilter();
        sessionStorage.removeItem('filter');
        getTableData(true);
        setDate(null);
    }

    return (
        <>
            <div className="mx-2 filter-container">
                <div className="dropdown filter-section">
                    <button className="btn btn-filter" type="button" onClick={toggleFilter}>
                        {
                            (filter && Object.keys(filter).length && isGetFilterCalled) ?
                                (<Icons iconName="filter" className="icon-15 icon-primary" />) :
                                (<Icons iconName="filter" className="icon-15 icon-filter" />)
                        }
                    </button>
                    <div ref={todoRef} className="filter collapse">
                        <div >
                            <div className="headerRow d-flex justify-content-end">
                                <a className="link cursor-pointer" onClick={() => (clearAllFilter(), clearTableData())}>Clear All</a>
                            </div>
                            <div>
                                <div className="filter-accordion filter-content">
                                    <div className="accordion" id="accordionExample">
                                        <div className="accordion-item border border-0">
                                            <div className="accordion-header">
                                                <button className="accordion-button pb-2 px-1" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
                                                    <Icons iconName="regulation_year" className="me-2 icon-20 icon-filter" />Creation Date
                                                </button>
                                            </div>
                                            <div id="collapseOne" className="accordion-collapse collapse show">
                                                <div className="accordion-body filter-check pb-0">
                                                    <div className='row'>
                                                        <div className='col-md-12 form-group'>
                                                            <div>
                                                                <DateCalendar
                                                                    value={date}
                                                                    format={dateFormat}
                                                                    onChange={(selectedDate) => { loadDateFilter(selectedDate, "createDate"); setDate(selectedDate) }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="accordion-item mt-2 border border-0">
                                            <div className="accordion-header">
                                                <button className="accordion-button pb-2 px-1" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                                    <Icons iconName="jobname" className="me-2 icon-20 icon-filter" />Name
                                                </button>
                                            </div>
                                            <div id="collapseTwo" className="accordion-collapse collapse show">
                                                <div className="accordion-body filter-check pb-0">
                                                    <div className='row'>
                                                        {(filterName && filterName.length) ?
                                                            (filterName.map((name, index) => (
                                                                <div key={index} className='col-md-12'>
                                                                    <CheckBox
                                                                        value={name}
                                                                        labelText={jobEnums && Object.keys(jobEnums).length && jobEnums.names.descriptions[name]}
                                                                        id={name}
                                                                        onChange={(e) => loadFilterOption(e, name, "name")}
                                                                    />
                                                                </div>
                                                            ))) : ""}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="accordion-item mt-2 border border-0">
                                            <div className="accordion-header">
                                                <button className="accordion-button pb-2 px-1" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                                    <Icons iconName="status" className="me-2 icon-20 icon-filter" />Status
                                                </button>
                                            </div>
                                            <div id="collapseThree" className="accordion-collapse collapse show">
                                                <div className="accordion-body filter-check pb-0">
                                                    <div className='row mt-1'>
                                                        {(filterStatus && filterStatus.length) ?
                                                            (filterStatus.map((status, index) => (
                                                                <div key={index} className='col-md-4 form-group'>
                                                                    <CheckBox
                                                                        value={status}
                                                                        labelText={jobEnums && Object.keys(jobEnums).length && jobEnums.status.descriptions[status]}
                                                                        id={status}
                                                                        onChange={(e) => loadFilterOption(e, status, "status")}
                                                                    />
                                                                </div>
                                                            ))) : ""}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                                <div className="row mt-4 filter-footer">
                                    <div className="col-md-12 result-Btn d-flex justify-content-center">
                                        <button className="btn btn-sm btn-primary py-2 px-4 d-flex" onClick={() => (toggleFilter(), getFilters(filter))}> Show Result </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='filter-background' onClick={toggleFilter}>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default BatchJobFilter