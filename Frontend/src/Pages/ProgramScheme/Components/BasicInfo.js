import React, { useEffect, useState } from 'react';
import Icons from '../../../Components/Icons';
import InputText from '../../../Components/InputText';
import RadioButton from '../../../Components/RadioButton';
import { putData } from '../../../Services/ApiServices';
import { useAppContext } from '../Context/Context';
import { useForm, Controller } from "react-hook-form";

const BasicInfo = ({ schemeInfo, getBasicInfo, access }) => {

    const { setLoading, callAlertMsg, programId, regulationId } = useAppContext();

    const [minCredit, setMinCredit] = useState('');
    const [lateralCredit, setLateralCredit] = useState('');
    const [isLateral, setIsLateral] = useState(false);
    const { control, setValue } = useForm({ defaultValues: { isLateralCredit: false } });

    //Submit the Minimum Credits Marks
    const handleMinimumCredits = async (event, isLateralFalse) => {
        setLoading(false);
        if (event.type == "submit") {
            event.preventDefault();
        }
        try {
            const url = 'programme/regulations/minimum/credits';
            const data = {
                regulationId: regulationId,
                prgmId: programId,
                isLateral: isLateralFalse ? false : isLateral,
                regularCredits: minCredit,
                lateralCredits: isLateral ? lateralCredit : 0
            }
            setLoading(true);
            const response = await putData(url, { ...data });
            setLoading(false);
            callAlertMsg(response, 'success');
            getBasicInfo();
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    const handleRadioButtonChange = (value) => {
        setIsLateral(false);
        handleMinimumCredits(value, true);
    }

    useEffect(() => {
        setValue("isLateralCredit", Boolean(schemeInfo.minCredits?.lateral));
        setIsLateral(Boolean(schemeInfo.minCredits?.lateral));
        setMinCredit(schemeInfo.minCredits?.regular);
        setLateralCredit(schemeInfo.minCredits?.lateral);
    }, [schemeInfo]);

    return (
        <div>
            <div className='card card-header-gradient'>
                <div className='card-header px-4 py-3'>
                    <div className='d-flex align-items-center'>
                        <span className='icon-bg icon-bg-white'><Icons iconName="basic_info" className="icon-16 icon-primary" /></span> Basic Information
                    </div>
                </div>
                <div className='card-body p-5 py-25'>
                    <div className='row'>
                        <div className='col-xs-12 col-sm-12 col-md-6 '>
                            <div className='row'>
                                <div className='col-xs-12 col-sm-12 col-md-12'>
                                    <div className='scheme-details-list'>
                                        <div className='list-title d-flex'>
                                            <span className='icon-bg icon-bg-lightblue'>
                                                <Icons iconName="programme_basic_info" className="icon-gradient icon-gray" /></span><span>Programme Name</span>
                                        </div>
                                        <div className='list-name'>
                                            <span className='col-xs-inline'>{schemeInfo.name || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className='scheme-details-list'>
                                        <div className='list-title d-flex'>
                                            <span className='icon-bg icon-bg-lightblue'>
                                                <Icons iconName="programme_stream" className="icon-gradient icon-gray" /></span><span>Programme Stream </span>
                                        </div>
                                        <div className='list-name'>
                                            <span>{schemeInfo.stream || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className='scheme-details-list'>
                                        <div className='list-title d-flex'>
                                            <span className='icon-bg icon-bg-lightblue'>
                                                <Icons iconName="department_card" className="icon-12" /></span><span>Department</span>
                                        </div>
                                        <div className='list-name'>
                                            <span>{schemeInfo.dept || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className='scheme-details-list'>
                                        <div className='list-title d-flex'>
                                            <span className='icon-bg icon-bg-lightblue'>
                                                <Icons iconName="programme_shortname" className="icon-gradient icon-gray" /></span><span>Programme Short Name</span>
                                        </div>
                                        <div className='list-name'>
                                            <span>{schemeInfo.shortName || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-xs-12 col-sm-12 col-md-6'>
                            <div className='row'>
                                <div className='col-xs-12 col-sm-12 col-md-12'>
                                    <div className='scheme-details-list'>
                                        <div className='list-title d-flex'>
                                            <span className='icon-bg icon-bg-lightblue'>
                                                <Icons iconName="programme_type_card" className="icon-gradient icon-gray" /></span><span>Programme Type</span>
                                        </div>
                                        <div className='list-name'>
                                            <span>{schemeInfo.type || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className='scheme-details-list'>
                                        <div className='list-title d-flex'>
                                            <span className='icon-bg icon-bg-lightblue'>
                                                <Icons iconName="programme_duration" className="icon-gradient icon-gray" /></span><span>Programme Duration  </span>
                                        </div>
                                        <div className='list-name'>
                                            <span>{schemeInfo.duration || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className='scheme-details-list'>
                                        <div className='list-title d-flex'>
                                            <span className='icon-bg icon-bg-lightblue'>
                                                <Icons iconName="programme_state" className="icon-gradient icon-gray" /></span><span>Scheme Status</span>
                                        </div>
                                        <div className='list-name'>
                                            <span>{schemeInfo.statusDesc || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className='scheme-details-list'>
                                        <div className='list-title d-flex'>
                                            <span className='icon-bg icon-bg-lightblue'>
                                                <Icons iconName="regulation_basic_info" className="icon-gradient icon-gray" /></span><span>Regulation</span>
                                        </div>
                                        <div className='list-name'>
                                            <span>{schemeInfo.regulationYear} - {schemeInfo.version} - {schemeInfo.title}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='col-xs-12 col-sm-12 col-md-6'>
                            <div className='row'>
                                <div className='col-xs-12 col-sm-12 col-md-12'>
                                    <div className='scheme-details-list'>
                                        <div className='list-title d-flex'>
                                            <span className='icon-bg icon-bg-lightblue'>
                                                <Icons iconName="minimum_credits" className="icon-20" /></span><span>Minimum Credits</span>
                                        </div>
                                        <div className='list-name'>
                                            <InputText
                                                className="width-100"
                                                name="minimumCredits"
                                                value={minCredit || ""}
                                                onChange={(e) => setMinCredit(parseInt(e.target.value))}
                                                onBlur={handleMinimumCredits}
                                                disabled={!access}

                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-xs-12 col-sm-12 col-md-6'>
                            <div className='row'>
                                <div className='col-xs-12 col-sm-12 col-md-12'>
                                    <div className='scheme-details-list'>
                                        <div className='list-title d-flex'>
                                            <span className='icon-bg icon-bg-lightblue'>
                                                <Icons iconName="lateral_credits" className="icon-20" /></span><span>Lateral Credits</span>
                                        </div>
                                        <div className='list-name'>
                                            <span className='mt-1'>
                                                <Controller
                                                    name="isLateralCredit"
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
                                                                    setIsLateral(true);
                                                                }}
                                                                checked={field.value === true}
                                                                disabled={!access}
                                                            />
                                                            <RadioButton
                                                                {...field}
                                                                className="form-check-inline"
                                                                labelText="No"
                                                                value={false}
                                                                onChange={(value) => {
                                                                    field.onChange(false);
                                                                    handleRadioButtonChange(value);
                                                                }}
                                                                checked={field.value === false}
                                                                disabled={!access}
                                                            />
                                                        </>
                                                    )} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {isLateral && (<div className='col-xs-12 col-sm-12 col-md-12'>
                                    <div className='scheme-details-list'>
                                        <div className='list-title d-flex'>
                                        </div>
                                        <div className='list-name'>
                                            <InputText
                                                className="width-100"
                                                name="lateralCredits"
                                                value={lateralCredit || ""}
                                                onChange={(e) => setLateralCredit(parseInt(e.target.value))}
                                                onBlur={handleMinimumCredits}
                                                disabled={!access}
                                            />
                                        </div>
                                    </div>
                                </div>)}
                            </div>
                        </div>

                    </div>
                    <div className='row'>
                        <div className='col-xs-12 col-sm-12 col-md-6'>
                            <div className='row'>
                                <div className='col-xs-12 col-sm-12 col-md-12'>
                                    <div className='scheme-details-list'>
                                        <div className='list-title d-flex'>
                                            <span className='icon-bg icon-bg-lightblue'>
                                                <Icons iconName="programme_state" className="icon-gradient icon-gray" /></span><span>Programme Outcome Status</span>
                                        </div>
                                        <div className='list-name'>
                                            <span>{schemeInfo.poStatus || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default BasicInfo
