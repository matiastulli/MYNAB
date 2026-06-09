import { toDateOnlyISOString } from "@/lib/dateUtils";
import { api } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { useCallback, useEffect, useState } from "react";

// --- Fetchers ---

const apiFetch = async (path) => {
  const data = await api.get(path);
  if (data.error) throw new Error(data.error);
  return data;
};

const fetchProfile = () => apiFetch("/auth/profile");

const fetchCategories = () =>
  apiFetch("/budget-transaction-category/budget-transaction-category");

const fetchCurrencySummary = (startDate, endDate) => {
  const p = new URLSearchParams({ start_date: startDate, end_date: endDate });
  return apiFetch(`/budget/summary-by-currency?${p}`);
};

const fetchSummaryData = (currency, startDate, endDate) => {
  const p = new URLSearchParams({ start_date: startDate, end_date: endDate, currency });
  return apiFetch(`/budget/summary?${p}`);
};

const fetchDetailsData = (currency, startDate, endDate, limit, offset) => {
  const p = new URLSearchParams({ start_date: startDate, end_date: endDate, currency, limit, offset });
  return apiFetch(`/budget/details?${p}`);
};

const fetchFilesData = (currency, limit, offset) => {
  const p = new URLSearchParams({ currency, limit, offset });
  return apiFetch(`/budget/files?${p}`);
};

// --- Hook ---

