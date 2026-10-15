"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldError, Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useDashboardContext } from "@/contexts/DashboardContext"
import { formatDateForInput } from "@/lib/dateUtils"
import { cn } from "@/lib/utils"
import { CalendarBlankIcon, CaretDownIcon } from "@phosphor-icons/react"
import { endOfMonth, lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
import { useEffect, useState } from "react"

const PRESETS = [
  { value: "current-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-3-months", label: "3 months" },
  { value: "last-6-months", label: "6 months" },
  { value: "custom", label: "Custom" },
]

export default function DateRangeFilter({ isLoading, trigger }) {
  const { dateRange, handleDateRangeChange: onDateRangeChange } = useDashboardContext()
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    preset: dateRange.preset,
  })

  // Track raw input values separately to allow free typing
  const [startDateInput, setStartDateInput] = useState(formatDateForInput(dateRange.startDate))
  const [endDateInput, setEndDateInput] = useState(formatDateForInput(dateRange.endDate))

  useEffect(() => {
    // Update local state when props change
    setTempRange({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      preset: dateRange.preset,
    })
    setStartDateInput(formatDateForInput(dateRange.startDate))
    setEndDateInput(formatDateForInput(dateRange.endDate))
  }, [dateRange])

  const handlePresetChange = (preset) => {
    const newRange = { preset }

    switch (preset) {
      case "current-month":
        newRange.startDate = startOfMonth(new Date())
        newRange.endDate = endOfMonth(new Date())
        break
      case "last-month": {
        const lastMonth = subMonths(new Date(), 1)
        newRange.startDate = startOfMonth(lastMonth)
        newRange.endDate = endOfMonth(lastMonth)
        break
      }
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
    setStartDateInput(formatDateForInput(newRange.startDate))
    setEndDateInput(formatDateForInput(newRange.endDate))
  }

  const handleStartDateChange = (e) => {
    const raw = e.target.value
    setStartDateInput(raw) // Always update the input display

    const date = parseDateFromInput(raw)
    if (date) {
      setTempRange((prev) => ({
        ...prev,
        startDate: date,
        preset: "custom",
      }))
    }
  }

  const handleEndDateChange = (e) => {
    const raw = e.target.value
    setEndDateInput(raw) // Always update the input display

    const date = parseDateFromInput(raw)
    if (date) {
      setTempRange((prev) => ({
        ...prev,
        endDate: date,
        preset: "custom",
      }))
    }
  }

  const rangeInvalid =
    tempRange.startDate && tempRange.endDate && new Date(tempRange.startDate) > new Date(tempRange.endDate)

  const handleApply = () => {
    if (rangeInvalid) return
    onDateRangeChange(tempRange)
    setIsOpen(false)
  }

  // Robust manual parser for YYYY-MM-DD format. Returns a Date or null for invalid input.
  function parseDateFromInput(value) {
    if (!value || typeof value !== "string") return null

    // Must be exactly YYYY-MM-DD format
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) return null

    const [, yearStr, monthStr, dayStr] = match
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10) // 1-12
    const day = parseInt(dayStr, 10)

    // Basic range checks
    if (month < 1 || month > 12 || day < 1 || day > 31) return null

    // Construct date (month is 0-indexed in JS Date constructor)
    const constructed = new Date(year, month - 1, day)

    // Verify the date is valid (month/day didn't overflow)
    if (constructed.getMonth() !== month - 1 || constructed.getFullYear() !== year) {
      return null
    }

    // If day overflowed (e.g., Feb 30), cap to last valid day of month
    if (constructed.getDate() !== day) {
      const last = lastDayOfMonth(new Date(year, month - 1, 1))
      return new Date(year, month - 1, last.getDate())
    }

    return constructed
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" disabled={isLoading}>
            <CalendarBlankIcon className="text-muted-foreground" />
            <span className="hidden sm:inline">Date range</span>
            <CaretDownIcon className="text-muted-foreground" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-5">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Period</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePresetChange(p.value)}
                  className={cn(
                    "h-8 rounded-full border px-3 text-[13px] font-medium transition-colors duration-200 active:scale-[0.97]",
                    tempRange.preset === p.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">From</Label>
              <Input
                id="startDate"
                type="date"
                value={startDateInput}
                onChange={handleStartDateChange}
                aria-invalid={rangeInvalid || undefined}
                className="figure h-10 px-3 text-[13px]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">To</Label>
              <Input
                id="endDate"
                type="date"
                value={endDateInput}
                onChange={handleEndDateChange}
                min={startDateInput}
                aria-invalid={rangeInvalid || undefined}
                className="figure h-10 px-3 text-[13px]"
              />
            </div>
            <FieldError className="col-span-2">{rangeInvalid ? "The start date is after the end date." : null}</FieldError>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} size="sm" loading={isLoading} loadingText="Applying" disabled={rangeInvalid}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
