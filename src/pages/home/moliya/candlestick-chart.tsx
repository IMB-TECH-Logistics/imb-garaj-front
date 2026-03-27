import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,

  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
import './candlestick-chart.css';

interface OHLCInfo {
  open: number;
  high: number;
  low: number;
  close: number;
  time: string;
  change: number;
  changePercent: number;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  time: string;
  date: string;
}

type TimeframeKey = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';

const TIMEFRAMES: { key: TimeframeKey; label: string; days: number }[] = [
  { key: '1D', label: '1D', days: 1 },
  { key: '1W', label: '1W', days: 7 },
  { key: '1M', label: '1M', days: 30 },
  { key: '3M', label: '3M', days: 90 },
  { key: '6M', label: '6M', days: 180 },
  { key: '1Y', label: '1Y', days: 365 },
  { key: '5Y', label: '5Y', days: 1825 },
  { key: 'ALL', label: 'ALL', days: 9999 },
];

const EXPENSE_CATEGORIES = [
  { category: 'Yoqilg\'i', descriptions: ['Diesel yoqilg\'i', 'Benzin AI-92', 'Gaz LPG', 'Yoqilg\'i kartasi to\'ldirish'] },
  { category: 'Ta\'mirlash', descriptions: ['Dvigatel ta\'miri', 'Tormoz kolodkalari', 'Moy almashtirish', 'Shinalar almashtirish', 'Filtr almashtirish'] },
  { category: 'Ish haqi', descriptions: ['Haydovchilar ish haqi', 'Dispetcherlar ish haqi', 'Mexaniklar ish haqi', 'Buxgalteriya ish haqi'] },
  { category: 'Ijara', descriptions: ['Ofis ijarasi', 'Garaj ijarasi', 'Ombor ijarasi'] },
  { category: 'Sug\'urta', descriptions: ['OSAGO sug\'urta', 'KASKO sug\'urta', 'Yuk sug\'urtasi'] },
  { category: 'Soliq', descriptions: ['QQS to\'lov', 'Foyda solig\'i', 'Mol-mulk solig\'i', 'Yo\'l solig\'i'] },
  { category: 'Aloqa', descriptions: ['Mobil aloqa', 'Internet xizmati', 'GPS monitoring'] },
  { category: 'Boshqa xarajat', descriptions: ['Ofis jihozlari', 'Kanselyariya', 'Choy-poy xarajatlari'] },
];

const INCOME_CATEGORIES = [
  { category: 'Yuk tashish', descriptions: ['Toshkent-Samarqand yuk', 'Buxoro-Navoiy yuk', 'Farg\'ona-Toshkent yuk', 'Xorazm-Toshkent yuk', 'Shahrisabz yuk tashish'] },
  { category: 'Logistika xizmati', descriptions: ['Ombor xizmati', 'Yuk saqlash', 'Buyurtma yetkazish', 'Express yetkazish'] },
  { category: 'Ijaraga berish', descriptions: ['Yuk mashinasi ijarasi', 'Furgon ijarasi', 'Tirkama ijarasi'] },
  { category: 'Shartnoma', descriptions: ['Oylik shartnoma — Artel', 'Oylik shartnoma — Nestle', 'Oylik shartnoma — Coca-Cola', 'Davlat buyurtmasi'] },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashDateString(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function generateTransactionsForDate(dateStr: string): Transaction[] {
  const seed = hashDateString(dateStr);
  const rng = seededRandom(seed);
  const transactions: Transaction[] = [];

  const numExpenses = Math.floor(rng() * 5) + 2;
  for (let i = 0; i < numExpenses; i++) {
    const catIdx = Math.floor(rng() * EXPENSE_CATEGORIES.length);
    const cat = EXPENSE_CATEGORIES[catIdx];
    const descIdx = Math.floor(rng() * cat.descriptions.length);
    const amount = Math.round((rng() * 8000000 + 500000) / 1000) * 1000;
    const hour = Math.floor(rng() * 10) + 8;
    const min = Math.floor(rng() * 60);
    transactions.push({
      id: `exp-${dateStr}-${i}`,
      type: 'expense',
      category: cat.category,
      description: cat.descriptions[descIdx],
      amount,
      time: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
      date: dateStr,
    });
  }

  const numIncomes = Math.floor(rng() * 4) + 1;
  for (let i = 0; i < numIncomes; i++) {
    const catIdx = Math.floor(rng() * INCOME_CATEGORIES.length);
    const cat = INCOME_CATEGORIES[catIdx];
    const descIdx = Math.floor(rng() * cat.descriptions.length);
    const amount = Math.round((rng() * 25000000 + 2000000) / 1000) * 1000;
    const hour = Math.floor(rng() * 10) + 8;
    const min = Math.floor(rng() * 60);
    transactions.push({
      id: `inc-${dateStr}-${i}`,
      type: 'income',
      category: cat.descriptions[descIdx],
      description: cat.descriptions[descIdx],
      amount,
      time: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
      date: dateStr,
    });
  }

  transactions.sort((a, b) => a.time.localeCompare(b.time));
  return transactions;
}

function generateTransactionsForRange(from: string, to: string, allDates: string[]): Transaction[] {
  const dates = allDates.filter((d) => d >= from && d <= to);
  // Cap at 60 days to avoid freezing on huge ranges
  const capped = dates.slice(0, 60);
  const all: Transaction[] = [];
  for (const d of capped) {
    all.push(...generateTransactionsForDate(d));
  }
  all.sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date));
  return all;
}

