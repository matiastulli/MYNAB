import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateForInput, parseDatePreservingDay } from "@/lib/dateUtils";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function DateRangeFilter({ dateRange, onDateRangeChange, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    preset: dateRange.preset
  });

  useEffect(() => {
    // Update local state when props change
    setTempRange({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      preset: dateRange.preset
    });
  }, [dateRange]);

  const handlePresetChange = (preset) => {
    let newRange = { preset };

    switch (preset) {
      case 'current-month':
        newRange.startDate = startOfMonth(new Date());
        newRange.endDate = endOfMonth(new Date());
        break;
      case 'last-month':
        const lastMonth = subMonths(new Date(), 1);
        newRange.startDate = startOfMonth(lastMonth);
        newRange.endDate = endOfMonth(lastMonth);
        break;
      case 'last-3-months':
        newRange.startDate = startOfMonth(subMonths(new Date(), 2));
        newRange.endDate = endOfMonth(new Date());
        break;
      case 'last-6-months':
        newRange.startDate = startOfMonth(subMonths(new Date(), 5));
        newRange.endDate = endOfMonth(new Date());
        break;
      case 'custom':
        // For custom, keep the current dates
        newRange.startDate = tempRange.startDate;
        newRange.endDate = tempRange.endDate;
        break;
      default:
        break;
    }

    setTempRange(newRange);
  };

  // Format dates for input fields - Replace with our utility function
  const formatDateForInputField = (date) => {
    return formatDateForInput(date);
  };

  const handleStartDateChange = (e) => {
    const date = parseDatePreservingDay(e.target.value);
    setTempRange({
      ...tempRange,
      startDate: date,
      preset: 'custom' // Switch to custom when manually selecting dates
    });
  };

  const handleEndDateChange = (e) => {
    const date = parseDatePreservingDay(e.target.value);
    setTempRange({
      ...tempRange,
      endDate: date,
      preset: 'custom' // Switch to custom when manually selecting dates
    });
  };

  const handleApply = () => {
    onDateRangeChange(tempRange);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 bg-white/50 dark:bg-[#1e232a]/50 hover:bg-white dark:hover:bg-[#252b36] gap-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
          disabled={isLoading}
        >
          <CalendarIcon className={`h-3.5 w-3.5 text-neutral-500 ${isLoading ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">Change period</span>
          <ChevronDownIcon className="h-3.5 w-3.5 opacity-70" />
          {isLoading && (
            <svg className="animate-spin ml-1 h-3 w-3 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 border-0 bg-white dark:bg-[#1e232a] shadow-lg">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="datePreset" className="text-neutral-700 dark:text-neutral-300">
              Date Range
            </Label>
            <Select value={tempRange.preset} onValueChange={handlePresetChange}>
              <SelectTrigger
                id="datePreset"
                className="border-0 bg-white dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-200 h-9"
              >
                <SelectValue
                  placeholder="Select period"
                  className="text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-200"
                />
              </SelectTrigger>
              <SelectContent className="dark:bg-[#2a303a] border-0">
                <SelectItem value="current-month" className="text-neutral-900 dark:text-white">Current Month</SelectItem>
                <SelectItem value="last-month" className="text-neutral-900 dark:text-white">Last Month</SelectItem>
                <SelectItem value="last-3-months" className="text-neutral-900 dark:text-white">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months" className="text-neutral-900 dark:text-white">Last 6 Months</SelectItem>
                <SelectItem value="custom" className="text-neutral-900 dark:text-white">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-neutral-700 dark:text-neutral-300 text-xs">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formatDateForInputField(tempRange.startDate)}
                onChange={handleStartDateChange}
                className="border-0 bg-white dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-200 h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-neutral-700 dark:text-neutral-300 text-xs">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formatDateForInputField(tempRange.endDate)}
                onChange={handleEndDateChange}
                min={formatDateForInputField(tempRange.startDate)}
                className="border-0 bg-white dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-200 h-9"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleApply}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Applying...
                </div>
              ) : (
                'Apply Filter'
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
