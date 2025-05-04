import React, { useEffect } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { useParams } from "react-router-dom";
import InputText from '../../../Components/InputText';
import RadioButton from '../../../Components/RadioButton';
import Icons from '../../../Components/Icons';
import { validateNumber } from '../../../Services/AllServices';

const FeComponent = ({ control, isViewMode, errors, Controller, getValues, setValue, handleConversion, handleConductingChange }) => {

    // extracting the `fields` array, `append` , renaming , `remove` function to`handleRemoveRow`
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'evaluationScheme.FE_Components',
    });

    const { id, type } = useParams();

    // extracting the Append Handle Add row

    const handleAddRow = (index) => {
        append({
            name: '',
            hasSubComponent: false,
            hasConversion: false,
            marks: {
                actual: null,
                scaled: null
            }
        });
        setTimeout(() => ScrollView(index + 1), 0);  // Schedule ScrollView after the component updates
    };

    const ScrollView = (index) => {
        const element = document.getElementById("feComponent" + index);
        if (element) {
            element.scrollIntoView();
        }
    };

    // Using useWatch to watch the 'sub Mark Distributions' field
    const handleMarkDistributions = useWatch({
        control,
        name: fields.map((_, index) => `evaluationScheme.FE_Components[${index}].hasConversion`),
    });

    useEffect(() => {
        if (type == 'edit' && !fields.length) {
            handleAddRow();
        }
    }, [])

    return (
        <div className='card card-header-gray mt-4'>
            <div className='card-header'>
                <div className='d-flex align-items-center'>
                    <span className='icon-bg icon-bg-white'>
                        <Icons iconName="coursetype" className="icon-gradient icon-gray" />
                    </span> FE Distribution
                </div>
                <div className='d-flex align-items-center'>
                    <span className='me-3 font-s16'>Total Conducting Marks </span>
                    <span className='total-page-input me-5'>
                        <Controller
                            name="evaluationScheme.markSplitUp.FE.actual"
                            control={control}
                            rules={{
                                required: "* Total conducting marks are required",
                                max: {
                                    value: 500,
                                    message: "Maximum value is 500"
                                }
                            }}
                            render={({ field }) =>
                                <InputText
                                    name="markSplitUp.FE.actual"
                                    type="number"
                                    className="form-control"
                                    step="0.1"
                                    value={field.value}
                                    onChange={(e) => { validateNumber(e, field) }}
                                    disabled={isViewMode}
                                />}
                        />
                    </span>
                    <span className='me-3 font-s16'>Total </span>
                    <span className='total-page-input'>
                        <Controller
                            name="evaluationScheme.markSplitUp.FE.scaled"
                            control={control}
                            rules={{
                                required: "* FE total marks are required",
                                max: {
                                    value: 500,
                                    message: "Maximum value is 500"
                                }
                            }}
                            render={({ field }) =>
                                <InputText
                                    name="markSplitUp.FE.scaled"
                                    type="number"
                                    className="form-control"
                                    step="0.1"
                                    value={field.value}
                                    onChange={(e) => { validateNumber(e, field) }}
                                    disabled={isViewMode}
                                />}
                        />

                    </span>
                </div>
            </div>
            {errors?.evaluationScheme?.markSplitUp?.FE?.actual && <p className="text-danger text-end pe-3 mb-0 mt-1">{errors.evaluationScheme.markSplitUp.FE.actual.message}</p>}
            {errors?.evaluationScheme?.markSplitUp?.FE?.scaled && <p className="text-danger text-end pe-3 mb-0 mt-1">{errors.evaluationScheme.markSplitUp.FE.scaled.message}</p>}

            <div className='card-body p-5 pt-3 pe-3'>
                {fields.map((field, index) => (
                    <div className='row mb-4' key={field.id} id={"feComponent" + (index + 1)}>
                        {index === 0 && (
                            isViewMode !== true && (
                                <div className='col-md-12 text-end mb-4'>
                                    <button type="button" className='btn btn-sm btn-gradient' onClick={() => handleAddRow(fields.length)}>
                                        <Icons iconName="addcircle" className="icon-15 icon-white me-1" /> New
                                    </button>
                                </div>)
                        )}
                        <div className='row mb-4'>
                            <div className='col-md-6'>
                                <div className='row'>
                                    <div className='col-md-9 form-group'>
                                        <label className="form-label mb-2 text-primary"> Component Name <span className='ms-1'>{index + 1}</span></label>
                                        <Controller
                                            name={`evaluationScheme.FE_Components[${index}].name`}
                                            control={control}
                                            rules={{
                                                validate: value => value.trim() !== "" || "Component name is required",
                                                required: "Component name is required"
                                            }}
                                            render={({ field }) =>
                                                <InputText
                                                    name={"FE_Components." + index + ".name"}
                                                    placeholder="Component Name"
                                                    value={field.value}
                                                    onChange={(value) => { field.onChange(value) }}
                                                    disabled={isViewMode}
                                                />
                                            }
                                        />
                                        {errors?.evaluationScheme?.FE_Components?.[index]?.name && <p className="text-danger">{errors.evaluationScheme.FE_Components[index].name.message}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='row px-4'>
                            <div className='col-md-6'>
                                <div className='row'>
                                    <div className='col-md-12'>
                                        <div className='row'>
                                            <div className='col-md-4 form-group'>
                                                <label className="form-label mb-2"> Conducting Marks </label>
                                                <Controller
                                                    name={`evaluationScheme.FE_Components[${index}].marks.actual`}
                                                    control={control}
                                                    rules={{
                                                        required: "Conducting marks is required",
                                                        max: {
                                                            value: 500,
                                                            message: "Maximum value is 500"
                                                        }
                                                    }}
                                                    render={({ field }) => <InputText
                                                        name={"FE_Components." + index + ".marks.actual"}
                                                        type="number"
                                                        placeholder="Conducting Marks"
                                                        step="0.1"
                                                        value={field.value}
                                                        onChange={(e) => handleConductingChange(e, field, 'FE_Components', index)}
                                                        disabled={isViewMode}
                                                    />}
                                                />
                                                {errors?.evaluationScheme?.FE_Components?.[index]?.marks?.actual && <p className="text-danger">{errors.evaluationScheme.FE_Components[index].marks.actual.message}</p>}
                                            </div>
                                            <div className='col-md-4 col-lg-6 col-xl-4 form-group'>
                                                <div className="col-md-12 form-group">
                                                    <label className="form-label mb-2">Is Conversion required?</label>
                                                    <div>
                                                        <Controller
                                                            name={`evaluationScheme.FE_Components[${index}].hasConversion`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                <>
                                                                    <RadioButton
                                                                        {...field}
                                                                        className="form-check-inline"
                                                                        labelText="Yes"
                                                                        value={true}
                                                                        onChange={(value) => {
                                                                            field.onChange(true);
                                                                            handleConversion(true, 'FE_Components', index)
                                                                        }}
                                                                        checked={field.value === true}
                                                                        disabled={isViewMode}
                                                                    />
                                                                    <RadioButton
                                                                        {...field}
                                                                        className="form-check-inline"
                                                                        labelText="No"
                                                                        value={false}
                                                                        onChange={(value) => {
                                                                            field.onChange(false);
                                                                            handleConversion(false, 'FE_Components', index)
                                                                        }}
                                                                        checked={field.value === false}
                                                                        disabled={isViewMode}
                                                                    />
                                                                </>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-4 form-group'>
                                                {handleMarkDistributions[index] == true && (
                                                    <div className='col-md-12 form-group'>
                                                        <label className="form-label"> Scalable Marks  </label>
                                                        <Controller
                                                            name={`evaluationScheme.FE_Components[${index}].marks.scaled`}
                                                            control={control}
                                                            rules={{
                                                                required: "Scalable marks are required",
                                                                max: {
                                                                    value: 500,
                                                                    message: "Maximum value is 500"
                                                                }
                                                            }}
                                                            render={({ field }) => <InputText
                                                                name={"FE_Components." + index + ".marks.scaled"}
                                                                type="number"
                                                                placeholder="Scalable Marks"
                                                                step="0.1"
                                                                value={field.value}
                                                                onChange={(e) => { validateNumber(e, field) }}
                                                                disabled={isViewMode}
                                                            />} />
                                                        {errors?.evaluationScheme?.FE_Components?.[index]?.marks?.scaled && <span className="text-danger">{errors.evaluationScheme.FE_Components[index].marks.scaled.message}</span>}
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='col-md-6'>
                                <div className='row'>
                                    <div className='col-md-2 col-lg-2 col-xl-2 d-flex align-items-center'>
                                        {index !== 0 && (
                                            isViewMode !== true ?
                                                <div className='delete-icon-bg border mt-3' onClick={() => remove(index)}><a><Icons iconName="delete" className="icon-15" /></a></div> : ""
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

    )
}
export default FeComponent;