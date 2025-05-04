import defineEnum from "./define.js";

const _Regulations = {
	status: defineEnum([
		{ value: "DR", name: "DRAFT", description: "Draft" },
		{ value: "WA", name: "WAITING_FOR_APPROVAL", description: "Waiting For Approval" },
		{ value: "AP", name: "APPROVED", description: "Approved" },
		{ value: "RC", name: "REQUESTED_CHANGES", description: "Requested Changes" }
	])
};

const _Mapping = {
	status: defineEnum([
		{ value: "DR", name: "DRAFT", description: "Draft" },
		{ value: "WA", name: "WAITING_FOR_APPROVAL", description: "Waiting For Approval" },
		{ value: "AP", name: "APPROVED", description: "Approved" },
		{ value: "RC", name: "REQUESTED_CHANGES", description: "Requested Changes" }
	]),
	level: defineEnum([
		{ value: "1", name: "LOW", description: "Low" },
		{ value: "2", name: "MEDIUM", description: "Medium" },
		{ value: "3", name: "HIGH", description: "High" }
	]),
	taxonomy: defineEnum([
		{ value: "6", name: "CREATE", description: "L6:Create" },
		{ value: "5", name: "EVALUATE", description: "L5:Evaluate" },
		{ value: "4", name: "ANALYZE", description: "L4:Analyze" },
		{ value: "3", name: "APPLY", description: "L3:Apply" },
		{ value: "2", name: "UNDERSTAND", description: "L2:Understand" },
		{ value: "1", name: "REMEMBER", description: "L1:Remember" }
	])
};

const _Courses = {
	status: defineEnum([
		{ value: "DR", name: "DRAFT", description: "Draft" },
		{ value: "WA", name: "WAITING_FOR_APPROVAL", description: "Waiting For Approval" },
		{ value: "AP", name: "APPROVED", description: "Approved" },
		{ value: "RC", name: "REQUESTED_CHANGES", description: "Requested Changes" },
		{ value: "CO", name: "CONFIRMED", description: "Confirmed" }
	]),
	displayStatus: defineEnum([
		{ value: "DR", name: "DRAFT", description: "Draft" },
		{ value: "AP", name: "APPROVED", description: "Approved" },
		{ value: "CO", name: "CONFIRMED", description: "Confirmed" },
		{ value: "PV", name: "PARTIALLY_VERIFIED", description: "Partially Verified" },
		{ value: "PD", name: "PENDING", description: "Pending" },
		{ value: "WA", name: "WAITING_FOR_APPROVAL", description: "Waiting For Approval" },
		{ value: "RC", name: "REQUESTED_CHANGES", description: "Requested Changes" },
		{ value: "FR", name: "FREEZED", description: "Freezed" },
		{ value: "NF", name: "NOT_FREEZED", description: "Not Freezed" }

	])

};

const _Action_Items = {
	action: defineEnum([
		{ value: "CR", name: "CREATE", description: "Create" },
		{ value: "VI", name: "VIEW", description: "View" },
		{ value: "ED", name: "EDIT", description: "Edit" },
		{ value: "DE", name: "DELETE", description: "Delete" },
		{ value: "SA", name: "SEND_FOR_APPROVAL", description: "Send For Approval" },
		{ value: "AP", name: "APPROVE", description: "Approve" },
		{ value: "RC", name: "REQUEST_CHANGES", description: "Request Changes" },
		{ value: "CO", name: "CONFIRMED", description: "Confirmed" },
		{ value: "OD", name: "OFFERING_DEPARTMENT", description: "Offering Department" },
		{ value: "US", name: "UPLOAD_SYLLABUS", description: "Upload Syllabus" },
		{ value: "VS", name: "VIEW_SYLLABUS", description: "View Syllabus" },
		{ value: "CL", name: "CLONE", description: "Clone" }
	])
};

const _Jobs = {
	names: defineEnum([
		{ value: "SPG", name: "Sync_Programmes", description: "Sync Programmes From Groups" },
		{ value: "SBG", name: "Sync_BatchYears", description: "Sync BatchYears From Groups" },
		{ value: "SDG", name: "Sync_Departments", description: "Sync Departments From Groups" },
		{ value: "RCS", name: "Regulation_ChangeStatus", description: "Regulation Status Change Mail" },
		{ value: "CCS", name: "Course_ChangeStatus", description: "Course Status Change Mail" },
		{ value: "MCS", name: "CO_PO_Mapping_ChangeStatus", description: "CO-PO Mapping Status Change Mail" },
		{ value: "POS", name: "PO_ChangeStatus", description: "PO Change Status Mail" },
		{ value: "PRS", name: "Programme_Regulation_ChangeStatus", description: "Programme Regulation Status Change Mail" },
		{ value: "MRS", name: "Move_Regulation_To_Next_Semester", description: "Move Regulation To Next Semester" }
	]),

	status: defineEnum([
		{ "value": "NS", "name": "NotStarted", "description": "Not Started" },
		{ "value": "IP", "name": "InProgress", "description": "In Progress" },
		{ "value": "CO", "name": "Completed", "description": "Completed" },
		{ "value": "ER", "name": "Errored", "description": "Error" }
	])
};

export {
	_Regulations as Regulations,
	_Courses as Courses,
	_Action_Items as Action_Items,
	_Mapping as Mapping,
	_Jobs as Jobs
};