export function useDashboardData({ params, searchParams, navigate }) {
  const getInitialDateRange = () => {
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const preset = searchParams.get("preset");

    if (startDate && endDate) {
      return { startDate: parseISO(startDate), endDate: parseISO(endDate), preset: preset || "custom" };
    }
    return { startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()), preset: "current-month" };
  };

  const [currency, setCurrency] = useState(
    params.currency || searchParams.get("currency") || "ALL"
  );
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [pagination, setPagination] = useState({ limit: 25, offset: 0, total: 0 });
  const [filesPagination, setFilesPagination] = useState({ limit: 25, offset: 0, total: 0 });

  const queryClient = useQueryClient();

  const startDateStr = toDateOnlyISOString(dateRange.startDate);
  const endDateStr = toDateOnlyISOString(dateRange.endDate);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: Infinity,
    retry: 1,
  });

  const currencySummaryQuery = useQuery({
    queryKey: ["currency-summary", startDateStr, endDateStr],
    queryFn: () => fetchCurrencySummary(startDateStr, endDateStr),
    enabled: currency === "ALL",
    staleTime: 30 * 1000,
  });

  const summaryQuery = useQuery({
    queryKey: ["summary", currency, startDateStr, endDateStr],
    queryFn: () => fetchSummaryData(currency, startDateStr, endDateStr),
    enabled: currency !== "ALL",
    staleTime: 30 * 1000,
  });

  const detailsQuery = useQuery({
    queryKey: ["details", currency, startDateStr, endDateStr, pagination.limit, pagination.offset],
    queryFn: () => fetchDetailsData(currency, startDateStr, endDateStr, pagination.limit, pagination.offset),
    enabled: currency !== "ALL",
    staleTime: 30 * 1000,
  });

  const filesQuery = useQuery({
    queryKey: ["files", currency, filesPagination.limit, filesPagination.offset],
    queryFn: () => fetchFilesData(currency, filesPagination.limit, filesPagination.offset),
    enabled: currency !== "ALL",
    staleTime: 30 * 1000,
  });

  // Sync total counts from query responses back into pagination state
  useEffect(() => {
    const total = detailsQuery.data?.metadata?.total_count;
    if (total !== undefined) {
      setPagination((prev) => (prev.total !== total ? { ...prev, total } : prev));
    }
  }, [detailsQuery.data]);

  useEffect(() => {
    const total = filesQuery.data?.metadata?.total_count;
    if (total !== undefined) {
      setFilesPagination((prev) => (prev.total !== total ? { ...prev, total } : prev));
    }
  }, [filesQuery.data]);

  const updateURLWithFilters = useCallback(
    (newDateRange = dateRange, newCurrency = currency, newTab = activeTab) => {
      const urlParams = new URLSearchParams();

      if (newDateRange.preset !== "current-month") {
        urlParams.set("startDate", toDateOnlyISOString(newDateRange.startDate));
        urlParams.set("endDate", toDateOnlyISOString(newDateRange.endDate));
        urlParams.set("preset", newDateRange.preset);
      }

      if (newCurrency !== "ALL") {
        urlParams.set("currency", newCurrency);
      }

      let path = "/dashboard";
      if (newTab !== "dashboard") path += `/${newTab}`;

      const newURL = urlParams.toString() ? `${path}?${urlParams.toString()}` : path;
      navigate(newURL, { replace: true });
    },
    [dateRange, currency, activeTab, navigate]
  );

  useEffect(() => {
    const tabFromURL = params.tab || "dashboard";
    setActiveTab(tabFromURL);

    const currencyFromURL = params.currency || searchParams.get("currency") || "ALL";
    if (currencyFromURL !== currency) setCurrency(currencyFromURL);

    const urlDateRange = getInitialDateRange();
    if (
      urlDateRange.startDate.getTime() !== dateRange.startDate.getTime() ||
      urlDateRange.endDate.getTime() !== dateRange.endDate.getTime()
    ) {
      setDateRange(urlDateRange);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tab, params.currency, searchParams]);

  const handleDateRangeChange = useCallback(
    (newRange) => {
      setDateRange(newRange);
      setPagination((prev) => ({ ...prev, offset: 0 }));
      updateURLWithFilters(newRange, currency, activeTab);
    },
    [currency, activeTab, updateURLWithFilters]
  );

  const handleCurrencyChange = useCallback(
    (newCurrency) => {
      setCurrency(newCurrency);
      setPagination((prev) => ({ ...prev, offset: 0 }));
      setFilesPagination((prev) => ({ ...prev, offset: 0 }));
      updateURLWithFilters(dateRange, newCurrency, activeTab);
    },
    [dateRange, activeTab, updateURLWithFilters]
  );

  const handleCurrencySelect = useCallback(
    (selectedCurrency) => {
      handleCurrencyChange(selectedCurrency);
      setActiveTab("dashboard");
      updateURLWithFilters(dateRange, selectedCurrency, "dashboard");
    },
    [handleCurrencyChange, dateRange, updateURLWithFilters]
  );

  const handleCurrencyImport = useCallback(
    (selectedCurrency) => {
      handleCurrencyChange(selectedCurrency);
      setActiveTab("import");
      updateURLWithFilters(dateRange, selectedCurrency, "import");
    },
    [handleCurrencyChange, dateRange, updateURLWithFilters]
  );

  const handleTabChange = useCallback(
    (newTab) => {
      setActiveTab(newTab);
      updateURLWithFilters(dateRange, currency, newTab);
    },
    [dateRange, currency, updateURLWithFilters]
  );

  const handlePaginationChange = useCallback((newPagination) => {
    setPagination(newPagination);
  }, []);

  const handleFilesPaginationChange = useCallback((newPagination) => {
    setFilesPagination(newPagination);
  }, []);

  // Imperative invalidation helpers — kept for backward compat
  const fetchSummary = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["summary"] });
    queryClient.invalidateQueries({ queryKey: ["currency-summary"] });
  }, [queryClient]);

  const fetchDetails = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["details"] });
  }, [queryClient]);

  const fetchFiles = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["files"] });
  }, [queryClient]);

  const fetchUserProfile = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  }, [queryClient]);

  const handleImportSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["summary"] });
    queryClient.invalidateQueries({ queryKey: ["currency-summary"] });
    queryClient.invalidateQueries({ queryKey: ["details"] });
    queryClient.invalidateQueries({ queryKey: ["files"] });
    setActiveTab("dashboard");
  }, [queryClient]);

  let dateRangeFormatted;
  if (dateRange.preset === "current-month") {
    dateRangeFormatted = format(new Date(), "MMMM yyyy");
  } else {
    const startYear = dateRange.startDate.getFullYear();
    const endYear = dateRange.endDate.getFullYear();
    const startMonth = dateRange.startDate.getMonth();
    const endMonth = dateRange.endDate.getMonth();

    if (startYear === endYear && startMonth === endMonth) {
      dateRangeFormatted = format(dateRange.startDate, "MMMM yyyy");
    } else if (startYear === endYear) {
      if (dateRange.preset === "custom") {
        dateRangeFormatted = `${format(dateRange.startDate, "MMM dd")} - ${format(dateRange.endDate, "MMM dd, yyyy")}`;
      } else {
        dateRangeFormatted = `${format(dateRange.startDate, "MMMM")} - ${format(dateRange.endDate, "MMMM yyyy")}`;
      }
    } else {
      if (dateRange.preset === "custom") {
        dateRangeFormatted = `${format(dateRange.startDate, "MMM dd, yyyy")} - ${format(dateRange.endDate, "MMM dd, yyyy")}`;
      } else {
        dateRangeFormatted = `${format(dateRange.startDate, "MMMM yyyy")} - ${format(dateRange.endDate, "MMMM yyyy")}`;
      }
    }
  }

  return {
    summary: summaryQuery.data ?? { income: 0, outcome: 0, categories: [] },
    entries: detailsQuery.data?.data ?? [],
    files: filesQuery.data?.data ?? [],
    userData: profileQuery.data ?? null,
    currencySummary: currencySummaryQuery.data ?? { currencies: [] },
    categories: categoriesQuery.data ?? [],
    currency,
    setCurrency,
    dateRange,
    setDateRange,
    activeTab,
    setActiveTab,
    pagination,
    setPagination,
    filesPagination,
    setFilesPagination,
    summaryLoading: summaryQuery.isFetching || currencySummaryQuery.isFetching,
    entriesLoading: detailsQuery.isFetching,
    filesLoading: filesQuery.isFetching,
    filesError: filesQuery.error?.message ?? null,
    fetchSummary,
    fetchDetails,
    fetchFiles,
    fetchUserProfile,
    handleCurrencyChange,
    handleDateRangeChange,
    handleCurrencySelect,
    handleCurrencyImport,
    handleTabChange,
    handlePaginationChange,
    handleFilesPaginationChange,
    handleImportSuccess,
    updateURLWithFilters,
    dateRangeFormatted,
  };
}
