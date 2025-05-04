import React from "react";
import { WithContext as ReactTags } from 'react-tag-input';
import '../Assets/css/components/inputTags.css';

const InputTag = (props) => {

    return (
        <>
            <ReactTags
                tags={props.tags}
                delimiters={props.delimiters}
                suggestions={props.suggestions}
                handleDelete={props.handleDelete}
                handleAddition={props.handleAddition}
                handleDrag={props.handleDrag}
                handleTagClick={props.handleTagClick}
                inputFieldPosition={props.inputFieldPosition}
                placeholder="Add New Tag"
                editable
                autofocus={props.autofocus}
                maxTags={props.maxTags}
                inputProps={{
                    disabled: props.disabled
                }}
            />
        </>
    )
}

export default InputTag;