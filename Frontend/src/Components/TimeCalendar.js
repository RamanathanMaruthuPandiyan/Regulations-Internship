import React from "react";
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import '../Assets/css/components/datePicker.css';

const TimeCalendar = (props) => {

    return (
        <>
            <TimePicker
                name={props.name}
                onChange={props.onChange}
                className="form-control"
                returnValue={props.returnValue}
                startDate={props.startDate}
                disableCalendar={props.disableCalendar}
                disabled={props.disabled}
                format={props.format}
                id={props.id}
                maxDate={props.maxDate}
                minDate={props.minDate}
                value={props.value}
            />
        </>
    );
}

export default TimeCalendar;