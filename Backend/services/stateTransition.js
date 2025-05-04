import { Regulations, Mapping, Courses } from "../enums/enums.js";
import { ROLES } from "../middleware/auth.js";

/**
 * @description - Checks if a transition between two course statuses is allowed based on user roles.
 * @param {Map} stateMap - map of state transitions
 * @param {String} sourceStatus - The source status of the course.
 * @param {String} destinationStatus - The destination status of the course.
 * @param {Array<String>} user - Array of user roles.
 * @returns {Boolean} True if the transition is allowed, false otherwise.
 */
function isTransitionAllowed(stateMap, sourceStatus, destinationStatus, user) {
    try {
        if (!stateMap.has(sourceStatus) || !stateMap.get(sourceStatus).has(destinationStatus)) {
            return false;
        }

        let { roles } = stateMap.get(sourceStatus).get(destinationStatus);

        return Array.from(user).some((i) => roles.has(i));
    } catch (e) {
        throw e;
    }
}

const regulation = new Map([
    [
        Regulations.status.DRAFT,
        new Map([
            [Regulations.status.WAITING_FOR_APPROVAL, { roles: new Set([ROLES.RF, ROLES.A]) }]
        ])
    ],
    [
        Regulations.status.WAITING_FOR_APPROVAL,
        new Map([
            [Regulations.status.REQUESTED_CHANGES, { roles: new Set([ROLES.RA, ROLES.A]) }],
            [Regulations.status.APPROVED, { roles: new Set([ROLES.RA, ROLES.A]) }]
        ])
    ],
    [
        Regulations.status.REQUESTED_CHANGES,
        new Map([
            [Regulations.status.WAITING_FOR_APPROVAL, { roles: new Set([ROLES.RF, ROLES.A]) }]
        ])
    ]
]);

const programmeRegulation = new Map([
    [
        Mapping.status.DRAFT,
        new Map([
            [Mapping.status.WAITING_FOR_APPROVAL, { roles: new Set([ROLES.PU, ROLES.A]) }]
        ])
    ],
    [
        Mapping.status.WAITING_FOR_APPROVAL,
        new Map([
            [Mapping.status.REQUESTED_CHANGES, { roles: new Set([ROLES.OA, ROLES.A]) }],
            [Mapping.status.APPROVED, { roles: new Set([ROLES.OA, ROLES.A]) }]
        ])
    ],
    [
        Mapping.status.REQUESTED_CHANGES,
        new Map([
            [Mapping.status.WAITING_FOR_APPROVAL, { roles: new Set([ROLES.PU, ROLES.A]) }]
        ])
    ]
]);

const course = new Map([
    [
        Courses.status.DRAFT,
        new Map([
            [Courses.status.WAITING_FOR_APPROVAL, { roles: new Set([ROLES.SF, ROLES.A]) }]
        ])
    ],
    [
        Courses.status.WAITING_FOR_APPROVAL,
        new Map([
            [Courses.status.REQUESTED_CHANGES, { roles: new Set([ROLES.SA1, ROLES.A]) }],
            [Courses.status.APPROVED, { roles: new Set([ROLES.SA1, ROLES.A]) }]
        ])
    ],
    [
        Courses.status.REQUESTED_CHANGES,
        new Map([
            [Courses.status.WAITING_FOR_APPROVAL, { roles: new Set([ROLES.SF, ROLES.A]) }]
        ])
    ],
    [
        Courses.status.APPROVED,
        new Map([
            [Courses.status.CONFIRMED, { roles: new Set([ROLES.SA2, ROLES.A]) }],
            [Courses.status.REQUESTED_CHANGES, { roles: new Set([ROLES.SA2, ROLES.A]) }]

        ])
    ]
]);

const courseOutcome = new Map([
    [
        Mapping.status.DRAFT,
        new Map([
            [Mapping.status.WAITING_FOR_APPROVAL, { roles: new Set([ROLES.FA, ROLES.A]) }]
        ])
    ],
    [
        Mapping.status.WAITING_FOR_APPROVAL,
        new Map([
            [Mapping.status.REQUESTED_CHANGES, { roles: new Set([ROLES.OA, ROLES.A]) }],
            [Mapping.status.APPROVED, { roles: new Set([ROLES.OA, ROLES.A]) }]
        ])
    ],
    [
        Mapping.status.REQUESTED_CHANGES,
        new Map([
            [Mapping.status.WAITING_FOR_APPROVAL, { roles: new Set([ROLES.FA, ROLES.A]) }]
        ])
    ]
]);

export default {
    isTransitionAllowed,
    regulation,
    programmeRegulation,
    course,
    courseOutcome
}
