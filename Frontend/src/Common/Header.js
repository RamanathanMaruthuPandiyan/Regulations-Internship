import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import Icons from "../Components/Icons";
import { getData } from "../Services/ApiServices";
import Loader from '../Components/Loader';
import { useAlertMsg } from '../Services/AllServices';
import AlertComponent from '../Components/AlertComponent';
import { useAppContext } from '../Keycloak/InitiateKeycloak';

function Header() {

    const location = useLocation();
    const navbarCollapseRef = useRef(null);
    const isDataManage = location.pathname.startsWith('/attributes') || location.pathname.startsWith('/grading') || location.pathname.startsWith('/creditAssignment') || location.pathname.startsWith('/markDistribution') || location.pathname.startsWith('/addDistribution');
    const isRegulationActive = location.pathname.startsWith('/AddRegulation');
    const isProgrammeSchemeActive = location.pathname.startsWith('/schemeDetails') || location.pathname.startsWith('/outcomes');
    const isSetup = ['/jobs', '/users', '/logs'].includes(location.pathname);


    const { keycloak } = useAppContext();


    let [clientInfo, setClientInfo] = useState({});

    //Loader
    const [loading, setLoading] = useState(false);

    //Alert
    const { alert, alertMessage, callAlertMsg } = useAlertMsg();

    // Fetch client info
    const getClientInfo = async () => {
        const url = "branding/client/info";
        try {
            setLoading(true);
            const result = await getData(url);
            setClientInfo(result);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            callAlertMsg(error.response.data.message, 'error');
        }
    };

    useEffect(() => {
        getClientInfo();
    }, []);

    const logout = () => {
        keycloak.logout();
    }

    const handleNavLinkClick = () => {
        if (window.innerWidth < 992 && navbarCollapseRef.current.classList.contains('show')) {
            navbarCollapseRef.current.classList.remove('show');
        }
    };

    useEffect(() => {
        const link = document.querySelectorAll('.navbar .menu-link');

        link.forEach(e => {
            e.addEventListener('click', () => {
                handleNavLinkClick();
            });
        });
    }, [])

    return (
        <header className="header">
            <AlertComponent alertMessage={alertMessage} alert={alert} />
            {/* Loader */}
            <Loader loading={loading} />
            <nav className="navbar navbar-expand-lg bg-header fixed-top" id="header">
                <div className="container-fluid">
                    <a className="navbar-brand" href="/">
                        {/* <img className="logo" src={clientInfo.logoUrl} alt="logo" /> */}
                    </a>
                    <div className='d-flex align-items-center'>
                        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
                            aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div className="collapse navbar-collapse" id="navbarSupportedContent" ref={navbarCollapseRef}>
                            <a className="mobile-menu-close" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent">
                                <Icons iconName="modelclose" className="icon-menu-close" />
                            </a>
                            <ul className="navbar-nav navbar-nav-header mb-2 mb-lg-0">
                                {keycloak.principal.userMenuItems.has("regulations") && <li className="nav-item">
                                    <NavLink className={({ isActive }) => ((isActive || isRegulationActive) ? 'nav-link active menu-link' : 'nav-link menu-link')} to="/regulations" >
                                        {({ isActive }) => (
                                            <>
                                                <Icons iconName={(isActive || isRegulationActive) ? "home-fill" : "home"} className="icon-20 remove-icon" />
                                                Regulations
                                            </>
                                        )}
                                    </NavLink>
                                </li>}
                                {keycloak.principal.userMenuItems.has("programScheme") && <li className="nav-item">
                                    <NavLink className={({ isActive }) => ((isActive || isProgrammeSchemeActive) ? 'nav-link active menu-link' : 'nav-link menu-link')} to="programScheme">
                                        {({ isActive }) => (
                                            <>
                                                <Icons iconName={(isActive || isProgrammeSchemeActive) ? "Programme_scheme_fill" : "Programme_scheme"} className="icon-20 remove-icon" />
                                                Programme Scheme
                                            </>
                                        )}
                                    </NavLink>
                                </li>}
                                {keycloak.principal.userMenuItems.has("regulationMapping") && <li className="nav-item">
                                    <NavLink to="regulationMapping" className={({ isActive }) => (isActive ? 'nav-link active menu-link' : 'nav-link menu-link')}>
                                        {({ isActive }) => (
                                            <>
                                                <Icons iconName={isActive ? "regulations_mapping_fill" : "regulations_mapping"} className="icon-20 remove-icon icon-gray" />
                                                Regulations Mapping
                                            </>
                                        )}
                                    </NavLink>
                                </li>}
                                {keycloak.principal.userMenuItems.has("dataManagement") && <li className={`nav-item dropdown ${isDataManage ? 'active' : ''}`}>
                                    <a className="nav-link dropdown-toggle" href="#/" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <Icons iconName={isDataManage ? "data_ management_fill" : "data_ management"} className="icon-20 remove-icon" />Data Management
                                        <span className="caret"></span>
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                        <li><NavLink className="dropdown-item menu-link" to="attributes">Attributes</NavLink></li>
                                        <li><NavLink className="dropdown-item menu-link" to="grading">Grading</NavLink></li>
                                        <li><NavLink className="dropdown-item menu-link" to="creditAssignment">Credit Assignment</NavLink></li>
                                        <li><NavLink className="dropdown-item menu-link" to="markDistribution">Evaluation Schemes</NavLink></li>
                                    </ul>
                                </li>}
                                {keycloak.principal.userMenuItems.has("setup") && <li className={`nav-item dropdown ${isSetup ? 'active' : ''}`}>
                                    <a className="nav-link dropdown-toggle" href="#/" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <Icons iconName={isSetup ? "menu_setup_fill" : "menu_setup"} className="icon-20 remove-icon" />Setup
                                        <span className="caret"></span>
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                        {keycloak.principal.userActionItems.has("users") && <li><NavLink className="dropdown-item menu-link" to="users">Manage users</NavLink></li>}
                                        {keycloak.principal.userActionItems.has("jobs") && <li><NavLink className="dropdown-item menu-link" to="jobs">Jobs</NavLink></li>}
                                        {keycloak.principal.userActionItems.has("logs") && <li><NavLink className="dropdown-item menu-link" to="logs">Logs</NavLink></li>}
                                    </ul>
                                </li>}
                            </ul>
                        </div>
                        <div className="header-user-sec">
                            <ul className="nav navbar-nav ps-4">
                                <li className="nav-item dropdown user-dropdown d-flex align-items-center">
                                    <a className="nav-link dropdown-toggle d-flex" href="#/" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <span className="d-flex align-items-center"> <Icons iconName="profile" className="me-3" /></span>
                                        <div className="user-name-sec mt-1">
                                            <span>{keycloak.principal.name}</span>
                                        </div>
                                        <span className="caret"></span>
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                        <li><a className="dropdown-item" onClick={() => logout()}><Icons iconName="logout_user" className="me-1 icon-18 remove-icon" />Logout</a></li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

export default Header;
