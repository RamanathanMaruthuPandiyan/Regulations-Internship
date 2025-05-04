import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Breadcrumbs = ({first, second}) => {
  const [height, setHeight] = useState('');

  useEffect(() => {
    const headerHeight = document.getElementById('header').offsetHeight;
    setHeight(headerHeight);
  }, []) 

  // return (
  //   <div className="breadcrumbs-section px-3" style={{'top' : height}}>
  //     <div className="w-100 d-flex justify-content-between align-items-center">
  //       <div className="title-modal-name text-uppercase">
  //         <span> ADMISSIONS MODULE </span>
  //       </div>
  //       <div className="breadcrumbs">
  //           <Link className="breadcrumbs-link active" to="/">Dashboard</Link>
  //           {first ?  <Link className="breadcrumbs-link" to={`/${first.link}`}>{first.name}</Link> : ''}
  //           {second ?  <Link className="breadcrumbs-link" to={`/${second.link}`}>{second.name}</Link> : ''}
  //       </div>
  //     </div>
  //   </div>
  // )
}

export default Breadcrumbs;