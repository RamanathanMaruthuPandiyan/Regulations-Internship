import React from "react";
import DateTimePicker from 'react-datetime-picker';
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import '../Assets/css/components/datePicker.css';

const DateTimeCalendar = (props) => {

    return (
        <>
            <DateTimePicker
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

export default DateTimeCalendar;