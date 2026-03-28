import { useCallback, useMemo, useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Customized,
} from 'recharts';

// ──── Types ────

interface OHLCDay {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  base: number;
  body: number;
  isUp: boolean;
}

type TimeframeKey = '1M' | '3M' | '6M' | '1Y' | 'ALL';

const TIMEFRAMES: { key: TimeframeKey; label: string; days: number }[] = [
  { key: '1M', label: '1 Oy', days: 30 },
  { key: '3M', label: '3 Oy', days: 90 },
  { key: '6M', label: '6 Oy', days: 180 },
  { key: '1Y', label: '1 Yil', days: 365 },
  { key: 'ALL', label: 'Barchasi', days: 9999 },
];

const MIN_VISIBLE = 20;
const MAX_VISIBLE = 500;

// ──── Helpers ────

const formatSum = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + ' mlrd';
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' mln';
  if (abs >= 1_000) return (v / 1_000).toFixed(0) + ' ming';
  return v.toFixed(0);
};

const formatSumFull = (v: number) =>
  new Intl.NumberFormat('uz-UZ').format(Math.round(v)) + " so'm";

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

// ──── Data generation ────

function generateHistoricalData(days: number = 1825): OHLCDay[] {
  const data: OHLCDay[] = [];
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

    const o = Math.round(open);
    const c = Math.round(close);
    const h = Math.round(high);
    const l = Math.round(low);
    const isUp = c >= o;

    data.push({
      date: `${year}-${month}-${day}`,
      open: o,
      high: h,
      low: l,
      close: c,
      base: Math.min(o, c),
      body: Math.abs(c - o) || 1,
      isUp,
    });
    basePrice = close;
  }
  return data;
}

// ──── Wick renderer ────

function WickLayer(props: any) {
  const { formattedGraphicalItems, yAxisMap } = props;
  if (!yAxisMap || !formattedGraphicalItems) return null;

  const yAxis = Object.values(yAxisMap)[0] as any;
  if (!yAxis?.scale) return null;
  const yScale = yAxis.scale;

  const bodyBar = formattedGraphicalItems[1];
  if (!bodyBar?.props?.data) return null;
  const items = bodyBar.props.data;

  return (
    <g>
      {items.map((item: any, i: number) => {
        const d: OHLCDay = item.payload;
        if (!d) return null;
        const cx = item.x + item.width / 2;
        const color = d.isUp ? '#26a69a' : '#ef5350';
        return (
          <line
            key={i}
            x1={cx}
            y1={yScale(d.high)}
            x2={cx}
            y2={yScale(d.low)}
            stroke={color}
            strokeWidth={1}
          />
        );
      })}
    </g>
  );
}

// ──── Custom tooltip ────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]?.payload) return null;
  const d: OHLCDay = payload[0].payload;
  const color = d.isUp ? '#26a69a' : '#ef5350';

  return (
    <div className="rounded-lg border bg-card p-3 shadow-md text-sm space-y-1">
      <p className="font-medium text-muted-foreground">{formatDateShort(d.date)}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-xs">
        <span className="text-muted-foreground">Ochilish:</span>
        <span style={{ color }}>{formatSum(d.open)}</span>
        <span className="text-muted-foreground">Yuqori:</span>
        <span style={{ color }}>{formatSum(d.high)}</span>
        <span className="text-muted-foreground">Past:</span>
        <span style={{ color }}>{formatSum(d.low)}</span>
        <span className="text-muted-foreground">Yopilish:</span>
        <span className="font-semibold" style={{ color }}>{formatSum(d.close)}</span>
      </div>
    </div>
  );
}

// ──── Main component ────

