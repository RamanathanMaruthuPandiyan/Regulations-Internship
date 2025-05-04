import React from "react";

const RadioButton = (props) => {

    return (
        <div className={"form-check " + props.className}>
            <input
                type="radio"
                className="form-check-input"
                id={props.id}
                name={props.name}
                value={props.value}
                disabled={props.disabled}
                checked={props.checked}
                onChange={props.onChange}
                defaultChecked={props.defaultChecked}
            />
            <label className="form-check-label">{props.labelText}</label>
        </div>
    )
}

export default RadioButton;