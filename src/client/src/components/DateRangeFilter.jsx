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
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function DateRangeFilter({ dateRange, onDateRangeChange }) {
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

  const handleStartDateChange = (e) => {
    const date = new Date(e.target.value);
    setTempRange({
      ...tempRange,
      startDate: date,
      preset: 'custom' // Switch to custom when manually selecting dates
    });
  };

  const handleEndDateChange = (e) => {
    const date = new Date(e.target.value);
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

  // Format dates for input fields
  const formatDateForInput = (date) => {
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 bg-white/50 dark:bg-[#1e232a]/50 hover:bg-white dark:hover:bg-[#252b36] gap-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400"
        >
          <CalendarIcon className="h-3.5 w-3.5 text-neutral-500" />
          <span className="hidden sm:inline">Change period</span>
          <ChevronDownIcon className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 border-0 bg-white dark:bg-[#1e232a] shadow-lg">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="datePreset" className="text-neutral-700 dark:text-neutral-300">Date Range</Label>
            <Select 
              value={tempRange.preset}
              onValueChange={handlePresetChange}
            >
              <SelectTrigger 
                id="datePreset"
                className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47]"
              >
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="dark:bg-[#2a303a] border-0">
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-neutral-700 dark:text-neutral-300 text-xs">Start Date</Label>
              <Input 
                id="startDate"
                type="date" 
                value={formatDateForInput(tempRange.startDate)} 
                onChange={handleStartDateChange} 
                className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-neutral-700 dark:text-neutral-300 text-xs">End Date</Label>
              <Input 
                id="endDate"
                type="date" 
                value={formatDateForInput(tempRange.endDate)} 
                onChange={handleEndDateChange}
                min={formatDateForInput(tempRange.startDate)}
                className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] h-9"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleApply}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Apply Filter
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
