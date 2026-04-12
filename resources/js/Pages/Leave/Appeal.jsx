import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function Appeal({ leave_request_id }) {
    const { emp_data } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        leave_request_id: leave_request_id,
        appeal_reason:    "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route("leave.file.appeal.store"));
    }

    return (
        <AuthenticatedLayout>
            <Head title="Submit Appeal" />

            <div className="mx-auto max-w-xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Late Filing Appeal</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {emp_data?.emp_name} &mdash; Leave Request #{leave_request_id}
                    </p>
                </div>

                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Late Filing Detected</AlertTitle>
                    <AlertDescription>
                        Your VL was filed late (less than 2 days in advance). Please provide a
                        justification. Your leave request will be routed for department head approval.
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Appeal Justification</CardTitle>
                            <CardDescription>
                                Explain why this leave was filed late. Be as specific as possible.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1.5">
                                <Label>Reason for Late Filing</Label>
                                <Textarea
                                    placeholder="Explain why the leave was filed late..."
                                    value={data.appeal_reason}
                                    onChange={(e) => setData("appeal_reason", e.target.value)}
                                    rows={5}
                                />
                                {errors.appeal_reason && (
                                    <p className="text-xs text-destructive">{errors.appeal_reason}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {errors.appeal && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{errors.appeal}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end gap-3 pb-6">
                        <Button
                            type="submit"
                            disabled={processing || !data.appeal_reason.trim()}
                        >
                            {processing ? "Submitting..." : "Submit Appeal"}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