function generateHistoricalData(days: number = 1825): CandlestickData[] {
  const data: CandlestickData[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let basePrice = 245_000_000;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const volatility = basePrice * 0.03;
    const trend = Math.sin(i / 60) * basePrice * 0.005;
    const open = basePrice + trend + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.48) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    data.push({
      time: `${year}-${month}-${day}` as Time,
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
    });
    basePrice = close;
  }
  return data;
}


function timeToString(t: Time): string {
  if (typeof t === 'string') return t;
  if (typeof t === 'number') {
    const d = new Date(t * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }
  const bd = t as { year: number; month: number; day: number };
  return `${bd.year}-${String(bd.month).padStart(2, '0')}-${String(bd.day).padStart(2, '0')}`;
}

function getNextBusinessDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const formatSum = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + ' mlrd';
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' mln';
  if (abs >= 1_000) return (v / 1_000).toFixed(0) + ' ming';
  return v.toFixed(0);
};

const formatSumFull = (v: number) =>
  new Intl.NumberFormat('uz-UZ').format(Math.round(v)) + ' so\'m';


function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function CandlestickChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const highlightSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const dataRef = useRef<CandlestickData[]>([]);
  const allDatesRef = useRef<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isLive, setIsLive] = useState(true);
  const [lastPrice, setLastPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [activeTimeframe, setActiveTimeframe] = useState<TimeframeKey>('1Y');
  const [crosshairData, setCrosshairData] = useState<OHLCInfo | null>(null);
  const [allDates, setAllDates] = useState<string[]>([]);
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selBox, setSelBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const selBoxRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const selStartRef = useRef<{ x: number; y: number } | null>(null);
  const chartWrapRef = useRef<HTMLDivElement>(null);

  const today = getTodayStr();
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const isRange = dateFrom !== dateTo;

  const transactions = useMemo(() => {
    if (!isRange) return generateTransactionsForDate(dateFrom);
    return generateTransactionsForRange(dateFrom, dateTo, allDates);
  }, [dateFrom, dateTo, isRange, allDates]);

  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions]);

  const rangeBalanceInfo = useMemo(() => {
    if (candleData.length === 0 || allDates.length === 0) return null;
    // Binary-ish search using sorted allDates
    let fromIdx = allDates.findIndex((d) => d >= dateFrom);
    if (fromIdx === -1) return null;
    let toIdx = allDates.length - 1;
    while (toIdx > 0 && allDates[toIdx] > dateTo) toIdx--;
    if (toIdx < fromIdx) return null;

    const fromCandle = candleData[fromIdx];
    const toCandle = candleData[toIdx];
    let high = -Infinity, low = Infinity;
    for (let i = fromIdx; i <= toIdx; i++) {
      if (candleData[i].high > high) high = candleData[i].high;
      if (candleData[i].low < low) low = candleData[i].low;
    }
    return {
      openBalance: fromCandle.open,
      closeBalance: toCandle.close,
      change: toCandle.close - fromCandle.open,
      changePercent: ((toCandle.close - fromCandle.open) / fromCandle.open) * 100,
      high,
      low,
    };
  }, [dateFrom, dateTo, candleData, allDates]);

  const updateHighlight = useCallback(() => {
    if (!highlightSeriesRef.current || allDatesRef.current.length === 0) return;
    let fromIdx = allDatesRef.current.findIndex((d) => d >= dateFrom);
    if (fromIdx === -1) { highlightSeriesRef.current.setData([]); return; }
    let toIdx = allDatesRef.current.length - 1;
    while (toIdx > 0 && allDatesRef.current[toIdx] > dateTo) toIdx--;
    if (toIdx < fromIdx) { highlightSeriesRef.current.setData([]); return; }

    const rangeOnly = dataRef.current.slice(fromIdx, toIdx + 1).map((d) => ({ time: d.time, value: d.close }));
    highlightSeriesRef.current.setData(rangeOnly);
  }, [dateFrom, dateTo]);

  const updatePriceState = useCallback((data: CandlestickData[]) => {
    if (data.length < 2) return;
    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    const change = last.close - prev.close;
    const changePct = (change / prev.close) * 100;
    setLastPrice(last.close);
    setPriceChange(change);
    setPriceChangePercent(changePct);
  }, []);

  const getThemeColors = useCallback(() => {
    const s = getComputedStyle(document.documentElement);
    const hsl = (v: string) => `hsl(${s.getPropertyValue(v).trim()})`;
    return {
      bg: hsl('--card'),
      border: hsl('--border'),
      text: hsl('--muted-foreground'),
      grid: hsl('--border'),
    };
  }, []);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const tc = getThemeColors();

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: tc.bg },
        textColor: tc.text,
        fontFamily: "Trebuchet MS, ui-monospace, Consolas, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: tc.grid },
        horzLines: { color: tc.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { width: 1, color: 'rgba(120, 123, 134, 0.4)', style: 0, labelBackgroundColor: tc.border },
        horzLine: { width: 1, color: 'rgba(120, 123, 134, 0.4)', style: 0, labelBackgroundColor: tc.border },
      },
      rightPriceScale: {
        borderColor: tc.border,
        scaleMargins: { top: 0.15, bottom: 0.12 },
        autoScale: true,
      },
      timeScale: {
        borderColor: tc.border,
        timeVisible: false,
        rightOffset: 20,
        barSpacing: 8,
        minBarSpacing: 2,
      },
      handleScale: { axisPressedMouseMove: { time: true, price: true }, mouseWheel: true, pinch: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      localization: { priceFormatter: (price: number) => formatSum(price) },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    });

    // Highlight area series on the same price scale as candles so it aligns
    const highlightSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(41, 98, 255, 0.15)',
      bottomColor: 'rgba(41, 98, 255, 0.02)',
      lineColor: 'rgba(41, 98, 255, 0.4)',
      lineWidth: 1,
      priceScaleId: 'right',
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const data = generateHistoricalData();
    candleSeries.setData(data);
    dataRef.current = data;
    const dates = data.map((d) => timeToString(d.time));
    allDatesRef.current = dates;
    setAllDates(dates);
    setCandleData([...data]);

    updatePriceState(data);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    highlightSeriesRef.current = highlightSeries;

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) { setCrosshairData(null); return; }
      const candle = param.seriesData.get(candleSeries) as CandlestickData | undefined;
      if (!candle) { setCrosshairData(null); return; }
      const candleTimeStr = timeToString(candle.time);
      const idx = dataRef.current.findIndex((d) => timeToString(d.time) === candleTimeStr);
      const prev = idx > 0 ? dataRef.current[idx - 1] : null;
      const change = prev ? candle.close - prev.close : 0;
      const changePct = prev ? (change / prev.close) * 100 : 0;
      setCrosshairData({ open: candle.open, high: candle.high, low: candle.low, close: candle.close, time: candleTimeStr, change, changePercent: changePct });
    });

    chart.subscribeClick((param) => {
      if (!param.time || !param.seriesData) return;
      const candle = param.seriesData.get(candleSeries) as CandlestickData | undefined;
      if (!candle) return;
      const dateStr = timeToString(param.time);
      setDateFrom(dateStr);
      setDateTo(dateStr);
    });
  }, [updatePriceState]);

  // Update highlight when range changes
  useEffect(() => {
    updateHighlight();
  }, [updateHighlight]);

  // Real-time updates
  useEffect(() => {
    if (!isLive) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      if (!candleSeriesRef.current || dataRef.current.length === 0) return;
      const lastCandle = dataRef.current[dataRef.current.length - 1];
      const shouldCreateNew = Math.random() > 0.85;

      if (shouldCreateNew) {
        const newTime = getNextBusinessDay(timeToString(lastCandle.time));
        const volatility = lastCandle.close * 0.015;
        const open = lastCandle.close + (Math.random() - 0.5) * volatility * 0.3;
        const close = open + (Math.random() - 0.48) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility * 0.3;
        const low = Math.min(open, close) - Math.random() * volatility * 0.3;
        const newCandle: CandlestickData = { time: newTime as Time, open: Math.round(open), high: Math.round(high), low: Math.round(low), close: Math.round(close) };
        dataRef.current.push(newCandle);
        allDatesRef.current.push(newTime);
        candleSeriesRef.current.update(newCandle);
        updatePriceState(dataRef.current);
      } else {
        const volatility = lastCandle.close * 0.004;
        const tick = (Math.random() - 0.48) * volatility;
        const newClose = lastCandle.close + tick;
        const updated: CandlestickData = { ...lastCandle, close: Math.round(newClose), high: Math.round(Math.max(lastCandle.high, newClose)), low: Math.round(Math.min(lastCandle.low, newClose)) };
        dataRef.current[dataRef.current.length - 1] = updated;
        candleSeriesRef.current.update(updated);
        updatePriceState(dataRef.current);
      }
    }, 800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLive, updatePriceState]);

  useEffect(() => {
    initChart();
    return () => { if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } };
  }, [initChart]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (!chartRef.current || !containerRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Re-apply theme colors when light/dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!chartRef.current) return;
      const tc = getThemeColors();
      chartRef.current.applyOptions({
        layout: { background: { type: ColorType.Solid, color: tc.bg }, textColor: tc.text },
        grid: { vertLines: { color: tc.grid }, horzLines: { color: tc.grid } },
        rightPriceScale: { borderColor: tc.border },
        timeScale: { borderColor: tc.border },
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, [getThemeColors]);

  // Toggle chart interactions based on select mode
  useEffect(() => {
    if (!chartRef.current) return;
    if (selectMode) {
      chartRef.current.applyOptions({
        handleScroll: { mouseWheel: false, pressedMouseMove: false, horzTouchDrag: false, vertTouchDrag: false },
        handleScale: { axisPressedMouseMove: { time: false, price: false }, mouseWheel: false, pinch: false },
      });
    } else {
      chartRef.current.applyOptions({
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
        handleScale: { axisPressedMouseMove: { time: true, price: true }, mouseWheel: true, pinch: true },
      });
      setSelBox(null);
      setSelecting(false);
    }
  }, [selectMode]);

  // Selection drag handlers
  const handleSelMouseDown = useCallback((e: React.MouseEvent) => {
    if (!selectMode || !chartWrapRef.current) return;
    const rect = chartWrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    selStartRef.current = { x, y: 0 };
    const box = { x, y: 0, w: 0, h: rect.height };
    selBoxRef.current = box;
    setSelecting(true);
    setSelBox(box);
  }, [selectMode]);

  const handleSelMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selecting || !selStartRef.current || !chartWrapRef.current) return;
    const rect = chartWrapRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const startX = selStartRef.current.x;
    const box = {
      x: Math.min(startX, curX),
      y: 0,
      w: Math.abs(curX - startX),
      h: rect.height,
    };
    selBoxRef.current = box;
    setSelBox(box);
  }, [selecting]);

  const handleSelMouseUp = useCallback(() => {
    const box = selBoxRef.current;
    if (!selecting || !selStartRef.current || !chartRef.current || !box || box.w < 5) {
      setSelecting(false);
      setSelBox(null);
      selBoxRef.current = null;
      return;
    }

    const chart = chartRef.current;
    const timeScale = chart.timeScale();

    const leftTime = timeScale.coordinateToTime(box.x);
    const rightTime = timeScale.coordinateToTime(box.x + box.w);

    if (leftTime && rightTime) {
      let from = timeToString(leftTime as Time);
      let to = timeToString(rightTime as Time);
      if (from > to) [from, to] = [to, from];

      const availFrom = allDatesRef.current.find((d) => d >= from) ?? allDatesRef.current[0];
      const availTo = [...allDatesRef.current].reverse().find((d) => d <= to) ?? allDatesRef.current[allDatesRef.current.length - 1];

      if (availFrom && availTo && availFrom <= availTo) {
        setDateFrom(availFrom);
        setDateTo(availTo);
      }
    }

    setSelecting(false);
    setSelBox(null);
    selBoxRef.current = null;
    setSelectMode(false);
  }, [selecting]);

  const handleTimeframe = (tf: TimeframeKey) => {
    setActiveTimeframe(tf);
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const data = dataRef.current;
    if (data.length === 0) return;
    const spacingMap: Record<TimeframeKey, number> = {
      '1D': 40, '1W': 24, '1M': 14, '3M': 8, '6M': 5, '1Y': 4, '5Y': 2, 'ALL': 1.5,
    };
    timeScale.applyOptions({ barSpacing: spacingMap[tf] });
    if (tf === 'ALL') { timeScale.fitContent(); return; }
    const found = TIMEFRAMES.find((t) => t.key === tf);
    if (!found) return;
    const lastTime = timeToString(data[data.length - 1].time);
    const endDate = new Date(lastTime + 'T00:00:00');
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - found.days);
    const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    timeScale.setVisibleRange({ from: startStr as Time, to: lastTime as Time });
  };

  const ohlc = crosshairData;
  const displayPrice = ohlc ? ohlc.close : lastPrice;
  const displayChange = ohlc ? ohlc.change : priceChange;
  const displayChangePct = ohlc ? ohlc.changePercent : priceChangePercent;
  const isPositive = displayChange >= 0;
  const lastData = dataRef.current[dataRef.current.length - 1];

  const daysInRange = useMemo(() => {
    return allDates.filter((d) => d >= dateFrom && d <= dateTo).length;
  }, [dateFrom, dateTo, allDates]);

  return (
    <div className="tv-layout">
      {/* Title */}
      <div style={{ padding: '10px 14px 0', fontSize: 12, fontWeight: 600, color: 'var(--tv-text-strong)', fontFamily: 'var(--sans)' }}>
        Balans
      </div>
      {/* OHLC overlay */}
      <div className="tv-ohlc-overlay">
        <span className="tv-ohlc-label">O</span>
        <span className={`tv-ohlc-val ${ohlc ? (ohlc.close >= ohlc.open ? 'up' : 'down') : (isPositive ? 'up' : 'down')}`}>
          {formatSum(ohlc?.open ?? lastData?.open ?? 0)}
        </span>
        <span className="tv-ohlc-label">H</span>
        <span className={`tv-ohlc-val ${ohlc ? (ohlc.close >= ohlc.open ? 'up' : 'down') : (isPositive ? 'up' : 'down')}`}>
          {formatSum(ohlc?.high ?? lastData?.high ?? 0)}
        </span>
        <span className="tv-ohlc-label">L</span>
        <span className={`tv-ohlc-val ${ohlc ? (ohlc.close >= ohlc.open ? 'up' : 'down') : (isPositive ? 'up' : 'down')}`}>
          {formatSum(ohlc?.low ?? lastData?.low ?? 0)}
        </span>
        <span className="tv-ohlc-label">C</span>
        <span className={`tv-ohlc-val ${ohlc ? (ohlc.close >= ohlc.open ? 'up' : 'down') : (isPositive ? 'up' : 'down')}`}>
          {formatSum(ohlc?.close ?? lastData?.close ?? 0)}
        </span>
        <span className="tv-ohlc-price">
          {formatSumFull(displayPrice)}
        </span>
        <span className={`tv-ohlc-change ${isPositive ? 'up' : 'down'}`}>
          {isPositive ? '+' : ''}{formatSum(displayChange)} ({isPositive ? '+' : ''}{displayChangePct.toFixed(2)}%)
        </span>
      </div>

      {/* Chart area - full */}
      <div className="tv-main">
        <div className="tv-chart-wrap" ref={chartWrapRef}>
          <div ref={containerRef} className="tv-chart-area" />
        </div>
      </div>
    </div>
  );
}
