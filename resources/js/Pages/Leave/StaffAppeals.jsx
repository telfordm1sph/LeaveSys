import StaffPageLayout from "./partials/StaffPageLayout";

export default function StaffAppeals({ pending, history, tab }) {
    return (
        <StaffPageLayout
            title="Staff Leave Appeals"
            routeName="leave.staff.appeals"
            pending={pending}
            history={history}
            tab={tab}
        />
    );
}
