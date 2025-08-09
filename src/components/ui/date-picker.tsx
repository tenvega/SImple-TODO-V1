"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    date?: Date;
    onDateChange: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    disablePastDates?: boolean;
}

export function DatePicker({
    date,
    onDateChange,
    placeholder = "Pick a date",
    disabled = false,
    disablePastDates = false
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        onDateChange(selectedDate);
        setOpen(false);
    };

    const today = new Date();
    const minDate = disablePastDates ? today : undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    disabled={(date) => {
                        if (disablePastDates && date < today) {
                            return true;
                        }
                        return false;
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}