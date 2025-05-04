import axios from 'axios';
import { AccessConfig } from './AccessConfig';

const { roleToMenuItems, roleToActionItems } = AccessConfig();

export const registerAuthListeners = (Auth, clientId) => {

    const setHeaders = (Auth) => {
        let token = "Bearer " + Auth.token;
        axios.defaults.headers.common['Authorization'] = token;
        axios.defaults.headers.common['userDetails'] = JSON.stringify(Auth.tokenParsed);
    }

    const frameUserProfile = (Auth) => {

        const setUserRoles = (Auth) => {

            if (Auth.principal.resource_access?.[clientId]?.roles?.length) {
                Auth.principal.resource_access[clientId].roles.forEach(function (role) {
                    Auth.principal.userRoles[role] = true;
                });
            }

            return;
        }

        const getUserPermissions = (Auth, allowedPermissions) => {

            var userPermittedSet = new Set();

            if (Auth.principal.resource_access?.[clientId]?.roles?.length) {
                Auth.principal.resource_access[clientId].roles.forEach(function (role) {
                    if (allowedPermissions[role]) {
                        allowedPermissions[role].forEach(userPermittedSet.add, userPermittedSet);
                    }
                });
            }

            return userPermittedSet;
        }

        Auth.principal = Auth.tokenParsed;
        Auth.principal.userRoles = {};

        setUserRoles(Auth);

        Auth.principal.userMenuItems = getUserPermissions(Auth, roleToMenuItems);
        Auth.principal.userActionItems = getUserPermissions(Auth, roleToActionItems);
    }

    Auth.onReady = () => {
        console.log("Adapter is initialized on " + new Date());
    };

    Auth.onAuthSuccess = () => {
        console.log("User is successfully authenticated on " + new Date());
        setHeaders(Auth);
        frameUserProfile(Auth);
    };

    Auth.onAuthError = () => {
        console.log("Error during authentication");
    };

    Auth.onAuthRefreshSuccess = () => {
        console.log("Auth refresh success on " + new Date());
    };

    Auth.onAuthRefreshError = () => {
        console.log("Auth refresh error");
    };

    Auth.onAuthLogout = () => {
        console.log("Auth logout successfully");
    };

    Auth.onTokenExpired = function () {
        console.log("Token expired on " + new Date());
        var successCallback = (function successCallback() {
            return function (refreshed) {
                if (refreshed) {
                    setHeaders(Auth);
                    frameUserProfile(Auth);
                    console.log("Token refreshed on " + new Date());
                }
            };
        })();
        Auth.updateToken().then(successCallback).catch(function () {
            Auth.logout();
        });
    };



}