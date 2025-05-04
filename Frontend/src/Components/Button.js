import React from "react";
import Icons from "./Icons";

const Button = (props) => {

    return (
        <button className={"btn " + props.buttonStyle} onClick={props.onClick} disabled={props.disabled} >
            {props.iconName ?
                <>
                    <Icons iconName={props.iconName} className={props.iconClassName} />
                    {props.buttonText}
                </> :
                props.buttonText
            }

        </button>
    )
}

export default Button;