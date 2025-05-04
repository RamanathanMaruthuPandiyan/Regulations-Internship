import React from "react";

const InputText = (props) => {

    return (
        <>
            <input
                type={props.type || "text"}
                value={props.value}
                id={props.id}
                name={props.name}
                className={'form-control ' + props.className}
                placeholder={props.placeholder}
                onChange={props.onChange}
                onBlur={props.onBlur}
                onWheel={(props.type == 'number') ? (e) => e.target.blur() : null}
                disabled={props.disabled}
                readOnly={props.readOnly}
                step={"any"}
                autocomplete={props.autocomplete}
            />
        </>
    );
};

export default InputText;