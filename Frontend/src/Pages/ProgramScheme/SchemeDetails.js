import React from 'react';
import Index from './Components/Index';
import { AppProvider } from './Context/Context';

const SchemeDetails = (props) => {
  return (
    <AppProvider>
        <Index {...props} />
    </AppProvider>
  )
}

export default SchemeDetails;