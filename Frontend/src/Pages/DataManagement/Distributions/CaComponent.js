import React, { useEffect, useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { useParams } from "react-router-dom";
import CaSubComponent from './CaSubComponent';
import Icons from '../../../Components/Icons';
import InputText from '../../../Components/InputText';
import RadioButton from '../../../Components/RadioButton';
import { handleNumberChangeEvalScheme, validateNumber } from '../../../Services/AllServices';

const CaComponent = ({ control, isViewMode, errors, Controller, getValues, setValue, handleConversion, handleConductingChange }) => {

    const [subCompIndex, setSubCompIndex] = useState(null);

    const { id, type } = useParams();

    // extracting the `fields` array, `append` , renaming , `remove`
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'evaluationScheme.CA_Components',
    });

    // extracting the Append Handle Add row
    const handleAddRow = (index) => {
        append({
            name: '',
            hasSubComponent: false,
            hasConversion: false,
            sub: [{ "name": '', "marks": { actual: null, scaled: null }, "hasSubComponent": false, "hasConversion": false }]
        });
        setTimeout(() => ScrollView(index + 1), 0);  // Schedule ScrollView after the component updates
    };

    const ScrollView = (index) => {
        const element = document.getElementById("caSubComponent" + index);
        if (element) {
            element.scrollIntoView();
        }
    };

    // Using useWatch to watch the 'sub component' field
    const hasSubComponents = useWatch({
        control,
        name: fields.map((_, index) => `evaluationScheme.CA_Components[${index}].hasSubComponent`),
    });

    const hasComponentsConversion = useWatch({
        control,
        name: fields.map((_, index) => `evaluationScheme.CA_Components[${index}].hasConversion`),
    });

    // Using useWatch to watch the 'sub mark mode' field
    const handleSubMarkMode = useWatch({
        control,
        name: fields.map((_, index) => `evaluationScheme.CA_Components[${index}].marks.mode`),
    });


    //Clear Marks when Yes or No option changes
    const caClearInputValue = (indexToRemove, category) => {
        const currentItems = getValues('evaluationScheme.CA_Components');
        const append = { "name": '', "marks": { actual: null, scaled: null }, "hasSubComponent": false, "hasConversion": false };
        let updatedItems = currentItems.map((item, index) => {
            if (index === indexToRemove) {
                return {
                    ...item,
                    sub: category ? append : undefined,
                    marks: { actual: undefined, count: undefined, mode: undefined }
                };
            }
            return item;
        });

        setValue('evaluationScheme.CA_Components', updatedItems);
        if (category) {
            setSubCompIndex(indexToRemove);
        }
    }

    // Using useWatch to watch the 'sub Mark Distributions' field
    const handleMarkDistributions = useWatch({
        control,
        name: fields.map((_, index) => `evaluationScheme.CA_Components[${index}].hasConversion`),
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
                    <span className='icon-bg icon-bg-white'><Icons iconName="coursetype" className="icon-gradient icon-gray" /></span> CA Distribution
                </div>
                <div className='d-flex align-items-center'>
                    <span className='me-3 font-s16'>Total Conducting Marks </span>
                    <span className='total-page-input me-5'>
                        <Controller
                            name="evaluationScheme.markSplitUp.CA.actual"
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
                                    name="markSplitUp.CA.actual"
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
                            name="evaluationScheme.markSplitUp.CA.scaled"
                            control={control}
                            rules={{
                                required: "* CA total marks are required",
                                max: {
                                    value: 500,
                                    message: "Maximum value is 500"
                                }
                            }}
                            render={({ field }) =>
                                <InputText
                                    name="markSplitUp.CA.scaled"
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
            {errors?.evaluationScheme?.markSplitUp?.CA?.actual && <p className="text-danger text-end pe-3 mb-0 mt-1">{errors.evaluationScheme.markSplitUp.CA.actual.message}</p>}
            {errors?.evaluationScheme?.markSplitUp?.CA?.scaled && <p className="text-danger text-end pe-3 mb-0 mt-1">{errors.evaluationScheme.markSplitUp.CA.scaled.message}</p>}

            <div className='card-body p-5 pt-3 pe-3'>

                {fields.map((component, index) => (
                    <div id={"caSubComponent" + (index + 1)} key={component.id}>
                        <div>
                            <div className='row mb-4'>
                                <div className='col-md-12 d-flex justify-content-end align-items-center mb-4'>
                                    {index === 0 && (
                                        !isViewMode && (
                                            <button type="button" className='btn btn-sm btn-gradient' onClick={() => handleAddRow(fields.length)}>
                                                <Icons iconName="addcircle" className="icon-15 icon-white me-1" /> New
                                            </button>
                                        )
                                    )}
                                    {index !== 0 && (
                                        !isViewMode && (
                                            <div className='delete-icon-bg border ms-3' onClick={() => remove(index)}>
                                                <a><Icons iconName="delete" className="icon-15" /></a>
                                            </div>
                                        )
                                    )}
                                </div>
                                <div className='col-md-6'>
                                    <div className='row'>
                                        <div className='col-md-9 form-group'>
                                            <label className="form-label text-primary mb-2">
                                                Component<span className='ms-1'>{index + 1}</span>
                                            </label>
                                            <Controller
                                                name={`evaluationScheme.CA_Components[${index}].name`}
                                                control={control}
                                                rules={{ validate: value => value.trim() !== "" || "Component name is required", required: "Component name is required" }}
                                                render={({ field }) =>
                                                    <InputText
                                                        name={"CA_Components." + index + ".name"}
                                                        type="text"
                                                        placeholder="Component Name"
                                                        value={field.value}
                                                        onChange={(value) => { field.onChange(value) }}
                                                        disabled={isViewMode}
                                                    />
                                                }
                                            />
                                            {errors?.evaluationScheme?.CA_Components?.[index]?.name && (
                                                <span className="text-danger">{errors.evaluationScheme.CA_Components[index].name.message}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className='col-md-6'>
                                    <div className='row'>
                                        <div className='col-md-6 col-lg-12 col-xl-12 form-group'>
                                            <label className="form-label mb-2">Do you want To Create Sub Component?</label>
                                            <div>
                                                <Controller
                                                    name={`evaluationScheme.CA_Components[${index}].hasSubComponent`}
                                                    control={control}
                                                    rules={{
                                                        validate: value => value !== null && value !== undefined || "This field is required"
                                                    }}
                                                    render={({ field }) => (
                                                        <>
                                                            <RadioButton
                                                                {...field}
                                                                className="form-check-inline"
                                                                labelText="Yes"
                                                                value={true}
                                                                onChange={() => {
                                                                    field.onChange(true);
                                                                    caClearInputValue(index, true)
                                                                }}
                                                                checked={field.value === true}
                                                                disabled={isViewMode}
                                                            />
                                                            <RadioButton
                                                                {...field}
                                                                className="form-check-inline"
                                                                labelText="No"
                                                                value={false}
                                                                onChange={() => {
                                                                    field.onChange(false);
                                                                    caClearInputValue(index)
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
                                </div>
                            </div>
                            {hasSubComponents[index] && (
                                <div className='row mb-4'>
                                    <div className='col-md-6'>
                                        <div className='row'>
                                            <div className='col-md-4 form-group'>
                                                <label className="form-label mb-2 d-block"> Mark consideration </label>
                                                <Controller
                                                    name={`evaluationScheme.CA_Components[${index}].marks.mode`}
                                                    control={control}
                                                    rules={{ required: 'This field is required' }}
                                                    render={({ field }) => (
                                                        <>
                                                            <RadioButton
                                                                name={"CA_Components." + index + ".marks.mode"}
                                                                className="form-check-inline"
                                                                value="AVERAGE"
                                                                labelText="Average"
                                                                onChange={() => field.onChange("AVERAGE")}
                                                                checked={field.value === "AVERAGE"}
                                                                disabled={isViewMode}
                                                            />
                                                            <RadioButton
                                                                name={"CA_Components." + index + ".marks.mode"}
                                                                className="form-check-inline"
                                                                labelText="Best"
                                                                value="BEST"
                                                                onChange={() => field.onChange("BEST")}
                                                                checked={field.value === "BEST"}
                                                                disabled={isViewMode}
                                                            />
                                                            <RadioButton
                                                                name={"CA_Components." + index + ".marks.mode"}
                                                                className="form-check-inline"
                                                                value="SUM"
                                                                labelText="Total"
                                                                onChange={() => field.onChange("SUM")}
                                                                checked={field.value === "SUM"}
                                                                disabled={isViewMode}
                                                            />
                                                        </>
                                                    )}
                                                />
                                                {errors?.evaluationScheme?.CA_Components?.[index]?.marks?.mode && (
                                                    <span className="text-danger">
                                                        {errors.evaluationScheme.CA_Components[index].marks.mode.message}
                                                    </span>
                                                )}
                                            </div>
                                            {handleSubMarkMode?.[index] == 'BEST' && (
                                                <div className='col-md-4 form-group align-self-center'>
                                                    <Controller
                                                        name={`evaluationScheme.CA_Components[${index}].marks.count`}
                                                        control={control}
                                                        rules={{
                                                            required: "This field is required",
                                                            max: {
                                                                value: 100,
                                                                message: "Maximum value is 100"
                                                            },
                                                            pattern: {
                                                                value: /^[0-9]*[1-9][0-9]*$/,
                                                                message: 'Input must be a number greater than 0'
                                                            }
                                                        }}
                                                        render={({ field }) => (
                                                            <InputText
                                                                name={"CA_Components." + index + ".marks.count"}
                                                                type="number"
                                                                placeholder="Count"
                                                                value={field.value}
                                                                onChange={handleNumberChangeEvalScheme(field)}
                                                                disabled={isViewMode}
                                                            />
                                                        )}
                                                    />
                                                    {errors?.evaluationScheme?.CA_Components?.[index]?.marks?.count && (
                                                        <span className="text-danger">
                                                            {errors.evaluationScheme.CA_Components[index].marks.count.message}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className='col-md-6'>
                                        <div className='row'>
                                            <div className='col-md-3 col-lg-6 col-xl-4 form-group'>
                                                <label className="form-label mb-2"> Conducting Marks</label>
                                                <div>
                                                    <Controller
                                                        name={`evaluationScheme.CA_Components[${index}].marks.actual`}
                                                        control={control}
                                                        rules={{
                                                            required: "Conducting marks are required",
                                                            max: { value: 500, message: "Maximum value is 500" }
                                                        }}
                                                        render={({ field }) => (
                                                            <InputText
                                                                name={"CA_Components." + index + ".marks.actual"}
                                                                type="number"
                                                                className="form-control"
                                                                placeholder="Conducting Marks"
                                                                step="0.1"
                                                                value={field.value}
                                                                onChange={(e) => {
                                                                    handleConductingChange(e, field, 'CA_Components', index);
                                                                }}
                                                                disabled={isViewMode}
                                                            />
                                                        )}
                                                    />
                                                    {errors?.evaluationScheme?.CA_Components?.[index]?.marks?.actual && (
                                                        <span className="text-danger">
                                                            {errors.evaluationScheme.CA_Components[index].marks.actual.message}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className='col-md-4 col-lg-6 col-xl-4 form-group'>
                                                <div className="col-md-12 form-group">
                                                    <label className="form-label mb-2">Is Conversion required?</label>
                                                    <div>
                                                        <Controller
                                                            name={`evaluationScheme.CA_Components[${index}].hasConversion`}
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
                                                                            handleConversion(true, 'CA_Components', index)
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
                                                                            handleConversion(false, 'CA_Components', index)
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
                                            <div className='col-md-3 col-lg-6 col-xl-4 form-group'>
                                                {handleMarkDistributions[index] == true && (
                                                    <div className='col-md-12 form-group'>
                                                        <label className="form-label mb-2"> Scalable Marks</label>
                                                        <div>
                                                            <Controller
                                                                name={`evaluationScheme.CA_Components[${index}].marks.scaled`}
                                                                control={control}
                                                                rules={{
                                                                    required: "Scalable marks are required",
                                                                    max: { value: 500, message: "Maximum value is 500" }
                                                                }}
                                                                render={({ field }) => (
                                                                    <InputText
                                                                        name={"CA_Components." + index + ".marks.scaled"}
                                                                        type="number"
                                                                        className="form-control"
                                                                        value={field.value}
                                                                        step="0.1"
                                                                        placeholder="Scalable Marks"
                                                                        onChange={(e) => { validateNumber(e, field) }}
                                                                        disabled={isViewMode}
                                                                    />
                                                                )}
                                                            />
                                                            {errors?.evaluationScheme?.CA_Components?.[index]?.marks?.scaled && (
                                                                <span className="text-danger">
                                                                    {errors.evaluationScheme.CA_Components[index].marks.scaled.message}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {hasSubComponents[index] !== true && (
                                <div className='col-md-6'>
                                    <div className='row'>
                                        <div className='col-md-12'>
                                            <div className='row'>
                                                <div className='col-md-4 form-group'>
                                                    <label className="form-label mb-2"> Conducting Marks </label>
                                                    <Controller
                                                        name={`evaluationScheme.CA_Components[${index}].marks.actual`}
                                                        control={control}
                                                        rules={{
                                                            required: "Conducting marks is required",
                                                            max: {
                                                                value: 500,
                                                                message: "Maximum value is 500"
                                                            }
                                                        }}
                                                        render={({ field }) => <InputText
                                                            name={"CA_Components." + index + ".marks.actual"}
                                                            type="number"
                                                            placeholder="Conducting Marks"
                                                            step="0.1"
                                                            value={field.value}
                                                            onChange={(e) => handleConductingChange(e, field, 'CA_Components', index)}
                                                            disabled={isViewMode}
                                                        />}
                                                    />
                                                    {errors?.evaluationScheme?.CA_Components?.[index]?.marks?.actual && <p className="text-danger">{errors.evaluationScheme.CA_Components[index].marks.actual.message}</p>}
                                                </div>
                                                <div className='col-md-4 col-lg-6 col-xl-4 form-group'>
                                                    <div className='col-md-12 form-group'>
                                                        <label for="subComponent" className="form-label mb-2"> is Conversion required?  </label>
                                                        <div>
                                                            <Controller
                                                                name={`evaluationScheme.CA_Components[${index}].hasConversion`}
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
                                                                                handleConversion(true, 'CA_Components', index)
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
                                                                                handleConversion(false, 'CA_Components', index)
                                                                            }}
                                                                            checked={field.value === false}
                                                                            disabled={isViewMode}
                                                                        />

                                                                    </>
                                                                )} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='col-md-4 form-group'>
                                                    {hasComponentsConversion[index] == true && (
                                                        <div className='col-md-12 form-group'>
                                                            <label className="form-label"> Scalable Marks  </label>
                                                            <Controller
                                                                name={`evaluationScheme.CA_Components[${index}].marks.scaled`}
                                                                control={control}
                                                                rules={{
                                                                    required: "Scalable marks are required",
                                                                    max: {
                                                                        value: 500,
                                                                        message: "Maximum value is 500"
                                                                    }
                                                                }}
                                                                render={({ field }) => <InputText
                                                                    name={"CA_Components." + index + ".marks.scaled"}
                                                                    type="number"
                                                                    placeholder="Scalable Marks"
                                                                    step="0.1"
                                                                    value={field.value}
                                                                    onChange={(e) => { validateNumber(e, field) }}
                                                                    disabled={isViewMode}
                                                                />} />
                                                            {errors?.evaluationScheme?.CA_Components?.[index]?.marks?.scaled && <span className="text-danger">{errors.evaluationScheme.CA_Components[index].marks.scaled.message}</span>}
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                            }
                            <CaSubComponent
                                control={control}
                                index={index}
                                hasSubComponents={hasSubComponents}
                                isViewMode={isViewMode}
                                errors={errors}
                                Controller={Controller}
                                getValues={getValues}
                                setValue={setValue}
                                subCompIndex={subCompIndex}
                                setSubCompIndex={setSubCompIndex}
                            />

                            {index !== fields.length - 1 && <div className='dashed-line mb-4' />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

}
export default CaComponent;