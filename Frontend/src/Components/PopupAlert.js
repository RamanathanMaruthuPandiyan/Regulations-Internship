import React, { useEffect } from "react";

// import Success from '../Assets/images/alert-success.svg';
// import Error from '../Assets/images/alert-danger.svg';
// import Warning from '../Assets/images/alert-warning.svg';
// import Info from '../Assets/images/alert-info.svg';
// import WhiteSuccess from '../Assets/images/white-success.svg';
// import BlackWarning from '../Assets/images/black-danger.svg';
// import WhiteWarning from '../Assets/images/white-danger.svg';
// import WhiteInfo from '../Assets/images/white-info.svg';
// import SuccessRadius from '../Assets/images/success-radius.svg';
// import WarningRadius from '../Assets/images/warning-radius.svg';
// import DangerRadius from '../Assets/images/danger-radius.svg';
import InfoRadius from '../Assets/images/info-radius.svg';

const PopupAlert = (props) => {

    useEffect(() => {
        getIconType();
    }, [])

    const getIconType = ((iconType) => {

        switch (iconType) {
            // case "success":
            //     return WhiteSuccess
            // case "warning":
            //     return BlackWarning
            // case "danger":
            //     return WhiteWarning
            // case "primary":
            //     return WhiteInfo
            // case "outline-success":
            //     return Success
            // case "outline-warning":
            //     return Warning
            // case "outline-danger":
            //     return Error
            // case "outline-primary":
            //     return Info
            // case "light-success":
            //     return SuccessRadius
            // case "light-warning":
            //     return WarningRadius
            // case "light-danger":
            //     return DangerRadius
            case "light-primary":
                return InfoRadius
            default:
                return " "
        }
    })
    const getStyle = ((props) => {

        let result = "alert-ab-" + (props.style ?? "")
        result += (props.outline ? `-${props.outline}` : "")
        return result
    })

    return (
        <div>
            {
                props.alertShow ?
                    <div className={"alert d-flex alert-ab alert-dismissible fade show " + getStyle(props)} role="alert">
                        <div className='me-2'>
                            <img src={getIconType(props.style)} />
                        </div>
                        <div>
                            {
                                props.outline ? (
                                    <p className={'alert-header mb-1 text-' + props.style}> {props.title}</p>
                                ) : (
                                    <p className='alert-header mb-1'> {props.title}</p>
                                )
                            }
                            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    </div>
                    : ""
            }
        </div >
    )
};

export default PopupAlert;