import Regulation from '../Pages/Regulations/Regulation';
import AddRegulation from '../Pages/Regulations/AddRegulation';
import AddPattern from '../Pages/DataManagement/Patterns/AddPatterns.js';
import AddGrading from '../Pages/DataManagement/Grading/AddGrading.js';
import CreditAssignment from '../Pages/DataManagement/Patterns/CreditAssignment.js';
import MarkDistribution from '../Pages/DataManagement/Distributions/MarkDistribution.js';
import AddDistribution from '../Pages/DataManagement/Distributions/AddDistribution.js';
import Grading from "../Pages/DataManagement/Grading/Grading.js";
import PrgmByRegulation from '../Pages/ProgramScheme/PrgmByRegulation.js';
import SchemeDetails from '../Pages/ProgramScheme/SchemeDetails.js';
import RegulationMapping from '../Pages/RegulationMapping/RegulationMapping.js';
import Attributes from '../Pages/DataManagement/Attributes/Attributes.js';
import Users from '../Pages/Setup/Users/Users.js';
import BatchJobs from '../Pages/Setup/Jobs/Jobs.js';
import OutComes from '../Pages/ProgramScheme/OutComes/OutComes.js';
import Logs from '../Pages/Setup/Logs/Logs.js';

export const AccessConfig = () => {

    const routes = [
        {
            path: "/regulations",
            element: <Regulation />,
            allowedRoles: ["ADMIN", "REGULATION FACULTY", "REGULATION APPROVER", "FACULTY"]
        },
        {
            path: "/addRegulation/:type",
            element: <AddRegulation />,
            allowedRoles: ["ADMIN", "REGULATION FACULTY"]
        },
        {
            path: "/addRegulation/:type/:id",
            element: <AddRegulation />,
            allowedRoles: ["ADMIN", "REGULATION FACULTY", "REGULATION APPROVER"]
        },
        {
            path: "/creditAssignment",
            element: <CreditAssignment />,
            allowedRoles: ["ADMIN", "DATA MANAGER"]
        },
        {
            path: "/creditAssignment/add",
            element: <AddPattern />,
            allowedRoles: ["ADMIN", "DATA MANAGER"]
        },
        {
            path: "/creditAssignment/:type/:id",
            element: <AddPattern />,
            allowedRoles: ["ADMIN", "DATA MANAGER"]
        },
        {
            path: "/grading",
            element: <Grading />,
            allowedRoles: ["ADMIN", "DATA MANAGER"]
        },
        {
            path: "/grading/add",
            element: <AddGrading />,
            allowedRoles: ["ADMIN", "DATA MANAGER"]
        },
        {
            path: "/grading/:type/:id",
            element: <AddGrading />,
            allowedRoles: ["ADMIN", "DATA MANAGER"]
        },
        {
            path: "/markDistribution",
            element: <MarkDistribution />,
            allowedRoles: ["ADMIN", "DATA MANAGER"]
        },
        {
            path: "/addDistribution",
            element: <AddDistribution />,
            allowedRoles: ["ADMIN", "DATA MANAGER"]
        },
        {
            path: "/addDistribution/:type",
            element: <AddDistribution />,
            allowedRoles: ["ADMIN", "DATA MANAGER"]
        },
        {
            path: "/addDistribution/:type/:id",
            element: <AddDistribution />,
            allowedRoles: ["ADMIN", "DATA MANAGER"]
        },
        {
            path: "/users",
            element: <Users />,
            allowedRoles: ["ADMIN", "USER MANAGER"]
        },
        {
            path: "/attributes",
            element: <Attributes />,
            allowedRoles: ["ADMIN", "DATA MANAGER"]
        },
        {
            path: "/programScheme",
            element: <PrgmByRegulation />,
            allowedRoles: ["ADMIN", "SCHEME FACULTY", "SCHEME APPROVER I", "SCHEME APPROVER II", "FACULTY", "PO UPLOADER", "OBE APPROVER"]
        },
        {
            path: "/schemeDetails",
            element: <SchemeDetails />,
            allowedRoles: ["ADMIN", "SCHEME FACULTY", "SCHEME APPROVER I", "SCHEME APPROVER II", "FACULTY", "PO UPLOADER", "OBE APPROVER"]
        },
        {
            path: "schemeDetails/:regulationId/:programId",
            element: <SchemeDetails />,
            allowedRoles: ["ADMIN", "SCHEME FACULTY", "SCHEME APPROVER I", "SCHEME APPROVER II", "FACULTY", "PO UPLOADER", "OBE APPROVER"]
        },
        {
            path: "/regulationMapping",
            element: <RegulationMapping />,
            allowedRoles: ["ADMIN", "REGULATION MAPPER"]
        },
        {
            path: "/jobs",
            element: <BatchJobs />,
            allowedRoles: ["ADMIN"]
        },
        {
            path: "/outcomes",
            element: <OutComes />,
            allowedRoles: ["ADMIN", "FACULTY", "PO UPLOADER", "OBE APPROVER", "SCHEME FACULTY", "SCHEME APPROVER I", "SCHEME APPROVER II"]
        },
        {
            path: "/logs",
            element: <Logs />,
            allowedRoles: ["ADMIN"]
        }
    ];

    const roleToMenuItems = {
        "ADMIN": ["regulations", "programScheme", "regulationMapping", "dataManagement", "setup"],
        "REGULATION FACULTY": ["regulations"],
        "REGULATION APPROVER": ["regulations"],
        "REGULATION MAPPER": ["regulationMapping"],
        "SCHEME FACULTY": ["programScheme"],
        "SCHEME APPROVER I": ["programScheme"],
        "SCHEME APPROVER II": ["programScheme"],
        "FACULTY": ["programScheme"],
        "OBE APPROVER": ["programScheme"],
        "PO UPLOADER": ["programScheme"],
        "USER MANAGER": ["setup"],
        "DATA MANAGER": ["dataManagement"],
    }

    const roleToActionItems = {
        "ADMIN": ["addRegulations", "programmeAccess", "users", "jobs", "logs", "addCourses", "programmeOutcome", "courseOutcome"],
        "REGULATION FACULTY": ["addRegulations"],
        "SCHEME FACULTY": ["addCourses"],
        "SCHEME APPROVER I": ["schemeAccess"],
        "SCHEME APPROVER II": ["programmeApprovalAccess"],
        "USER MANAGER": ["users"],
        "PO UPLOADER": ["programmeOutcome"],
        "FACULTY": ["courseOutcome"],

    };

    return { routes, roleToMenuItems, roleToActionItems };
}