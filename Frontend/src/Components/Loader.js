import React from 'react';
import LoaderSvg from '../Assets/images/rings.svg';

function Loader({loading}) {
    return (
       <>
        {loading && 
            <div className="loader-container">
            <div className="loader">
                <img src={LoaderSvg} width="60px" />
            </div>
            </div>
        }
       </>
    )
}

export default Loader;