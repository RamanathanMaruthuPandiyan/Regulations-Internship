import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const authServerConfig = require(`../config/config.${process.env.NODE_ENV}.json`).authServerConfig;
import keycloak from '@keycloak/keycloak-admin-client';
import faculty from "../services/remote/faculty.js";
import userDao from "../daos/users.js";
import { setDifference } from '../services/common.js';

//Get access token
async function accessToken() {
    try {
        // initiate keycloak admin client with username & password
        const kcAdminClient = new keycloak({
            baseUrl: authServerConfig.baseUrl
        });
        await kcAdminClient.auth(authServerConfig.settings);

        // change realm
        kcAdminClient.setConfig({
            realmName: authServerConfig.realmName,
            baseUrl: authServerConfig.baseUrl
        });
        return Promise.resolve(kcAdminClient);
    }
    catch (e) {
        return Promise.reject(e);
    }
}

//Get id of client
async function getIdOfCielnt(access) {
    try {
        let [client] = await access.clients.findOne({ clientId: authServerConfig.clientId })
        return client.id;
    }
    catch (e) {
        return Promise.reject(e);
    }
}

class Roles {
    static access = accessToken;
    static async byNames(values, accessToken) {
        try {
            let access = accessToken || await this.access();
            let idOfClient = await getIdOfCielnt(access);
            let roles = await access.clients.listRoles({ id: idOfClient });
            let roleNames = new Set(values);
            let result = roles.filter(role => roleNames.has(role.name)).map(role => { return { id: role.id, name: role.name } });
            return Promise.resolve(result);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }

}
class Users {
    static access = accessToken;

    /**
     * @description - to update a user detail
     * @param {String} userId
     * @param {Array<String>} roles
     * @param {Array<ObjectId>} departmentIds
     * @param {Array<ObjectId>} programmeIds
     * @returns {Promise<String>} success message
     */
    static async addUser({ userId, roles, departmentIds, programmeIds }) {
        try {

            let access = await this.access();

            //check user exist in fis module
            let facultyRecord = await faculty.checkFaculty(userId);

            if (!facultyRecord) {
                throw new Error("Invalid username.");
            }

            //check user exist in keycloak
            let [user] = await access.users.findOne({ username: userId });

            if (!user || !Object.keys(user).length) {
                throw new Error("User details not found");
            }

            //reset user password
            // await access.users.resetPassword({
            //     id: user.id,
            //     credential: {
            //         temporary: true,
            //         type: 'password',
            //         value: userId,
            //     }
            // });

            //create user in reglation db
            let result = await userDao.create({ userId: facultyRecord.id, firstName: facultyRecord.name, roles, departmentIds, programmeIds });

            if (!result || !result.insertedId) {
                throw new Error("Error while creating user account.");
            }

            //map user role in keycloak
            await this.addClientRole(user.id, roles);

            return Promise.resolve(`Successfully added roles for the user ${userId} ${user.firstName}.`);

        }
        catch (e) {
            if (e.responseData && e.responseData.errorMessage) {
                e.message = e.responseData.errorMessage;
            }
            return Promise.reject(e);
        }
    }

    /**
     * @description - to update a user detail
     * @param {String} userId
     * @param {Array<String>} roles
     * @param {Array<ObjectId>} departmentIds
     * @param {Array<ObjectId>} programmeIds
     * @returns {Promise<String>} success message
     */
    static async update({ userId, roles: updatedRoles, departmentIds, programmeIds }) {
        try {
            let access = await this.access();

            let [user] = await access.users.findOne({ username: userId });
            if (!Object.keys(user).length) {
                throw new Error("User details not found");
            }

            let existingRole = await this.userClientRoles(user.id, access);
            let { deleted: deletedRoles, added: newRoles } = setDifference(existingRole, updatedRoles);

            if (newRoles.length) {
                await this.addClientRole(user.id, newRoles);
            }

            if (deletedRoles.length) {
                deletedRoles = deletedRoles.filter((role) => !authServerConfig.byKeycloak.includes(role))
                await this.removeClientRole(user.id, deletedRoles);
            }

            let result = await userDao.updateOne({ userId }, "SET", { roles: updatedRoles, departmentIds, programmeIds });

            if (!result.acknowledged) {
                throw new Error("Error while updating role.");
            }

            return Promise.resolve(`Successfully updated roles for the user ${userId} - ${user.firstName}.`);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * @description to list all roles of a user
     * @param {String} userId
     * @param {Object}[accessToken]
     * @returns {Promise<Object>} result
     */
    static async userClientRoles(userId, accessToken) {
        try {
            let access = accessToken || await this.access();
            let idOfClient = await getIdOfCielnt(access)
            let result = await access.users.listClientRoleMappings({ id: userId, clientUniqueId: idOfClient });
            result = result.map(role => role.name);
            return Promise.resolve(result);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * @description to add roles
     * @param {String} userId - userId
     * @param {string[]} roles - roles to be added
     * @returns {Promise<Object>} result
     */
    static async addClientRole(userId, roles) {
        try {
            let access = await this.access();
            let rolesList = await Roles.byNames(roles, access);
            let idOfClient = await getIdOfCielnt(access);
            let result = await access.users.addClientRoleMappings({ id: userId, clientUniqueId: idOfClient, roles: rolesList });
            return Promise.resolve(result);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * @description to remove roles
     * @param {String} userId - userId
     * @param {string[]} roles - roles to be removed
     * @returns {Promise<Object>} result
     */
    static async removeClientRole(userId, roles) {
        try {
            let access = await this.access();
            let rolesList = await Roles.byNames(roles, access);
            let idOfClient = await getIdOfCielnt(access);
            let result = await access.users.delClientRoleMappings({ id: userId, clientUniqueId: idOfClient, roles: rolesList });
            return Promise.resolve(result);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * @description to get all roles that can be assigned via application
     * @returns {Array} - list of roles
     */
    static roles() {
        return authServerConfig.byApplication;
    }

    /**
     *@description to remove all roles of a user
     * @param {String} userId - unique userId
     * @returns {Promise<String>} success message
     */
    static async remove(userId) {
        try {
            let access = await this.access();
            let [user] = await access.users.findOne({ username: userId });

            if (!user) {
                throw new Error("User not found.");
            }

            await userDao.removeBy({ userId });
            let roles = await this.userClientRoles(user.id, access);
            await this.removeClientRole(user.id, roles);
            return Promise.resolve(`Removed all roles of regulation module for the User ${userId} - ${user.firstName}.`);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
}

export { Users, Roles };
