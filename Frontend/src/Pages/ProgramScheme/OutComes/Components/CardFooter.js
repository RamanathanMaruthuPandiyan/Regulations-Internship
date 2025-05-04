import React from 'react'

const CardFooter = ({ onClose, onSubmit,close }) => (
    <div className="card-footer">
        <div className='col-12 d-flex justify-content-end my-2 px-4'>
            {close==true && <button type="button" className="btn btn-cancel px-5 me-3" onClick={onClose}>Close</button>}
            <button type="submit" className="btn btn-primary px-5" onClick={onSubmit}>Save</button>
        </div>
    </div>
);


export default CardFooter