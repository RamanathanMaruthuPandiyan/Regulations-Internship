import React, { useState, useEffect } from "react";
import ProgrammeOutcome from './ProgrammeOutcome';
import ProgrammeSpecificObjective from './ProgrammeSpecificObjective';
import ProgrammeEducationalObjective from './ProgrammeEducationalObjective';
import ProgrammeOutcomeDescription from "./ProgrammeOutcomeDescription";
import ProgrammeSpecificObjectiveDescription from "./ProgrammeSpecificObjectiveDescription";
import ProgrammeEducationDescription from "./ProgrammeEducationDescription"
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import Icons from "../../../../../Components/Icons";
import create from '../../../../../Assets/images/obe-addfiles.svg';
import CardFooter from "../CardFooter";
import { getData, putData } from '../../../../../Services/ApiServices';
import PoMappingDetails from "./PoMapping/PoMappingDetails";
import PoMappingApproval from "./PoMapping/PoMappingApproval";
import { useAppContext as useKeycloakContext } from '../../../../../Keycloak/InitiateKeycloak';

const ProgramOutcome = ({ activeStep, setActiveStep, prgmRegId, callAlertMsg, setLoading }) => {

    const { handleSubmit: poHandleSubmit, control: poControl, formState: { errors: poErrors }, reset: poReset, setValue: setPoValue } = useForm({
        defaultValues: {
            ProgrammeOutcome: [{ description: '' }]
        }
    });

    const { fields: poFields, append: poAppend, remove: poRemove } = useFieldArray({
        control: poControl,
        name: "ProgrammeOutcome"
    });

    const { handleSubmit: psoHandleSubmit, control: psoControl, formState: { errors: psoErrors }, reset: psoReset, setValue: setPsoValue } = useForm({
        defaultValues: {
            ProgrammeSpecificObjective: [{ description: '' }]
        }
    });

    const { fields: psoFields, append: psoAppend, remove: psoRemove } = useFieldArray({
        control: psoControl,
        name: "ProgrammeSpecificObjective"
    });

    const { handleSubmit: peoHandleSubmit, control: peoControl, formState: { errors: peoErrors }, reset: peoReset, setValue: setPeoValue } = useForm({
        defaultValues: {
            ProgrammeEducationalObjective: [{ description: '' }]
        }
    });

    const { fields: peoFields, append: peoAppend, remove: peoRemove } = useFieldArray({
        control: peoControl,
        name: "ProgrammeEducationalObjective"
    });


    const [showOutCome, setShowOutCome] = useState(false);
    const [showSpecificObjective, setShowSpecificObjective] = useState(false);
    const [showEducationalObjective, setShowEducationalObjective] = useState(false);

    const [showOutComeDesc, setShowOutComeDesc] = useState(false);
    const [showSpecificObjectiveDesc, setShowSpecificObjectiveDesc] = useState(false);
    const [showEducationalObjectiveDesc, setShowEducationalObjectiveDesc] = useState(false);

    const [showOutComeProfile, setShowOutComeProfile] = useState(true);
    const [showObjectiveProfile, setShowObjectiveProfile] = useState(true);
    const [showEducationalProfile, setShowEducationalProfile] = useState(true);

    const [poResult, setPoResult] = useState([]);
    const [psoResult, setPsoResult] = useState([]);
    const [peoResult, setPeoResult] = useState([]);

    const [status, setStatus] = useState(null);
    const [mappingEnums, setMappingEnums] = useState()
    const [actionItemData, setActionItemData] = useState()
    const [actionItem, setActionItem] = useState()

    const [reason, setReason] = useState();
    const { keycloak } = useKeycloakContext();

    const [poMapDetails, setPoMapDetails] = useState(true);

    const handlePoSubmit = async (data) => {
        setLoading(true);
        try {
            const url = 'programme/regulations/outcomes';
            const outcomeDescriptions = data.ProgrammeOutcome.map(item => item.description);
            const result = await putData(url, { programmeOutcomes: outcomeDescriptions, id: prgmRegId });
            setShowOutComeDesc(true);
            setShowOutCome(false);
            setLoading(false);
            callAlertMsg(result, 'success');
            getPO();
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error')
        }
    };

    const handlePsoSubmit = async (data) => {
        setLoading(true);
        try {
            const url = 'programme/regulations/specific/objectives';
            const outcomeDescriptions = data.ProgrammeSpecificObjective.map(item => item.description);
            const result = await putData(url, { specificObjectives: outcomeDescriptions, id: prgmRegId });
            setShowSpecificObjectiveDesc(true);
            setShowSpecificObjective(false);
            setLoading(false);
            callAlertMsg(result, 'success');
            getPSO();
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error')
        }
    }

    const handlePeoSubmit = async (data) => {
        setLoading(true);
        try {
            const url = 'programme/regulations/educational/objectives';
            const outcomeDescriptions = data.ProgrammeEducationalObjective.map(item => item.description);
            const result = await putData(url, { educationalObjectives: outcomeDescriptions, id: prgmRegId });
            setShowEducationalObjectiveDesc(true);
            setShowEducationalObjective(false);
            setLoading(false);
            callAlertMsg(result, 'success');
            getPEO();
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error')
        }
    }

    const handleStepClick = (index) => {
        handlePoClose();
        handlePsoClose();
        handlePeoClose();
        setActiveStep(index);
    };

    const getPO = async () => {
        setLoading(true);
        const url = `programme/regulations/outcomes/${prgmRegId}`;
        try {
            const result = await getData(url);
            setReason(result.reason)
            setPoResult(result.po);
            setStatus(result?.poStatus)
            if (result?.po && Object.keys(result.po).length > 0) {
                setShowOutComeDesc(true);
                const formattedResult = Object.entries(result.po).map(([key, value]) => ({ key, description: value }));
                setPoValue("ProgrammeOutcome", formattedResult);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };


    const getPSO = async () => {
        setLoading(true);
        const url = `programme/regulations/specific/objectives/${prgmRegId}`;
        try {
            const result = await getData(url);
            setPsoResult(result);
            if (Object.keys(result)?.length > 0) {
                setShowSpecificObjectiveDesc(true);

                const formattedResult = Object.values(result).map(description => ({ description }));
                setPsoValue("ProgrammeSpecificObjective", formattedResult);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    const getPEO = async () => {
        setLoading(true);
        const url = `programme/regulations/educational/objectives/${prgmRegId}`;
        try {
            const result = await getData(url);
            setPeoResult(result);
            if (Object.keys(result)?.length > 0) {
                setShowEducationalObjectiveDesc(true);

                const formattedResult = Object.values(result).map(description => ({ description }));
                setPeoValue("ProgrammeEducationalObjective", formattedResult);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    const actionItems = async () => {
        setLoading(true);
        const url = `programme/regulations/po/action/items/${prgmRegId}`;
        try {
            const result = await getData(url);
            setActionItem(result)
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    const getEnums = async () => {
        setLoading(true);
        const url = 'enums/mapping';
        try {
            const enums = await getData(url);
            setMappingEnums(enums);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    const getEnumActionItems = async () => {
        setLoading(true);
        const url = `enums/actionItems`;
        try {
            const actionItemEnums = await getData(url);
            setActionItemData(actionItemEnums);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };


    const getCardData = () => {
        getPO();
        getPSO();
        getPEO();
        actionItems();
        getEnums();
        getEnumActionItems();

    }

    useEffect(() => {
        getCardData();
    }, [activeStep])

    const handlePoClose = () => {
        if (Object.keys(poResult).length != 0) {
            setShowOutCome(false);
            setShowOutComeDesc(true);
        } else {
            poReset();
            setShowOutCome(false);
            setShowOutComeProfile(true);
        }
    }

    const handlePeoClose = () => {
        if (Object.keys(peoResult).length != 0) {
            setShowEducationalObjectiveDesc(true);
            setShowEducationalObjective(false);
        } else {
            peoReset(); setShowEducationalObjective(false); setShowEducationalProfile(true);
        }
    }

    const handlePsoClose = () => {
        if (Object.keys(psoResult).length != 0) {
            setShowSpecificObjective(false);
            setShowSpecificObjectiveDesc(true);
        } else {
            psoReset(); setShowSpecificObjective(false); setShowObjectiveProfile(true);
        }
    }

    return (
        <>

            <div className="card-body outcome-card-body p-0">
                <div className="stepper">
                    <div
                        className={`sub-step ${activeStep === 0 ? 'active' : ''}`}
                        onClick={() => handleStepClick(0)}
                    >
                        Programme Outcome (PO) {showOutComeDesc && (<span className="green-dot"></span>)}
                    </div>
                    <div
                        className={`sub-step ${activeStep === 1 ? 'active' : ''}`}
                        onClick={() => handleStepClick(1)}
                    >
                        Programme Specific Objective (PSO) {showSpecificObjectiveDesc && (<span className="green-dot"></span>)}
                    </div>
                    <div
                        className={`sub-step ${activeStep === 2 ? 'active' : ''}`}
                        onClick={() => handleStepClick(2)}
                    >
                        Programme Educational Objective (PEO) {showEducationalObjectiveDesc && (<span className="green-dot"></span>)}
                    </div>
                    {/* <div
                        className={`sub-step ${activeStep === 3 ? 'active' : ''}`}
                        onClick={() => handleStepClick(3)}
                    >
                        PO & PEO Mapping {!poMapDetails && (<span className="green-dot"></span>)}
                    </div> */}
                </div>

                <div className="step-content border-top pt-5 pb-4">
                    {activeStep === 0 && (
                        <form onSubmit={poHandleSubmit(handlePoSubmit)}>
                            {poFields.map((field, index) => (
                                <div key={field.id}>
                                    <ProgrammeOutcome
                                        showOutCome={showOutCome}
                                        control={poControl}
                                        errors={poErrors}
                                        index={index}
                                        remove={poRemove}
                                    />
                                </div>
                            ))}
                            {showOutCome && (
                                <>
                                    <div className="col-md-9 text-end mx-auto my-4">
                                        <a className='add-outcome-btn' onClick={() => poAppend({ description: '' })}>
                                            <span><Icons iconName="add" className="icon-12 icon-info me-1" />Add another PO</span>
                                        </a>
                                    </div>
                                </>
                            )}

                            {showOutComeProfile && Object.keys(poResult).length == 0 && (
                                <div className='col-md-3 mx-auto'>
                                    <div className='no-record'>
                                        <img src={create} alt="No record found" />
                                    </div>
                                    <div className="card-subtitle">
                                        Please Create Programme Out come!
                                    </div>
                                    {(keycloak.principal.userActionItems.has("programmeOutcome") && actionItem?.includes(actionItemData?.action?.EDIT)) && <div className="text-center">
                                        <button type="button" className="btn btn-sm btn-primary mt-2" onClick={() => { setShowOutCome(true); setShowOutComeProfile(false) }} >
                                            <span className="me-2">
                                                <Icons iconName="add" className="icon-12 icon-white" />
                                            </span>
                                            <span className="align-middle">Create PO</span>
                                        </button>
                                    </div>}
                                </div>
                            )}

                            {showOutComeDesc && (
                                <ProgrammeOutcomeDescription setShowOutCome={setShowOutCome} setShowOutComeDesc={setShowOutComeDesc} poResult={poResult} status={status} mappingEnums={mappingEnums} reason={reason} actionItemData={actionItemData} actionItem={actionItem} />
                            )}

                        </form>
                    )}

                    {activeStep === 1 &&
                        <form onSubmit={psoHandleSubmit(handlePsoSubmit)}>
                            {psoFields.map((field, index) => (
                                <div key={field.id}>
                                    <ProgrammeSpecificObjective
                                        showSpecificObjective={showSpecificObjective}
                                        control={psoControl}
                                        errors={psoErrors}
                                        index={index}
                                        remove={psoRemove}
                                    />
                                </div>
                            ))}
                            {showSpecificObjective && (
                                <>
                                    <div className="col-md-9 text-end mx-auto my-4">
                                        <a className='add-outcome-btn' onClick={() => psoAppend({ description: '' })}>
                                            <Icons iconName="add" className="icon-12 icon-info me-1" />
                                            Add another PSO
                                        </a>
                                    </div>
                                </>
                            )}

                            {showObjectiveProfile && Object.keys(psoResult).length == 0 && (
                                <div className='col-md-3 mx-auto'>
                                    <div className='no-record'>
                                        <img src={create} alt="No record found" />
                                    </div>
                                    <div className="card-subtitle">
                                        Please Create Programme Specific Objective!
                                    </div>
                                    {(keycloak.principal.userActionItems.has("programmeOutcome") && actionItem?.includes(actionItemData?.action?.EDIT)) && <div className="text-center">
                                        <button type="button" className="btn btn-sm btn-primary mt-2" onClick={() => { setShowObjectiveProfile(false); setShowSpecificObjective(true) }} >
                                            <span className="me-2">
                                                <Icons iconName="add" className="icon-12 icon-white" />
                                            </span>
                                            <span className="align-middle">Create PSO</span>
                                        </button>
                                    </div>}
                                </div>
                            )}

                            {showSpecificObjectiveDesc && (
                                <ProgrammeSpecificObjectiveDescription setShowSpecificObjective={setShowSpecificObjective}
                                    setShowSpecificObjectiveDesc={setShowSpecificObjectiveDesc} psoResult={psoResult} status={status}
                                    mappingEnums={mappingEnums} reason={reason} actionItemData={actionItemData} actionItem={actionItem} />
                            )}

                        </form>
                    }

                    {activeStep === 2 &&
                        <form onSubmit={peoHandleSubmit(handlePeoSubmit)}>
                            {peoFields.map((field, index) => (
                                <div key={field.id}>
                                    <ProgrammeEducationalObjective
                                        showEducationalObjective={showEducationalObjective}
                                        control={peoControl}
                                        errors={peoErrors}
                                        index={index}
                                        remove={peoRemove}
                                    />
                                </div>
                            ))}
                            {showEducationalObjective && (
                                <>
                                    <div className="col-md-9 text-end mx-auto my-4">
                                        <a className='add-outcome-btn' onClick={() => peoAppend({ description: '' })}>
                                            <Icons iconName="add" className="icon-12 icon-info me-1" />
                                            Add another PEO
                                        </a>
                                    </div>
                                </>
                            )}

                            {showEducationalProfile && Object.keys(peoResult).length == 0 && (
                                <div className='col-md-3 mx-auto'>
                                    <div className='no-record'>
                                        <img src={create} alt="No record found" />
                                    </div>
                                    <div className="card-subtitle">
                                        Please Create Programme Educational Objective!
                                    </div>
                                    {(keycloak.principal.userActionItems.has("programmeOutcome") && actionItem?.includes(actionItemData?.action?.EDIT)) && <div className="text-center">
                                        <button type="button" className="btn btn-sm btn-primary mt-2" onClick={() => { setShowEducationalProfile(false); setShowEducationalObjective(true) }} >
                                            <span className="me-2">
                                                <Icons iconName="add" className="icon-12 icon-white" />
                                            </span>
                                            <span className="align-middle">Create PEO</span>
                                        </button>
                                    </div>}
                                </div>
                            )}

                            {showEducationalObjectiveDesc && (
                                <ProgrammeEducationDescription setShowEducationalObjective={setShowEducationalObjective} setShowEducationalObjectiveDesc={setShowEducationalObjectiveDesc}
                                    peoResult={peoResult} prgmRegId={prgmRegId} callAlertMsg={callAlertMsg} setLoading={setLoading} status={status} mappingEnums={mappingEnums}
                                    getCardData={getCardData} reason={reason} actionItemData={actionItemData} actionItem={actionItem} />
                            )}

                        </form>
                    }

                    {/* {activeStep === 3 && (
                        <>
                            {!poMapDetails &&
                                <PoMappingApproval setPoMapDetails={setPoMapDetails} />
                            }
                            {poMapDetails &&
                                <PoMappingDetails />
                            }
                        </>
                    )} */}
                </div>
            </div>
            <div >

                {showOutCome && activeStep === 0 && (
                    <CardFooter
                        close={true}
                        onClose={handlePoClose}
                        onSubmit={poHandleSubmit(handlePoSubmit)}
                    />
                )}

                {showSpecificObjective && activeStep === 1 && (
                    <CardFooter
                        close={true}
                        onClose={handlePsoClose}
                        onSubmit={psoHandleSubmit(handlePsoSubmit)}
                    />
                )}

                {showEducationalObjective && activeStep === 2 && (
                    <CardFooter
                        close={true}
                        onClose={handlePeoClose}
                        onSubmit={peoHandleSubmit(handlePeoSubmit)}
                    />
                )}

                {!poMapDetails && activeStep === 3 && (
                    <CardFooter close={true}  onClose={() => { setPoMapDetails(true); }} />
                )}

                {showOutComeDesc && activeStep === 0 && (
                    <div className="card-footer">
                        <div className='col-md-12 text-end'>
                            <button type="submit" className="btn btn-primary px-5 my-2" onClick={() => { setActiveStep(1) }}>Next</button>
                        </div>
                    </div>
                )}

                {showSpecificObjectiveDesc && activeStep === 1 && (
                    <div className="card-footer">
                        <div className='col-md-12 text-end'>
                            <button type="submit" className="btn btn-primary px-5 my-2" onClick={() => { setActiveStep(2) }}>Next</button>
                        </div>
                    </div>
                )}
                {/*
                {showEducationalObjectiveDesc && activeStep === 2 && (
                    <div className="card-footer">
                        <div className='col-md-12 text-end'>
                            <button type="submit" className="btn btn-primary px-5 my-2" onClick={() => { setActiveStep(2) }}>Next</button>
                        </div>
                    </div>
                )}

                {poMapDetails && activeStep === 3 && (
                    <div className="card-footer">
                        <div className='col-md-12 text-end'>
                            <button type="submit" className="btn btn-primary px-5 my-2" onClick={() => { setPoMapDetails(false) }}>Next</button>
                        </div>
                    </div>
                )} */}

            </div>
        </>
    );
}

export default ProgramOutcome;
