import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { formatMoney } from "@/components/ui/financial-value";
import { Input } from "@/components/ui/input";
import { FieldError, FieldHint, Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrencyName, getCurrencySymbol } from "@/lib/currencyUtils";
import { parseDatePreservingDay, toDateOnlyISOString } from "@/lib/dateUtils";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { ArrowDownLeftIcon, ArrowUpRightIcon, CheckIcon, InfoIcon, PlusIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AddTransaction({
  onTransactionAdded,
  defaultCurrency = "ARS",
  categories = []
}) {
  const [form, setForm] = useState({
    amount: "",
    type: "outcome",
    description: "",
    date: toDateOnlyISOString(new Date()),
    currency: defaultCurrency,
    source: "manual",
    reference_id: "",
    category_id: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    setForm(prevForm => ({
      ...prevForm,
      currency: defaultCurrency
    }));
  }, [defaultCurrency]);

  const amountInvalid = form.amount !== "" && !(Number(form.amount) > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amountInvalid) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await api.post("/budget/entry", form);
      if (!response.error) {
        setSuccess(true);

        setForm({
          amount: "",
          type: "outcome",
          description: "",
          date: toDateOnlyISOString(new Date()),
          currency: defaultCurrency,
          source: "manual",
          reference_id: "",
          category_id: null
        });

        onTransactionAdded();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setSubmitError(typeof response.error === "string" ? response.error : "The transaction could not be saved.");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      setSubmitError("The transaction could not be saved. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const symbol = getCurrencySymbol(form.currency);
  const isIncome = form.type === "income";
  const category = categories.find((c) => c.id === form.category_id);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Card className="p-6 md:p-8">
        <AnimatePresence mode="wait" initial={false}>
          {success ? (
            <motion.div key="done" {...fadeUp} className="flex min-h-[420px] flex-col items-start justify-center gap-6">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent"
              >
                <CheckIcon className="size-6" weight="bold" />
              </motion.span>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-semibold tracking-tight">Saved to your ledger</h3>
                <p className="max-w-[44ch] text-[15px] leading-relaxed text-muted-foreground">
                  It already counts toward this period's totals and shows up in Activity.
                </p>
              </div>
              <Button onClick={() => setSuccess(false)}>
                <PlusIcon />
                Add another
              </Button>
            </motion.div>
          ) : (
            <motion.form key="form" {...fadeUp} onSubmit={handleSubmit} className="flex flex-col gap-7">
              <div className="flex flex-col gap-1.5">
                <Eyebrow>New entry</Eyebrow>
                <h2 className="text-xl font-semibold tracking-tight">Record a transaction</h2>
              </div>

              <Segmented
                ariaLabel="Transaction type"
                value={form.type}
                onChange={(value) => setForm({ ...form, type: value })}
                className="w-full sm:w-fit"
                options={[
                  { value: "outcome", label: "Expense", icon: ArrowUpRightIcon, tone: "negative" },
                  { value: "income", label: "Income", icon: ArrowDownLeftIcon, tone: "positive" },
                ]}
              />

              {/* Amount */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="figure pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                    {symbol}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    aria-invalid={amountInvalid || undefined}
                    className={cn("figure h-16 rounded-2xl text-[1.75rem] font-medium tracking-tight md:text-[1.75rem]", symbol.length > 1 ? "pl-12" : "pl-10")}
                    placeholder="0.00"
                    required
                  />
                </div>
                {amountInvalid ? (
                  <FieldError>Enter an amount greater than zero.</FieldError>
                ) : (
                  <FieldHint>Always positive. The type above decides whether it adds or subtracts.</FieldHint>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Verdulería Don Aurelio, rent for October, salary"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="figure"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.category_id ? form.category_id.toString() : "none"}
                    onValueChange={(value) => setForm({
                      ...form,
                      category_id: value !== "none" ? parseInt(value) : null
                    })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">No category</span>
                      </SelectItem>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="reference_id">
                  Reference <span className="font-normal text-muted-foreground">optional</span>
                </Label>
                <Input
                  id="reference_id"
                  value={form.reference_id}
                  onChange={(e) => setForm({ ...form, reference_id: e.target.value })}
                  placeholder="Invoice or operation number"
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <FieldError className="sm:max-w-[40ch]">{submitError}</FieldError>
                <Button
                  type="submit"
                  size="xl"
                  className="w-full sm:ml-auto sm:w-auto"
                  loading={isSubmitting}
                  loadingText="Saving"
                  disabled={!form.amount || amountInvalid}
                >
                  <PlusIcon />
                  Add {isIncome ? "income" : "expense"}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      {/* Context column */}
      <div className="flex flex-col gap-4">
        <Card className="p-6 md:p-7">
          <Eyebrow>Preview</Eyebrow>
          <div className="mt-5 flex items-center gap-4">
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", isIncome ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground")}>
              {isIncome ? <ArrowDownLeftIcon className="size-4" weight="bold" /> : <ArrowUpRightIcon className="size-4" weight="bold" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium">{form.description || "Untitled entry"}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {form.date ? parseDatePreservingDay(form.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No date"}
                {category ? ` · ${category.category_name}` : ""}
              </p>
            </div>
            <span className={cn("figure shrink-0 text-base font-medium", isIncome ? "text-positive" : "text-foreground")}>
              {isIncome ? "+" : "−"}{symbol}{formatMoney(form.amount || 0)}
            </span>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4 text-xs text-muted-foreground">
            <span>Currency</span>
            <span className="font-medium text-foreground">{form.currency} · {getCurrencyName(form.currency)}</span>
          </div>
        </Card>

        <Card className="p-6 md:p-7">
          <div className="flex gap-3">
            <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Starting from an existing balance?</p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                If the account already had money before your first imported statement, add it once as
                Income with the description "Initial Balance" so MYNAB matches your bank.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
