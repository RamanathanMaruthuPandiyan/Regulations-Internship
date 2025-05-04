import React, { useState, useEffect } from "react";
import Icons from '../Components/Icons';
import '../Assets/css/components/alerts.css';

const Alert = (props) => {

    const [alert, setAlert] = useState(true);

    useEffect(() => {
        getIconType();
    }, [])

    const getIconType = ((iconType) => {

        switch (iconType) {
            case "success":
            case "success-light":
                return 'success'
            case "warning":
            case "warning-light":
                return 'warningmessage'
            case "danger":
            case "danger-light":
                return "errormessage"
            case "primary":
            case "primary-light":
                return "hintmessage"
            case "alert-ab-light-success":
                return "thankyou"
            case "alert-ab-light-warning":
                return "warning2radius"
            case "alert-ab-light-danger":
                return "warningnew"
            case "alert-ab-light-info":
                return "thankyou"
            case "alert-ab-success":
                return "success"
            case "alert-ab-warning":
                return "warningtriangle"
            case "alert-ab-danger":
                return "warningtriangle"
            case "alert-ab-info":
                return "infocircle2"
            default:
                return " "
        }
    })

    const closeAlert = () => {
        //This is the functional setState
        setAlert(false)
    }


    return (
        <div>

            {
                props.alertShow ?
                    <div className={"alert d-flex alert-" + props.style + ' ' + props.className} role="alert">
                        <div className='me-2'>
                            <Icons iconName={getIconType(props.style)} className={props.iconClassName} />
                        </div>
                        <div>
                            <p className='alert-header'> {props.title}</p>
                            <p className='alert-description d-flex'>
                                <span className="text-break" dangerouslySetInnerHTML={{ __html: props.message }} />
                            </p>

                            {
                                props.buttonShow == true ?
                                    <button className={"mt-3 btn btn-" + props.color} onClick={props.onClick} >
                                        <Icons iconName={props.downIcon} className="pt-1" /> {props.downloadButtonText}
                                    </button> : ""
                            }
                            {
                                props.alertClose == true ?
                                    <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => closeAlert()}></button>
                                    : ""
                            }
                        </div>

                    </div>

                    : ""
            }
        </div>
    )
};

export default Alert;