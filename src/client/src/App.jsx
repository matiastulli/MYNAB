import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function App() {
  const [summary, setSummary] = useState({ income: 0, outcome: 0 });
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ amount: '', type: 'income', description: '', date: '' });

  const fetchSummary = async () => {
    const res = await fetch('/budget/summary');
    const data = await res.json();
    setSummary(data);
  };

  const fetchDetails = async () => {
    const res = await fetch('/budget/details');
    const data = await res.json();
    setEntries(data);
  };

  useEffect(() => {
    fetchSummary();
    fetchDetails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/budget/entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ amount: '', type: 'income', description: '', date: '' });
    fetchSummary();
    fetchDetails();
  };

  const balance = summary.income - summary.outcome;
  const formattedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-light tracking-tight dark:text-white">MYNAB</h1>
          <span className="text-slate-500 dark:text-slate-400">{formattedDate}</span>
        </div>

        {/* Summary Card */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Balance</div>
              <div className={`text-2xl font-semibold mt-1 ${balance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                ${Math.abs(balance).toFixed(2)}
              </div>
            </div>
            <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Income</div>
              <div className="text-2xl font-semibold mt-1 text-green-600 dark:text-green-500">
                ${summary.income.toFixed(2)}
              </div>
            </div>
            <div className="p-6">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Expenses</div>
              <div className="text-2xl font-semibold mt-1 text-red-600 dark:text-red-500">
                ${summary.outcome.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="entries" className="space-y-6">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="entries">Transactions</TabsTrigger>
            <TabsTrigger value="new">New Entry</TabsTrigger>
          </TabsList>
          
          {/* Entries List */}
          <TabsContent value="entries" className="space-y-2">
            {entries.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                No transactions found for this month
              </div>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg font-medium">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                    {entries.map(entry => (
                      <li key={entry.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${entry.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                            {entry.type === 'income' ? 
                              <ArrowUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" /> : 
                              <ArrowDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                            }
                          </div>
                          <div>
                            <p className="font-medium">{entry.description || '(No description)'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(entry.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`font-medium ${entry.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          {entry.type === 'income' ? '+' : '-'}${entry.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* New Entry Form */}
          <TabsContent value="new">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Add Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <Input 
                          id="amount"
                          type="number" 
                          value={form.amount} 
                          onChange={(e) => setForm({ ...form, amount: e.target.value })} 
                          className="pl-7" 
                          placeholder="0.00"
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm">Type</Label>
                      <Select 
                        value={form.type} 
                        onValueChange={(value) => setForm({ ...form, type: value })}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="outcome">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description" className="text-sm">Description</Label>
                      <Input 
                        id="description"
                        value={form.description} 
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="What's this transaction for?"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="date" className="text-sm">Date</Label>
                      <div className="relative">
                        <Input 
                          id="date"
                          type="date" 
                          value={form.date} 
                          onChange={(e) => setForm({ ...form, date: e.target.value })} 
                          required 
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full mt-2 flex gap-2 items-center">
                    <PlusIcon className="h-4 w-4" />
                    Add Transaction
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}