import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { Calendar } from "@/Components/ui/calendar";

// value / onChange use "YYYY-MM-DD" strings (same as <input type="date">)
export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    disabled = false,
    clearable = true,
    className,
}) {
    const [open, setOpen] = useState(false);

    const parsed  = value ? parseISO(value) : null;
    const valid   = parsed && isValid(parsed);
    const display = valid ? format(parsed, "MMM d, yyyy") : null;

    const handleSelect = (date) => {
        onChange?.(date ? format(date, "yyyy-MM-dd") : null);
        setOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange?.(null);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full h-8 px-3 justify-start text-left font-normal text-xs",
                        !display && "text-muted-foreground",
                        className,
                    )}
                >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    <span className="flex-1 truncate">
                        {display ?? placeholder}
                    </span>
                    {clearable && value && !disabled && (
                        <span
                            role="button"
                            tabIndex={-1}
                            className="ml-1 rounded p-0.5 hover:bg-muted transition-colors"
                            onClick={handleClear}
                        >
                            <X className="h-3 w-3" />
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={valid ? parsed : undefined}
                    onSelect={handleSelect}
                    defaultMonth={valid ? parsed : undefined}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
