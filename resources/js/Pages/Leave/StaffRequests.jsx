import StaffPageLayout from "./partials/StaffPageLayout";

export default function StaffRequests({ pending, history, tab }) {
    return (
        <StaffPageLayout
            title="Staff Leave Requests"
            routeName="leave.staff.requests"
            pending={pending}
            history={history}
            tab={tab}
        />
    );
}
