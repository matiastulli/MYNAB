import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, FilterIcon, XIcon } from "lucide-react";
import { useState } from "react";

export default function FilterControls({ onApplyFilters }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    type: ""
  });

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters = {
      startDate: "",
      endDate: "",
      type: ""
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="mb-4 border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm"
      >
        <FilterIcon className="h-4 w-4 mr-2" />
        Filter Transactions
      </Button>
    );
  }

  return (
    <Card className="mb-4 border-0 bg-white/60 dark:bg-[#1a1e24]/90 backdrop-blur-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Filter Transactions</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsOpen(false)}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-xs">Start Date</Label>
          <div className="relative">
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors"
            />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-300 pointer-events-none" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-xs">End Date</Label>
          <div className="relative">
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47] transition-colors"
            />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-300 pointer-events-none" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type" className="text-xs">Type</Label>
          <Select 
            value={filters.type} 
            onValueChange={(value) => setFilters({...filters, type: value})}
          >
            <SelectTrigger
              id="type"
              className="border-0 bg-neutral-100 dark:bg-[#2a303a] focus:bg-white dark:focus:bg-[#353b47]"
            >
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="dark:bg-[#1a1e24] dark:border-neutral-700">
              <SelectItem value="" className="dark:text-neutral-100">All types</SelectItem>
              <SelectItem value="income" className="dark:text-neutral-100">Income only</SelectItem>
              <SelectItem value="outcome" className="dark:text-neutral-100">Expenses only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleReset}
          className="border-neutral-200 dark:border-neutral-700"
        >
          Reset
        </Button>
        <Button 
          size="sm"
          onClick={handleApplyFilters}
          className="bg-neutral-900 hover:bg-neutral-800 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Apply Filters
        </Button>
      </div>
    </Card>
  );
}