export default function CandlestickChart() {
  const allData = useRef(generateHistoricalData());
  const [activeTimeframe, setActiveTimeframe] = useState<TimeframeKey>('1Y');

  // Zoom/pan state: endIndex is always the right edge, visibleCount is how many bars visible
  const [visibleCount, setVisibleCount] = useState<number | null>(null); // null = use timeframe
  const [endIndex, setEndIndex] = useState<number | null>(null); // null = end of data
  const dragRef = useRef<{ startX: number; startEnd: number } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const sourceData = allData.current;

  // When timeframe changes, reset zoom/pan
  const handleTimeframe = useCallback((key: TimeframeKey) => {
    setActiveTimeframe(key);
    setVisibleCount(null);
    setEndIndex(null);
  }, []);

  // Compute the visible window
  const { chartData, windowStart, windowEnd } = useMemo(() => {
    let count: number;
    if (visibleCount != null) {
      count = visibleCount;
    } else {
      const tf = TIMEFRAMES.find((t) => t.key === activeTimeframe);
      count = (!tf || tf.key === 'ALL') ? sourceData.length : Math.min(tf.days, sourceData.length);
    }
    count = Math.max(MIN_VISIBLE, Math.min(MAX_VISIBLE, count, sourceData.length));

    const end = endIndex != null ? Math.min(endIndex, sourceData.length) : sourceData.length;
    const start = Math.max(0, end - count);
    const actualEnd = start + count;

    return {
      chartData: sourceData.slice(start, actualEnd),
      windowStart: start,
      windowEnd: actualEnd,
    };
  }, [sourceData, activeTimeframe, visibleCount, endIndex]);

  const lastCandle = chartData[chartData.length - 1];
  const prevCandle = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const change = prevCandle ? lastCandle.close - prevCandle.close : 0;
  const changePct = prevCandle ? (change / prevCandle.close) * 100 : 0;
  const isPositive = change >= 0;

  const [yMin, yMax] = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const d of chartData) {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
    }
    const pad = (max - min) * 0.05;
    return [min - pad, max + pad];
  }, [chartData]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const currentCount = windowEnd - windowStart;
    const zoomStep = Math.max(2, Math.round(currentCount * 0.1));
    let newCount: number;

    if (e.deltaY > 0) {
      // Zoom out
      newCount = Math.min(MAX_VISIBLE, currentCount + zoomStep, sourceData.length);
    } else {
      // Zoom in
      newCount = Math.max(MIN_VISIBLE, currentCount - zoomStep);
    }

    setVisibleCount(newCount);
    // Keep the right edge pinned
    if (endIndex == null) {
      setEndIndex(sourceData.length);
    }
  }, [windowStart, windowEnd, sourceData.length, endIndex]);

  // Drag to pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startEnd: endIndex ?? sourceData.length,
    };
  }, [endIndex, sourceData.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current || !chartContainerRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const containerWidth = chartContainerRef.current.clientWidth;
    const currentCount = windowEnd - windowStart;
    // Convert pixel drag to bar offset
    const barsPerPixel = currentCount / containerWidth;
    const barShift = Math.round(dx * barsPerPixel);
    const newEnd = Math.max(currentCount, Math.min(sourceData.length, dragRef.current.startEnd - barShift));
    setEndIndex(newEnd);
  }, [sourceData.length, windowStart, windowEnd]);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div className="flex flex-col h-full w-full rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-base">Balans</h3>
          <span className="font-mono text-sm font-bold">
            {formatSumFull(lastCandle?.close ?? 0)}
          </span>
          <span
            className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
              isPositive
                ? 'text-green-600 bg-green-500/10'
                : 'text-red-500 bg-red-500/10'
            }`}
          >
            {isPositive ? '+' : ''}
            {formatSum(change)} ({isPositive ? '+' : ''}
            {changePct.toFixed(2)}%)
          </span>
        </div>

        <div className="flex gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.key}
              onClick={() => handleTimeframe(tf.key)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                activeTimeframe === tf.key && visibleCount == null
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* OHLC info bar */}
      <div className="flex items-center gap-3 px-4 py-1.5 text-xs font-mono text-muted-foreground border-b">
        <span>
          O{' '}
          <span className={lastCandle?.isUp ? 'text-green-600' : 'text-red-500'}>
            {formatSum(lastCandle?.open ?? 0)}
          </span>
        </span>
        <span>
          H{' '}
          <span className={lastCandle?.isUp ? 'text-green-600' : 'text-red-500'}>
            {formatSum(lastCandle?.high ?? 0)}
          </span>
        </span>
        <span>
          L{' '}
          <span className={lastCandle?.isUp ? 'text-green-600' : 'text-red-500'}>
            {formatSum(lastCandle?.low ?? 0)}
          </span>
        </span>
        <span>
          C{' '}
          <span className={lastCandle?.isUp ? 'text-green-600' : 'text-red-500'}>
            {formatSum(lastCandle?.close ?? 0)}
          </span>
        </span>
      </div>

      {/* Chart */}
      <div
        ref={chartContainerRef}
        className="flex-1 min-h-0 cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
            barCategoryGap="20%"
          >
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={formatSum}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={70}
              orientation="right"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="base"
              stackId="candle"
              fill="transparent"
              isAnimationActive={false}
            />
            <Bar
              dataKey="body"
              stackId="candle"
              isAnimationActive={false}
              radius={[1, 1, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.isUp ? '#26a69a' : '#ef5350'} />
              ))}
            </Bar>
            <Customized component={WickLayer} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
