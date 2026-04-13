import RequestPageLayout from "./partials/RequestPageLayout";

export default function Appeals({ myRequests, tab, search }) {
    return (
        <RequestPageLayout
            title="My Leave Appeals"
            routeName="leave.requests.appeals"
            myRequests={myRequests}
            tab={tab}
            search={search}
        />
    );
}
