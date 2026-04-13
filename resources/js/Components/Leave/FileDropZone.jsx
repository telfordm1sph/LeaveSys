import { useRef } from "react";
import { Label }    from "@/components/ui/label";
import { Paperclip, FileText, X } from "lucide-react";
import { formatFileSize } from "@/lib/leaveUtils";

export default function FileDropZone({ label, hint, files, onChange, error }) {
    const ref = useRef(null);

    const add  = (f) => onChange([...files, ...f]);
    const del  = (i) => onChange(files.filter((_, j) => j !== i));
    const pick = (e) => { add(Array.from(e.target.files)); e.target.value = ""; };
    const drop = (e) => { e.preventDefault(); add(Array.from(e.dataTransfer.files)); };

    return (
        <div className="space-y-2">
            {label && (
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </Label>
            )}
            {hint && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}

            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={drop}
                onClick={() => ref.current?.click()}
                className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-muted/20 px-4 py-6 transition-all hover:border-primary hover:bg-primary/5"
            >
                <div className="rounded-full bg-muted p-2 transition-colors group-hover:bg-primary/10">
                    <Paperclip className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Drop files or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG — max 10 MB each</p>
                <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden" onChange={pick} />
            </div>

            {files.length > 0 && (
                <ul className="space-y-1">
                    {files.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(f.size)}</span>
                            <button type="button" onClick={() => del(i)}
                                className="ml-1 shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
