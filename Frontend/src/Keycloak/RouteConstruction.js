import { Routes, Route } from 'react-router-dom';
import { useAppContext } from './InitiateKeycloak';
import { AccessConfig } from './AccessConfig.js';
import DefaultRoute from './DefaultRoute.js';

const RouteConstruction = (props) => {

    const { routes } = AccessConfig();
    const { keycloak } = useAppContext();

    const checkRoleExists = (allowedRoles) => {

        if (!allowedRoles || !allowedRoles.length) {
            return true;
        }

        if (keycloak?.principal?.userRoles && Object.keys(keycloak.principal.userRoles).length) {

            let roles = keycloak.principal.userRoles;
            let accessRoles = allowedRoles.filter(role => roles[role]);
            if (!accessRoles || !accessRoles.length) {
                return false;
            }
            return true;
        }

        return false;

    };

    return <Routes>
        <Route path='/*' element={<DefaultRoute></DefaultRoute>}></Route>
        {routes.map((page, index) => {
            return (checkRoleExists(page.allowedRoles) ? <Route key={index} exact path={page.path} element={page.element}></Route> : "");
        })}
    </Routes>
};

export default RouteConstruction;