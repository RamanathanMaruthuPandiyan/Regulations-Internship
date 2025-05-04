import React, { useRef, useState, useEffect } from 'react';
import Icons from './Icons';
import '../Assets/css/components/filters.css';
import CheckBox from './CheckBox';

const ProgrammeSchemeFilter = ({ getCardData, filterData, useFilter }) => {

    const todoRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isGetFilterCalled, setIsGetFilterCalled] = useState(false);

    const { loadFilterOption, clearSelectedFilter, clearAllFilter, filter } = useFilter;

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
            getCardData(true);
        })
    }

    const clearTableData = () => {
        toggleFilter();
        sessionStorage.removeItem('filter');
        getCardData(true);
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
                                                    <Icons iconName="programmenames" className="me-2 icon-20 icon-filter" />Programme Names
                                                </button>
                                            </div>
                                            <div id="collapseOne" className="accordion-collapse collapse show">
                                                <div className="accordion-body filter-check pb-0">
                                                    {(filterData && Object.keys(filterData).length) ?
                                                        ((filterData.prgm && filterData.prgm.length) ? (filterData.prgm.map((program, index) => (
                                                            <div key={index} className='col-md-12'>
                                                                <CheckBox
                                                                    value={program.id}
                                                                    labelText={program.name}
                                                                    onChange={(e) => loadFilterOption(e, program.id, "prgmIds")}
                                                                />
                                                            </div>
                                                        ))) : "") : ""}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="accordion-item mt-2 border border-0">
                                            <div className="accordion-header">
                                                <button className="accordion-button pb-2 px-1" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                                    <Icons iconName="department" className="me-2 icon-20 icon-filter" />Department Names
                                                </button>
                                            </div>
                                            <div id="collapseTwo" className="accordion-collapse collapse show">
                                                <div className="accordion-body filter-check pb-0">
                                                    {(filterData && Object.keys(filterData).length) ?
                                                        ((filterData.dept && filterData.dept.length) ? (filterData.dept.map((department, index) => (
                                                            <div key={index} className='col-md-12'>
                                                                <CheckBox
                                                                    value={department.id}
                                                                    labelText={department.name}
                                                                    onChange={(e) => loadFilterOption(e, department.id, "deptIds")}
                                                                />
                                                            </div>
                                                        ))) : "") : ""}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="accordion-item mt-2 border border-0">
                                            <div className="accordion-header">
                                                <button className="accordion-button pb-2 px-1" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                                    <Icons iconName="programme_type" className="me-2 icon-20 icon-filter" />Programme Type
                                                </button>
                                            </div>
                                            <div id="collapseThree" className="accordion-collapse collapse show">
                                                <div className="accordion-body filter-check pb-0">
                                                    {(filterData && Object.keys(filterData).length) ?
                                                        ((filterData.type && filterData.type.length) ? (filterData.type.map((prgmType, index) => (
                                                            <div key={index} className='col-md-12'>
                                                                <CheckBox
                                                                    value={prgmType}
                                                                    labelText={prgmType}
                                                                    onChange={(e) => loadFilterOption(e, prgmType, "type")}
                                                                />
                                                            </div>
                                                        ))) : "") : ""}
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

export default ProgrammeSchemeFilter