import React from "react";
import '../Assets/css/components/switch.css';

const Switch = (props) => {

    return (
        <label className={props.className}>
            <input type="checkbox" id={props.id} defaultChecked={props.defaultChecked} />
            <div className={"switch-slider switch-" + props.switchClassName}>
                <span className="on">{props.startText}</span>
                <span className="off">{props.endText}</span>
            </div>
        </label>
    )
};

export default Switch;