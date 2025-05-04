import React from "react";

const CheckBox = (props) => {

    return (
        <div className={"form-check " + props.className}>
            <input className="form-check-input" type="checkbox" defaultChecked={props.defaultChecked} onChange={props.onChange} checked={props.checked} name={props.name} id={props.id} value={props.value} disabled={props.disabled} />
            <label className="form-check-label" htmlFor={props.id}>{props.labelText} </label>
        </div>
    )
}

export default CheckBox;