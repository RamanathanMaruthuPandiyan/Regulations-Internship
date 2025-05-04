import React, { useEffect } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';

import InputText from '../../../Components/InputText';
import RadioButton from '../../../Components/RadioButton';
import Icons from '../../../Components/Icons';
import { validateNumber } from '../../../Services/AllServices';

const CaSubComponent = ({ control, index, hasSubComponents, isViewMode, errors, Controller, getValues, setValue, subCompIndex, setSubCompIndex }) => {

    // extracting the `fields` array, `append` , renaming , `remove`
    const fieldArrayName = `evaluationScheme.CA_Components.${index}.sub`;
    const { fields, remove, append } = useFieldArray({
        control,
        name: fieldArrayName
    });

    // extracting the Append Handle Add row
    const handleAddSubRow = () => {
        append({ "name": '', "marks": { actual: null, scaled: null }, "hasSubComponent": false, "hasConversion": false });
    };

    // Using useWatch to watch the 'handle Mark Distributions' field
    const handleMarkDistributions = useWatch({
        control,
        name: fields.map((_, subIndex) => `evaluationScheme.CA_Components[${index}].sub[${subIndex}].hasConversion`),
    });

    //Conversion Yes or No Change to set field value
    const handleConversionSub = (category, index, subindex) => {
        if (category) {
            setValue(`evaluationScheme.CA_Components[${index}].sub[${subindex}].marks.scaled`, undefined);
        } else {
            setValue(`evaluationScheme.CA_Components[${index}].sub[${subindex}].marks.scaled`, getValues().evaluationScheme.CA_Components[index].sub[subindex].marks.actual);
        }
    }

    const handleSubConductingChange = (e, field, index, subIndex) => {
        validateNumber(e, field);
        setTimeout(function () {
            if (!getValues().evaluationScheme.CA_Components[index].sub[subIndex].hasConversion) {
                handleConversionSub(false, index, subIndex)
            }
        }, 10)
    }

    useEffect(() => {
        if (subCompIndex == undefined) {
            return
        }
        subCompIndex = subCompIndex + 1;
        if (subCompIndex && !fields.length) {
            let element = document.getElementById('addRow' + subCompIndex);
            if (element) {
                element.click();
                setSubCompIndex(undefined);
            }
        }
    }, [subCompIndex])

    return (
        <div>
            {/* a tag is only append when yes or no option is changed */}
            <a className='add-btn d-none' id={'addRow' + (index + 1)} onClick={() => handleAddSubRow()}> Add </a>
            {fields.map((subComponent, subIndex) => (
                (
                    <div key={subComponent.id}>
                        <div className='row px-4 mb-4'>

                            {hasSubComponents[index] && (
                                <>
                                    <div className='col-md-6'>
                                        <div className='row'>
                                            <div className='col-md-9 form-group'>
                                                <label className="form-label mb-2"> Sub Component</label>
                                                <Controller
                                                    name={`evaluationScheme.CA_Components[${index}].sub[${subIndex}].name`}
                                                    control={control}
                                                    rules={{ validate: value => value.trim() !== "" || "Sub component name is required", required: "Sub component name is required" }}
                                                    render={({ field }) => (
                                                        <InputText
                                                            name={"CA_Components." + index + ".sub." + subIndex + ".name"}
                                                            value={field.value}
                                                            placeholder="Component Name"
                                                            onChange={(value) => { field.onChange(value); }}
                                                            disabled={isViewMode} />
                                                    )} />
                                                {errors?.evaluationScheme?.CA_Components?.[index]?.sub?.[subIndex]?.name && (
                                                    <span className="text-danger">
                                                        {errors.evaluationScheme.CA_Components[index].sub[subIndex].name.message}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className='col-md-6'>
                                        <div className='row'>
                                            <div className='col-md-4 col-lg-6 col-xl-4 form-group'>
                                                <label className="form-label mb-2"> Conducting Marks </label>
                                                <Controller
                                                    name={`evaluationScheme.CA_Components[${index}].sub[${subIndex}].marks.actual`}
                                                    control={control}
                                                    rules={{
                                                        required: "Conducting marks are required",
                                                        max: { value: 500, message: "Maximum value is 500" }
                                                    }}
                                                    render={({ field }) => (
                                                        <InputText
                                                            name={"CA_Components." + index + ".sub." + subIndex + ".marks.actual"}
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Conducting Marks"
                                                            value={field.value}
                                                            onChange={(e) => handleSubConductingChange(e, field, index, subIndex)}
                                                            disabled={isViewMode} />
                                                    )}
                                                />
                                                {errors?.evaluationScheme?.CA_Components?.[index]?.sub?.[subIndex]?.marks?.actual && (
                                                    <span className="text-danger">
                                                        {errors.evaluationScheme.CA_Components[index].sub[subIndex].marks.actual.message}
                                                    </span>
                                                )}
                                            </div>
                                            <div className='col-md-4 col-lg-6 col-xl-4 form-group'>
                                                <div className='col-md-12 form-group'>
                                                    <label className="form-label mb-2"> Is Conversion required? </label>
                                                    <div>
                                                        <Controller
                                                            name={`evaluationScheme.CA_Components[${index}].sub[${subIndex}].hasConversion`}
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
                                                                            handleConversionSub(true, index, subIndex)
                                                                        }}
                                                                        checked={field.value === true}
                                                                        disabled={isViewMode} />
                                                                    <RadioButton
                                                                        {...field}
                                                                        className="form-check-inline"
                                                                        labelText="No"
                                                                        value={false}
                                                                        onChange={(value) => {
                                                                            field.onChange(false);
                                                                            handleConversionSub(false, index, subIndex)
                                                                        }}
                                                                        checked={field.value === false}
                                                                        disabled={isViewMode} />
                                                                </>
                                                            )} />
                                                    </div>
                                                    {errors?.evaluationScheme?.CA_Components?.[index]?.sub?.[subIndex]?.hasConversion && (
                                                        <span className="text-danger">
                                                            {errors.evaluationScheme.CA_Components[index].sub[subIndex].hasConversion.message}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className='col-md-12 form-group'>
                                                    {handleMarkDistributions?.[subIndex] && (
                                                        <div className='col-md-12 form-group'>
                                                            <Controller
                                                                name={`evaluationScheme.CA_Components[${index}].sub[${subIndex}].marks.scaled`}
                                                                control={control}
                                                                rules={{
                                                                    required: "Scalable marks are required",
                                                                    max: { value: 500, message: "Maximum value is 500" }
                                                                }}
                                                                render={({ field }) => (
                                                                    <InputText
                                                                        name={"CA_Components." + index + ".sub." + subIndex + ".marks.scaled"}
                                                                        type="number"
                                                                        placeholder="Scalable Marks"
                                                                        step="0.1"
                                                                        value={field.value}
                                                                        onChange={(e) => { validateNumber(e, field) }}
                                                                        disabled={isViewMode} />
                                                                )} />
                                                            {errors?.evaluationScheme?.CA_Components?.[index]?.sub?.[subIndex]?.marks?.scaled && (
                                                                <span className="text-danger">
                                                                    {errors.evaluationScheme.CA_Components[index].sub[subIndex].marks.scaled.message}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {hasSubComponents[index] && (
                                                <div className='col-md-3 col-lg-6 col-xl-4 d-flex mt-3'>
                                                    {subIndex === fields.length - 1 && !isViewMode && (
                                                        <div className='me-3'>
                                                            <a className='add-btn' onClick={() => handleAddSubRow()}>
                                                                <Icons iconName="addcircle" className="icon-15 icon-primary me-1" />Add
                                                            </a>
                                                        </div>
                                                    )}
                                                    {subIndex !== 0 && !isViewMode && (
                                                        <div className='delete-icon-bg border' onClick={() => remove(subIndex)}>
                                                            <Icons iconName="delete" className="icon-15" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </>
                            )}
                        </div>
                    </div>
                )
            ))
            }
        </div>
    )
}
export default CaSubComponent;