import React, { useState } from "react";
import Icons from "../../../../../Components/Icons";
import { useForm, Controller } from 'react-hook-form';

const ProgrammeOutcome = ({ showOutCome, control, errors, index, remove }) => {

    return (
        <div className=''>
            {showOutCome == true ? (
                <>
                    <div className='col-md-9 mx-auto'>
                        <div className='card-bg-blue card mb-4'>
                            <div className='card-body text-start p-0'>
                                <div className="d-flex justify-content-between">
                                    <div className='mb-1'>
                                        <span className='badge badge-primary'>PO{index + 1}</span>
                                        <span className='card-title'>Programme Outcome {index + 1}</span>
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
                                        name={`ProgrammeOutcome[${index}].description`}
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
                                    {errors?.ProgrammeOutcome?.[index]?.description && (
                                        <div className="text-danger">
                                            {errors.ProgrammeOutcome[index].description.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : null
            }
        </div>
    )
}

export default ProgrammeOutcome