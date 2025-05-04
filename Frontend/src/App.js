import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import './Assets/css/common.css';
import './Assets/css/style.css';
import './Assets/css/responsive.css';
import './Assets/css/base-theme.css';
import './Assets/css/regulations.css';
import Header from './Common/Header';
import Footer from './Common/Footer';
import React, { useEffect, useState } from 'react';
import RouteConstruction from './Keycloak/RouteConstruction.js';
import { BrowserRouter as Router } from "react-router-dom";

function App() {

  const [screenHeight, setScreenHeight] = useState(null);
  const [headerHeight, setHeaderHeight] = useState(null);
  const [footerHeight, setFooterHeight] = useState(null);

  const handleResize = () => {
    const headerHeight = document.getElementById('header')?.offsetHeight;
    const footerHeight = document.getElementById('footer')?.offsetHeight;
    const bodyHeight = window.innerHeight - (headerHeight - footerHeight) + 8;
    setScreenHeight(bodyHeight);
    setHeaderHeight(headerHeight);
    setFooterHeight(footerHeight);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      return window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Router basename={process.env.PUBLIC_URL} >
      <div className="App">
        <Header />
        <div className="section" id="section" style={{ 'minHeight': screenHeight, 'paddingTop': (headerHeight + 15) }} >
          {<RouteConstruction />}
        </div>
        <Footer />
      </div>
    </Router>
  );

}

export default App;