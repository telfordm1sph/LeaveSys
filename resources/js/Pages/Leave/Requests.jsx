import RequestPageLayout from "./partials/RequestPageLayout";

export default function Requests({ myRequests, tab, search }) {
    return (
        <RequestPageLayout
            title="My Leave Requests"
            routeName="leave.requests"
            myRequests={myRequests}
            tab={tab}
            search={search}
        />
    );
}
