import React, { useEffect, useState } from 'react';
import Icons from '../../../Components/Icons';
import InputText from '../../../Components/InputText';
import { putData } from '../../../Services/ApiServices';
import { useAppContext } from '../Context/Context';

const VerticalNames = ({ schemeInfo, access }) => {

    const { setLoading, callAlertMsg, programId, regulationId, getFetchAddData, coursesPagination } = useAppContext();

    const [verticalName, setVerticalName] = useState();
    const [verticalNames, setVerticalNames] = useState([]);
    let newVerticalArray = [];


    //Api Vertical Name
    const submitFunction = async (data, remove) => {
        const url = "programme/regulations/verticals";
        try {
            const response = await putData(url, { ...data });
            setLoading(false);
            setVerticalNames(newVerticalArray);

            if (remove) {
                callAlertMsg('Vertical have been removed successfully', 'success');
            } else {
                callAlertMsg(response, 'success');
            }
            setVerticalName('');
            getFetchAddData();
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    }

    //Submit Vertical Name
    const handleSubmit = (event) => {
        event.preventDefault();
        if (verticalName && verticalName.trim()) {
            setLoading(true);
            const hasSpecialCharacters = /[^a-zA-Z &-]/.test(verticalName);
            if (hasSpecialCharacters) {
                setLoading(false);
                callAlertMsg('Special characters and numbers are not allowed.', 'error');
            } else {
                newVerticalArray = verticalNames?.length ? [...verticalNames, verticalName] : [verticalName];
                const data = {
                    regulationId: regulationId,
                    prgmId: programId,
                    verticals: newVerticalArray
                }
                submitFunction(data)
            }
        }
    }

    const handleRemove = (index) => {
        setLoading(true);
        newVerticalArray = [...verticalNames];
        newVerticalArray.splice(index, 1);
        const data = {
            regulationId: regulationId,
            prgmId: programId,
            verticals: newVerticalArray
        }
        submitFunction(data, true)
    }

    useEffect(() => {
        setVerticalNames(schemeInfo.verticals);
    }, [schemeInfo]);

    useEffect(() => {
        coursesPagination();
    }, [verticalNames]);

    return (
        <div>
            <div className='standard-accordion'>
                <div className="accordion" id="accordionExample1">
                    <div className="accordion-item">
                        <h2 className="accordion-header position-relative">
                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#vertical" aria-expanded="true" aria-controls="vertical">
                                <span className='icon-bg sem-span-icon'>
                                    <Icons iconName="vertical_details" className='semester-icon icon-gradient' /></span> Vertical Names
                            </button>
                        </h2>
                        <div id="vertical" className="accordion-collapse collapse">
                            <div className="accordion-body pt-0">
                                <div className='row mt-3'>
                                    <div className='col-md-3 mb-3'>
                                        <form onSubmit={handleSubmit}>
                                            <InputText
                                                className="form-control vertical-input"
                                                placeholder="Add Vertical"
                                                name="vertical"
                                                id="vertical"
                                                value={verticalName || ''}
                                                onChange={(e) => setVerticalName(e.target.value.toUpperCase())}
                                                disabled={!access}
                                                autocomplete="off"
                                            />
                                        </form>
                                    </div>
                                    {verticalNames &&
                                        verticalNames.map((item, key) => (
                                            <div className='col-md-3 vertical-box mb-3' key={key}>
                                                <div className='vertical-input-card'>
                                                    <div className='vertical-input-div'>{item}</div>
                                                    {access && <a className='vertical-input-close' onClick={(e) => handleRemove(key)}>
                                                        <Icons iconName="modelclose" className="icon-16 icon-primary" />
                                                    </a>}
                                                </div>
                                            </div>
                                        ))
                                    }

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VerticalNames