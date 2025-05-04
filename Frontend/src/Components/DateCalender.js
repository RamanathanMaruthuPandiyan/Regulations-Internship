import React from "react";
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import '../Assets/css/components/datePicker.css';

const DateCalendar = (props) => {

    return (
        <>
            <DatePicker
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

export default DateCalendar;