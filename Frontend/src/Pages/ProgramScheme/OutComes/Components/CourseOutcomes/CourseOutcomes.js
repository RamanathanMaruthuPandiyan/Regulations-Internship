import React, { useState, useParams, useEffect } from 'react'
import Icons from '../../../../../Components/Icons'
import CourseOutcomeCard from './CourseOutcomeCard';
import CoDescription from './CoDescription';
import CoPoMappingDetails from './CoPoMappingDetails';
import CoPoMappingApproval from './CoPoMappingApproval';
import ConfirmedCourseList from './ConfirmedCourseList';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { getData, putData } from '../../../../../Services/ApiServices';
import CardFooter from '../CardFooter';
import create from '../../../../../Assets/images/course_Out_Come.svg';
import { useAppContext as useKeycloakContext } from '../../../../../Keycloak/InitiateKeycloak';

const CourseOutcomes = ({ setTitle, activeStep, setActiveStep, prgmRegId, callAlertMsg, setLoading }) => {

  const [showOutCome, setShowOutCome] = useState(false);
  const [showOutComeProfile, setShowOutComeProfile] = useState(false);
  const [courseListTable, setCourseListTable] = useState(true);
  const [courseOutComes, setCourseOutComes] = useState(false);
  const [showApprovalPage, setShowApprovalPage] = useState(false);
  const [showCoDescription, setShowCoDescription] = useState(false);
  const [courseId, setCourseId] = useState();
  const [updateco, setUpdateCo] = useState([]);
  const [mappedList, setMappedList] = useState("");
  const [existingDescList, setExistingDescList] = useState([]);
  const [poList, setPoList] = useState([]);
  const [poStatus, setPoStatus] = useState();
  const [coPoMappingDetails, setCoPoMappingDetails] = useState([]);
  const [mappingEnum, setMappingEnum] = useState([""]);
  const [actionItem, setActionItem] = useState();
  const [actionItemData, setActionItemData] = useState()
  const [mappingEnums, setMappingEnums] = useState()
  const [refresh, setRefresh] = useState(0)
  const [status, setStatus] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("");
  const [taxonomies, setTaxonomies] = useState([]);

  const { keycloak } = useKeycloakContext();

  const { handleSubmit: coHandleSubmit, control: coControl, formState: { errors: coErrors }, reset: coReset, setValue: coSetValue } = useForm({
    defaultValues: {
      courseOutcome: [{ description: '' }]
    }
  });

  const { fields: coFields, append: coAppend, remove: coRemove } = useFieldArray({
    control: coControl,
    name: "courseOutcome"
  });

  const handleNextPageClick = () => {
    setCourseListTable(false);
    setCourseOutComes(true);
    setShowCoDescription(true);
  };

  const handleStepClick = (stepIndex) => {
    coReset()
    setShowCoDescription(true);
    setShowOutCome(false);
    getExistingDescriptionList()
    setActiveStep(stepIndex);
  };

  // OnSubmit
  const handleCoSubmit = async (data) => {

    try {
      const url = `courses/outcomes`;
      setLoading(true);
      let weightage = 0;
      data.courseOutcome.map(item => {
        if (item.weightage) {
          weightage += parseFloat(item.weightage.toFixed(2));
        }
      });

      weightage = parseFloat(weightage.toFixed(2));
      if (weightage != 1) {
        callAlertMsg("Total Weightage of course outcomes must be exactly 1", 'error');
        setLoading(false);
        return;
      }
      const result = await putData(url, { courseId: courseId, courseOutcomes: data.courseOutcome });
      setUpdateCo(result);

      setShowCoDescription(true);
      setShowOutCome(false);
      // getExistingDescriptionList();
      callAlertMsg(result, 'success');
      setLoading(false);
      setRefresh(refresh + 1)
    } catch (error) {
      setLoading(false);
      callAlertMsg(error.response.data.message, 'error');
    }

  };

  // GET PO Details
  const getPoDetails = async () => {
    const url = `programme/regulations/outcomes/${prgmRegId}`;
    setLoading(true);
    try {
      const result = await getData(url);
      setPoList(Object.assign({}, result?.po, result?.pso));
      setPoStatus(result?.poStatus);

      let message = ""
      if ("AP" != result?.poStatus)
        message = "Please Approve Programme Outcomes For Mapping!";
      if (!result?.po || !Object.keys(result?.po).length)
        message = "Please Add Programme Outcomes For Mapping!";
      if (!result?.pso || !Object.keys(result?.pso).length)
        message = "Please Add Programme Specific Outcomes For Mapping!";
      setError(message);

      setLoading(false);
    } catch (error) {
      setLoading(false);
      callAlertMsg(error.response.data.message, 'error');
    }
  };




  // GET mapped enums values
  const getMappingEnums = async () => {
    setLoading(true);
    const url = 'enums/mapping';
    try {
      const enums = await getData(url);
      setMappingEnums(enums);
      setMappingEnum(Object.keys(enums.level.values).concat(""));
      if (courseId) {
        getCoPoMappingDetails(Object.keys(enums.level.values).concat(""));
      }
      if (enums?.taxonomy) {
        setTaxonomies(() => Object.entries(enums?.taxonomy.descriptions).map(([value, label]) => ({ label, value })));
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      callAlertMsg(error.response.data.message, 'error');
    }
  };

  // CO PO mapping details
  const coPoMapping = async () => {

    const url = `courses/mapping`;
    try {
      let obj = {}
      Object.keys(mappedList).map((po) => {
        let courseOutcome = {}
        Object.keys(mappedList[po]).map((co) => {
          if (mappedList[po][co] < mappingEnum.length - 1) {
            courseOutcome[co] = mappingEnum[mappedList[po][co]];
          }

          if (Object.keys(courseOutcome).length) {
            obj[po] = courseOutcome;
          }
        })
      })

      const result = await putData(url, { courseId, mapping: obj });
      callAlertMsg(result, 'success');
      getCoPoMappingDetails(mappingEnum);
      setShowOutCome(false)
      setShowApprovalPage(false);
    } catch (error) {
      callAlertMsg(error.response.data.message, 'error');
    }

  };

  // GET Existing Description list
  const getExistingDescriptionList = async () => {

    const url = `courses/outcomes/${courseId}`;
    setLoading(true);
    try {
      const result = await getData(url);
      setTitle(`${result?.name} (${result?.code})`)
      setStatus(result?.status);
      setReason(result?.reason);
      setExistingDescList(result?.co);
      if (Object.keys(result?.co)?.length > 0) {
        Object.entries(result.co).map(([key, value]) => {
          result.co[key] = {
            ...value, taxonomy: value.taxonomy.map((taxonomy) => {
              return taxonomies.find((key) => key.value == taxonomy);
            })
          }
        })
        const formattedResult = Object.values(result?.co);
        coSetValue("courseOutcome", formattedResult);
      }
      else {
        setError("Please Add Course Outcomes For Mapping!")
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      callAlertMsg(error.response.data.message, 'error');
    }

  };

  // GET CO PO Mapping Details
  const getCoPoMappingDetails = async (enums) => {

    const url = `courses/co/po/mapping/${courseId}`;
    setLoading(true);

    try {
      const result = await getData(url);
      let mappedData = {};
      if (!result.length) {
        setShowApprovalPage(true)
      }
      result.map((poMapping) => {
        let poKey = Object.keys(poMapping)[0];
        let courseOutcomes = poMapping.courseOutcome;

        let outcomeMapping = {};

        courseOutcomes.map((outcome) => {
          let coKey = Object.keys(outcome)[0];
          outcomeMapping[coKey] = enums.indexOf(outcome.level);
        });

        mappedData[poKey] = outcomeMapping;
      });

      setMappedList(mappedData);
      setCoPoMappingDetails(result);
      setLoading(false);

    } catch (error) {
      setLoading(false);
      callAlertMsg(error.response.data.message, 'error');
    }

  };

  // CO PO Mapped Page...
  const moveToApprovalPage = () => {
    coPoMapping();
  }

  // Action item api
  const actionItems = async () => {
    setLoading(true);
    const url = `courses/co/action/items/${courseId}`;
    try {
      const result = await getData(url);
      setActionItem(result)
      setLoading(false);
    } catch (error) {
      setLoading(false);
      callAlertMsg(error.response.data.message, 'error');
    }
  }

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

  useEffect(() => {
    getMappingEnums();
    if (courseId && courseOutComes) {
      getExistingDescriptionList();
      getEnumActionItems();
      actionItems();
    }

    if ((courseId !== undefined || null)) {
      getPoDetails();
    }

  }, [courseOutComes, courseId, activeStep, refresh]);

  return (
    <div className="card-body outcome-card-body p-0">

      <div>
        {courseListTable && (
          <ConfirmedCourseList mappingEnums={mappingEnums} setTitle={setTitle} handleNextPageClick={handleNextPageClick} setCourseId={setCourseId} prgmRegId={prgmRegId} />
        )}

        {courseOutComes && (
          <div className='col-md-12'>
            <div className="stepper w-md-100 w-50">
              <div
                className={`sub-step ${activeStep === 0 ? 'active' : ''}`}
                onClick={() => handleStepClick(0)}
              >
                Course Out Come (CO)
              </div>
              <div
                className={`sub-step ${activeStep === 1 ? 'active' : ''}`}
                onClick={() => handleStepClick(1)}
              >
                CO-PO & PSO Mapping
              </div>
            </div>

            <div className="step-content border-top p-5">
              {activeStep === 0 && (
                <form onSubmit={coHandleSubmit(handleCoSubmit)}>
                  {coFields.map((field, index) => (
                    <div key={field.id}>
                      <CourseOutcomeCard
                        setUpdateCo={setUpdateCo}
                        showOutCome={showOutCome}
                        setShowOutCome={setShowOutCome}
                        control={coControl}
                        errors={coErrors}
                        index={index}
                        remove={coRemove}
                        taxonomies={taxonomies}
                      />
                    </div>
                  ))}

                  {showOutCome && (
                    <>
                      <div className="col-md-9 text-end mx-auto my-4">
                        <a className='add-outcome-btn' onClick={() => coAppend({ description: '' })}>
                          <span><Icons iconName="add" className="icon-12 icon-info me-1" />Add another CO</span>
                        </a>
                      </div>
                    </>
                  )}

                  {showCoDescription && (
                    Object.keys(existingDescList).length ? <CoDescription mappingEnums={mappingEnums} status={status} reason={reason} setShowOutCome={setShowOutCome} setShowCoDescription={setShowCoDescription} existingDescList={existingDescList} actionItemData={actionItemData} actionItem={actionItem} getExistingDescriptionList={getExistingDescriptionList}  />
                      : <div className='col-sm-8 col-md-6 mx-auto mt-1 mt-md-0 mt-lg-1 mt-xl-2'>
                        <div className='no-co-record'>
                          <img src={create} alt="No record found" />
                        </div>
                        <div className="card-subtitle border-0">
                          Please Create Course Out come!
                        </div>
                        {(keycloak.principal.userActionItems.has("courseOutcome") && actionItem?.includes(actionItemData?.action?.EDIT)) && <div className="text-center">
                          <button type="button" className="btn btn-sm btn-primary mt-2" onClick={() => { setShowOutCome(true); setShowCoDescription(false) }} >
                            <span className="me-2">
                              <Icons iconName="add" className="icon-12 icon-white" />
                            </span>
                            <span className="align-middle">Create CO</span>
                          </button>
                        </div>}
                      </div>
                  )}

                </form>
              )}

              {activeStep === 1 && (

                error ?
                  (<div className='col-sm-8 col-md-6 mx-auto mt-5'>
                    <div className='no-co-record'>
                      <img src={create} alt="No record found" />
                    </div>
                    <div className="card-subtitle border-0">
                      {error}
                    </div>
                  </div>)
                  : (<div>
                    {showApprovalPage && (
                      <CoPoMappingDetails setMappedList={setMappedList} status={status} mappedList={mappedList}
                        poList={poList} existingDescList={existingDescList} mappingEnum={mappingEnum} mappingEnums={mappingEnums} />
                    )}

                    {!showApprovalPage && (
                      <CoPoMappingApproval setShowApprovalPage={setShowApprovalPage} coPoMappingDetails={coPoMappingDetails}
                        actionItemData={actionItemData} actionItem={actionItem} mappingEnums={mappingEnums} courseId={courseId} callAlertMsg={callAlertMsg}
                        setLoading={setLoading} setRefresh={setRefresh} status={status} reason={reason} />
                    )}
                  </div>))
              }
            </div>
          </div>
        )}
      </div>
      {showOutCome && activeStep === 0 && !courseListTable && (
        <CardFooter
          close={true}
          onClose={() => { setShowCoDescription(true); setShowOutCome(false); coReset() }}
          onSubmit={coHandleSubmit(handleCoSubmit)}
        />
      )}

      {((!(activeStep == 1 && showApprovalPage) || error?.length > 0) && (!courseListTable) && (!showOutCome)) && (
        <div className="card-footer">
          <div className='col-md-12 text-end'>
            <button type="button" className="btn btn-cancel px-5 me-3" onClick={() => { setCourseOutComes(false); setCourseListTable(true); handleStepClick(0); setTitle(null) }}>Close</button>
            {activeStep === 0 && <button type="submit" className="btn btn-primary px-5 my-2" onClick={() => { handleStepClick(1) }}>Next</button>}
          </div>
        </div>
      )
      }

      {
        !error && showApprovalPage && (!courseListTable) && activeStep === 1 && (actionItem?.includes(actionItemData?.action?.EDIT)) && (
          <CardFooter
            close={true}
            onClose={() => {
              if (coPoMappingDetails?.length) {
                setShowApprovalPage(false);
                getCoPoMappingDetails(mappingEnum);
              }
              else {
                setCourseListTable(true);
                setCourseOutComes(false);
                setTitle(null);
              }
            }}
            onSubmit={(moveToApprovalPage)}
          />
        )
      }

    </div >
  )
}

export default CourseOutcomes