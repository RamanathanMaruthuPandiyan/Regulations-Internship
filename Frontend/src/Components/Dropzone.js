import React from 'react';
import Icons from './Icons';
import '../Assets/css/components/dropzone.css';

const Dropzone = (props) => {
    const rejectedFileSize = (rejectedSizeInBytes) => {
        let rejectedFile = rejectedSizeInBytes.match(/\d/g);
        rejectedFile = rejectedFile.join("");
        return (rejectedFile / (1024 * 1024)).toFixed(2);
    };

    const handleRemoveFile = (fileToRemove) => {
        if (typeof props.onFileRemove === 'function') {
            props.onFileRemove(fileToRemove);
        }
    };

    const acceptedFileItems = props.uploadedFiles.map((file, index) => (
        <div className='success-container' key={file.name}>
            <p className='mb-0'>{file.name}
                <button className='remove-btn' onClick={() => handleRemoveFile(file.name)}>
                    <Icons iconName="delete" className="icon-20 remove-icon me-1" />
                </button>
            </p>
        </div>
    ));

    const fileRejectionItems = props.fileRejections.map(({ file, errors }) => (
        <div className='failure-container' key={file.path}>
            {file.path}
            {errors.map((e, index) => (
                <p className='mb-0' key={index}>file is larger than {rejectedFileSize(e.message)} MB</p>
            ))}
        </div>
    ));

    return (
        <section className="container container-dropzone">
            <div {...props.getRootProps}>
                <button className={props.btnClassName}>
                    <div className='d-flex align-items-center'>
                        <Icons iconName="Select_file" className="icon-16 me-1" />
                        <span>{props.buttonText}</span>
                    </div>
                </button>
                <input {...props.getInputProps()} />
                <p>Drag and drop a file here</p>
            </div>
            <aside>
                <ul className="list-group-item">
                    {acceptedFileItems.length > 0 && (
                        <li className={props.acceptedFileClassName}>
                            {acceptedFileItems}
                        </li>
                    )}
                </ul>
                <ul className='list-group-item'>
                    <li className={props.rejectedFileClassName}>
                        {fileRejectionItems}
                    </li>
                </ul>
            </aside>
        </section>
    );
};

export default Dropzone;
