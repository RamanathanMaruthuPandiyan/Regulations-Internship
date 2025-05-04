import { useAppContext } from './InitiateKeycloak';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const DefaultRoute = () => {
    const { keycloak } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        navigate(Array.from(keycloak.principal.userMenuItems)[0]);
    }, [keycloak]);

}

export default DefaultRoute;