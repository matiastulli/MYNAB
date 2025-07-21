"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDateForInput, parseDatePreservingDay } from "@/lib/dateUtils"
import { endOfMonth, startOfMonth, subMonths } from "date-fns"
import { CalendarIcon, ChevronDownIcon } from "lucide-react"
import { useEffect, useState } from "react"

export default function DateRangeFilter({ dateRange, onDateRangeChange, isLoading }) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    preset: dateRange.preset,
  })

  useEffect(() => {
    // Update local state when props change
    setTempRange({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      preset: dateRange.preset,
    })
  }, [dateRange])

  const handlePresetChange = (preset) => {
    const newRange = { preset }

    switch (preset) {
      case "current-month":
        newRange.startDate = startOfMonth(new Date())
        newRange.endDate = endOfMonth(new Date())
        break
      case "last-month":
        const lastMonth = subMonths(new Date(), 1)
        newRange.startDate = startOfMonth(lastMonth)
        newRange.endDate = endOfMonth(lastMonth)
        break
      case "last-3-months":
        newRange.startDate = startOfMonth(subMonths(new Date(), 2))
        newRange.endDate = endOfMonth(new Date())
        break
      case "last-6-months":
        newRange.startDate = startOfMonth(subMonths(new Date(), 5))
        newRange.endDate = endOfMonth(new Date())
        break
      case "custom":
        // For custom, keep the current dates
        newRange.startDate = tempRange.startDate
        newRange.endDate = tempRange.endDate
        break
      default:
        break
    }

    setTempRange(newRange)
  }

  // Format dates for input fields
  const formatDateForInputField = (date) => {
    return formatDateForInput(date)
  }

  const handleStartDateChange = (e) => {
    const date = parseDatePreservingDay(e.target.value)
    setTempRange({
      ...tempRange,
      startDate: date,
      preset: "custom", // Switch to custom when manually selecting dates
    })
  }

  const handleEndDateChange = (e) => {
    const date = parseDatePreservingDay(e.target.value)
    setTempRange({
      ...tempRange,
      endDate: date,
      preset: "custom", // Switch to custom when manually selecting dates
    })
  }

  const handleApply = () => {
    onDateRangeChange(tempRange)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] gap-1 text-xs sm:text-sm shadow-sm ${isLoading ? "opacity-70 pointer-events-none" : ""}`}
          disabled={isLoading}
        >
          <CalendarIcon className={`h-3.5 w-3.5 text-[hsl(var(--accent))] ${isLoading ? "animate-pulse" : ""}`} />
          <span className="hidden sm:inline font-medium text-[hsl(var(--foreground))]">Date Range</span>
          <ChevronDownIcon className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
          {isLoading && (
            <svg
              className="animate-spin ml-1 h-3 w-3 text-[hsl(var(--accent))]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4 bg-popover text-popover-foreground border-border shadow-lg"
        style={{ backgroundColor: "hsl(var(--popover))", backgroundImage: "none" }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="datePreset" className="text-popover-foreground">
              Date Range
            </Label>
            <Select value={tempRange.preset} onValueChange={handlePresetChange}>
              <SelectTrigger
                id="datePreset"
                className="border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] h-9"
              >
                <SelectValue
                  placeholder="Select period"
                  className="text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))] dialog-content-solid">
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-popover-foreground text-xs">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formatDateForInputField(tempRange.startDate)}
                onChange={handleStartDateChange}
                className="border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-[hsl(var(--popover-foreground))] text-xs">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formatDateForInputField(tempRange.endDate)}
                onChange={handleEndDateChange}
                min={formatDateForInputField(tempRange.startDate)}
                className="border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] h-9"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleApply} variant="success" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-[hsl(var(--background))]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Applying...
                </div>
              ) : (
                "Apply Filter"
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
