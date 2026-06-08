import { toDateOnlyISOString } from "@/lib/dateUtils";
import { api } from "@/services/api";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";

export function useDashboardData({ params, searchParams, navigate }) {
  const getInitialDateRange = () => {
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const preset = searchParams.get("preset");

    if (startDate && endDate) {
      return {
        startDate: parseISO(startDate),
        endDate: parseISO(endDate),
        preset: preset || "custom",
      };
    }

    return {
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
      preset: "current-month",
    };
  };

  const [summary, setSummary] = useState({ income: 0, outcome: 0, categories: [] });
  const [entries, setEntries] = useState([]);
  const [files, setFiles] = useState([]);
  const [userData, setUserData] = useState(null);
  const [currencySummary, setCurrencySummary] = useState({ currencies: [] });
  const [categories, setCategories] = useState([]);

  const [currency, setCurrency] = useState(
    params.currency || searchParams.get("currency") || "ALL"
  );
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [pagination, setPagination] = useState({ limit: 25, offset: 0, total: 0 });
  const [filesPagination, setFilesPagination] = useState({ limit: 25, offset: 0, total: 0 });

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);

  const prevPaginationOffset = useRef(pagination.offset);
  const prevFilesPaginationOffset = useRef(filesPagination.offset);

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
      if (newTab !== "dashboard") {
        path += `/${newTab}`;
      }

      const newURL = urlParams.toString() ? `${path}?${urlParams.toString()}` : path;
      navigate(newURL, { replace: true });
    },
    [dateRange, currency, activeTab, navigate]
  );

  const fetchUserProfile = useCallback(async () => {
    const profile = await api.get("/auth/profile");
    if (!profile.error) {
      setUserData(profile);
    }
  }, []);

  const fetchCurrencySummary = useCallback(async () => {
    try {
      const startDateStr = toDateOnlyISOString(dateRange.startDate);
      const endDateStr = toDateOnlyISOString(dateRange.endDate);

      const urlParams = new URLSearchParams();
      urlParams.append("start_date", startDateStr);
      urlParams.append("end_date", endDateStr);

      const data = await api.get(`/budget/summary-by-currency?${urlParams.toString()}`);

      if (!data.error) {
        setCurrencySummary(data);
      } else {
        console.error("Error fetching currency summary:", data.error);
        setCurrencySummary({ currencies: [] });
      }
    } catch (error) {
      console.error("Failed to fetch currency summary:", error);
      setCurrencySummary({ currencies: [] });
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      if (currency === "ALL") {
        await fetchCurrencySummary();
        setSummary({ income: 0, outcome: 0, categories: [] });
      } else {
        const startDateStr = toDateOnlyISOString(dateRange.startDate);
        const endDateStr = toDateOnlyISOString(dateRange.endDate);

        const urlParams = new URLSearchParams();
        urlParams.append("start_date", startDateStr);
        urlParams.append("end_date", endDateStr);
        urlParams.append("currency", currency);

        const data = await api.get(`/budget/summary?${urlParams.toString()}`);

        if (!data.error) {
          setSummary(data);
        } else {
          console.error("Error fetching summary:", data.error);
        }
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error);
      setSummary({ income: 0, outcome: 0, categories: [] });
    } finally {
      setSummaryLoading(false);
    }
  }, [currency, dateRange.startDate, dateRange.endDate, fetchCurrencySummary]);

  const fetchDetails = useCallback(async () => {
    if (currency === "ALL") {
      setEntries([]);
      return;
    }

    setEntriesLoading(true);
    try {
      const startDateStr = toDateOnlyISOString(dateRange.startDate);
      const endDateStr = toDateOnlyISOString(dateRange.endDate);

      const urlParams = new URLSearchParams();
      urlParams.append("start_date", startDateStr);
      urlParams.append("end_date", endDateStr);
      urlParams.append("limit", pagination.limit);
      urlParams.append("offset", pagination.offset);
      urlParams.append("currency", currency);

      const data = await api.get(`/budget/details?${urlParams.toString()}`);

      if (!data.error) {
        setEntries(data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: data.metadata?.total_count || 0,
        }));
      } else {
        console.error("Error fetching details:", data.error);
        setEntries([]);
      }
    } catch (error) {
      console.error("Failed to fetch details:", error);
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }, [currency, dateRange.startDate, dateRange.endDate, pagination.limit, pagination.offset]);

  const fetchFiles = useCallback(async () => {
    if (currency === "ALL") {
      setFiles([]);
      return;
    }

    setFilesLoading(true);
    setFilesError(null);

    try {
      const urlParams = new URLSearchParams();
      urlParams.append("limit", filesPagination.limit);
      urlParams.append("offset", filesPagination.offset);
      urlParams.append("currency", currency);

      const response = await api.get(`/budget/files?${urlParams.toString()}`);

      if (!response.error) {
        setFiles(response.data || []);
        setFilesPagination((prev) => ({
          ...prev,
          total: response.metadata?.total_count || 0,
        }));
      } else {
        setFilesError(response.error);
        setFiles([]);
      }
    } catch (err) {
      setFilesError("Failed to load files. Please try again.");
      console.error("Error fetching files:", err);
    } finally {
      setFilesLoading(false);
    }
  }, [currency, filesPagination.limit, filesPagination.offset]);

  // Profile and categories only need to load once
  useEffect(() => {
    fetchUserProfile();
    api
      .get("/budget-transaction-category/budget-transaction-category")
      .then((response) => {
        if (response && !response.error) {
          setCategories(response);
        }
      })
      .catch((error) => console.error("Error fetching transaction categories:", error));
  }, []);

  // Single effect for all filter-driven fetches — fires once on mount and on every filter change
  useEffect(() => {
    fetchSummary();
    fetchDetails();
    fetchFiles();
    // deps are the raw filter values, not the function refs, to avoid stale-closure re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    if (prevPaginationOffset.current !== pagination.offset) {
      prevPaginationOffset.current = pagination.offset;
      fetchDetails();
    }
  }, [pagination.offset]);

  useEffect(() => {
    if (prevFilesPaginationOffset.current !== filesPagination.offset) {
      prevFilesPaginationOffset.current = filesPagination.offset;
      fetchFiles();
    }
  }, [filesPagination.offset]);

  useEffect(() => {
    const tabFromURL = params.tab || "dashboard";
    setActiveTab(tabFromURL);

    const currencyFromURL = params.currency || searchParams.get("currency") || "ALL";
    if (currencyFromURL !== currency) {
      setCurrency(currencyFromURL);
    }

    const urlDateRange = getInitialDateRange();
    if (
      urlDateRange.startDate.getTime() !== dateRange.startDate.getTime() ||
      urlDateRange.endDate.getTime() !== dateRange.endDate.getTime()
    ) {
      setDateRange(urlDateRange);
    }
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

  const handleImportSuccess = useCallback(() => {
    fetchSummary();
    fetchDetails();
    fetchFiles();
    setActiveTab("dashboard");
  }, [fetchSummary, fetchDetails, fetchFiles]);

  let dateRangeFormatted;
  if (dateRange.preset === "current-month") {
    dateRangeFormatted = format(new Date(), "MMMM yyyy");
  } else if (dateRange.preset === "custom") {
    const startYear = dateRange.startDate.getFullYear();
    const endYear = dateRange.endDate.getFullYear();
    const startMonth = dateRange.startDate.getMonth();
    const endMonth = dateRange.endDate.getMonth();

    if (startYear === endYear && startMonth === endMonth) {
      dateRangeFormatted = format(dateRange.startDate, "MMMM yyyy");
    } else if (startYear === endYear) {
      dateRangeFormatted = `${format(dateRange.startDate, "MMM dd")} - ${format(dateRange.endDate, "MMM dd, yyyy")}`;
    } else {
      dateRangeFormatted = `${format(dateRange.startDate, "MMM dd, yyyy")} - ${format(dateRange.endDate, "MMM dd, yyyy")}`;
    }
  } else {
    const startYear = dateRange.startDate.getFullYear();
    const endYear = dateRange.endDate.getFullYear();
    const startMonth = dateRange.startDate.getMonth();
    const endMonth = dateRange.endDate.getMonth();

    if (startYear === endYear && startMonth === endMonth) {
      dateRangeFormatted = format(dateRange.startDate, "MMMM yyyy");
    } else if (startYear === endYear) {
      dateRangeFormatted = `${format(dateRange.startDate, "MMMM")} - ${format(dateRange.endDate, "MMMM yyyy")}`;
    } else {
      dateRangeFormatted = `${format(dateRange.startDate, "MMMM yyyy")} - ${format(dateRange.endDate, "MMMM yyyy")}`;
    }
  }

  return {
    summary,
    entries,
    files,
    userData,
    currencySummary,
    categories,
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
    summaryLoading,
    entriesLoading,
    filesLoading,
    filesError,
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
