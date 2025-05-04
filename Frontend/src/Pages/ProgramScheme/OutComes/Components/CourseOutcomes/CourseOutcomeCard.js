import React, { useState } from "react";
import Icons from "../../../../../Components/Icons";
import { Controller } from 'react-hook-form';
import InputText from '../../../../../Components/InputText';
import Selector from "../../../../../Components/Selector";


const CourseOutcomeCard = ({ showOutCome, control, errors, index, remove, taxonomies }) => {

    return (
        <div>
            <>
                {(showOutCome &&
                    <div className='col-md-12 col-lg-9 mx-auto'>
                        <div className='card-bg-pink card-bg-blue card mb-4'>
                            <div className='card-body text-start p-0'>
                                <div className="d-flex justify-content-between">
                                    <div className='mb-1'>
                                        <span className='badge badge-primary'>CO{index + 1}</span>
                                        <span className='card-title'>Course Outcome{index + 1}</span>
                                    </div>
                                    {index !== 0 && (
                                        <div className="cursor-pointer delete-btn-bg-white">
                                            <a onClick={() => remove(index)}>
                                                <Icons iconName="card_delete" className="icon-14 icon-danger" />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className='form-label mb-3 mt-4'>Description</label>
                                    <Controller
                                        name={`courseOutcome[${index}].description`}
                                        control={control}
                                        defaultValue=""
                                        rules={{ validate: value => value.trim() !== "" || "Description is required", required: "Description is required" }}
                                        render={({ field }) => (
                                            <textarea
                                                className="form-control"
                                                placeholder='Description'
                                                {...field}
                                            />
                                        )}
                                    />
                                    {errors?.courseOutcome?.[index]?.description && (
                                        <div className="text-danger">
                                            {errors.courseOutcome[index].description.message}
                                        </div>
                                    )}
                                </div>
                                <div className="row">
                                    <div className="col-md-10" >
                                        <label className='form-label mb-3 mt-4'>Bloom's Taxonomy</label>
                                        <Controller
                                            name={`courseOutcome[${index}].taxonomy`}
                                            control={control}
                                            type="number"
                                            rules={{
                                                required: "Taxonomy is required",
                                            }}
                                            render={({ field }) => (
                                                <Selector
                                                    className="select"
                                                    options={taxonomies}
                                                    isMulti={true}
                                                    isClearable={false}
                                                    closeMenuOnSelect={false}
                                                    disabled={false}
                                                    value={field.value}
                                                    manageSearchValue={true}
                                                    onChange={(e) => field.onChange(e)}
                                                />
                                            )}
                                        />
                                        {errors?.courseOutcome?.[index]?.taxonomy && (
                                            <div className="text-danger">
                                                {errors.courseOutcome[index].taxonomy.message}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-2" >
                                        <label className='form-label mb-3 mt-4'>CO Weightage</label>
                                        <Controller
                                            name={`courseOutcome[${index}].weightage`}
                                            control={control}
                                            rules={{
                                                required: "Weightage is required",
                                                min: {
                                                    value: 0.1,
                                                    message: "Minimum value is 0.1"
                                                },
                                                max: {
                                                    value: 1,
                                                    message: "Maximum value is 1"
                                                }
                                            }}
                                            render={({ field }) => (
                                                <InputText
                                                    className="form-control"
                                                    type="number"
                                                    placeholder='weightage'
                                                    value={field.value}
                                                    onChange={(e) => {
                                                        field.onChange(isFinite(e.target.value) ? Number(e.target.value) : 0)
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors?.courseOutcome?.[index]?.weightage && (
                                            <div className="text-danger">
                                                {errors.courseOutcome[index].weightage.message}
                                            </div>
                                        )}
                                    </div>
                                </div>




                            </div>
                        </div>
                    </div>
                )}
            </>
        </div>
    )
}

export default CourseOutcomeCard
