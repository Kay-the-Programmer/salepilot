
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { StoreSettings } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import MinusCircleIcon from '../components/icons/MinusCircleIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import ScaleIcon from '../components/icons/ScaleIcon';
import ReportBlock from '../components/reports/ReportBlock';
import ReceiptTaxIcon from '../components/icons/ReceiptTaxIcon';
import ReceiptPercentIcon from '../components/icons/ReceiptPercentIcon';
import ArchiveBoxIcon from '../components/icons/ArchiveBoxIcon';
import UsersIcon from '../components/icons/UsersIcon';
import ArrowDownTrayIcon from '../components/icons/ArrowDownTrayIcon';
import { formatCurrency } from '../utils/currency';
import PlusIcon from '../components/icons/PlusIcon';
import TrendingDownIcon from '../components/icons/TrendingDownIcon';
import { api } from '../services/api';


interface ReportsPageProps {
    storeSettings: StoreSettings;
}

const toDateInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface DashboardData {
    salesTrend: { date: string; revenue: number; profit: number }[];
    // other properties from getDashboardData...
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; noWrap?: boolean; }> = ({ title, value, icon, color, noWrap = false }) => (
    <div className="relative overflow-hidden rounded-lg bg-white p-4 sm:p-5 shadow">
        <div className={`absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full ${color} opacity-20`}></div>
        <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md p-2.5 sm:p-3 ${color} bg-opacity-10`}>
                {icon}
            </div>
            <div className="ml-4 sm:ml-5 w-0 flex-1 min-w-0">
                <dl>
                    <dt className={`${noWrap ? 'whitespace-nowrap' : 'truncate'} text-xs sm:text-sm font-medium text-gray-500`}>{title}</dt>
                    <dd>
                        <div className={`${noWrap ? '' : ''} max-w-full`}>
                            <div className={`text-xl sm:text-2xl font-bold text-gray-900 ${noWrap ? 'whitespace-nowrap inline-block min-w-max' : 'break-words'}`}>{value}</div>
                        </div>
                    </dd>
                </dl>
            </div>
        </div>
    </div>
);

const SalesTrendChart: React.FC<{ data: { date: string; revenue: number; profit: number }[], storeSettings: StoreSettings }> = ({ data, storeSettings }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; revenue: number; profit: number } | null>(null);
    const svgRef = React.useRef<SVGSVGElement>(null);
    const padding = { top: 20, right: 30, bottom: 30, left: 80 };
    const width = 800;
    const height = 300;

    if (data.length === 0) {
        return <div className="text-center text-gray-500 py-10">No data available for the selected period.</div>;
    }

    const maxRevenue = Math.max(...data.map(d => d.revenue), 0) * 1.1 || 100;

    const xScale = (index: number) => padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
    const yScale = (value: number) => height - padding.bottom - (value / maxRevenue) * (height - padding.top - padding.bottom);

    const revenuePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.revenue)}`).join(' ');
    const profitPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.profit)}`).join(' ');

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const index = Math.round(((x - padding.left) / (width - padding.left - padding.right)) * (data.length - 1));

        if (index >= 0 && index < data.length) {
            const point = data[index];
            setTooltip({
                x: xScale(index),
                y: e.clientY - rect.top,
                date: new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                revenue: point.revenue,
                profit: point.profit,
            });
        }
    };
    
    return (
        <div className="relative">
            <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)} className="w-full h-auto">
                {/* Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                     const y = padding.top + tick * (height - padding.top - padding.bottom);
                     const value = maxRevenue * (1-tick);
                     return (
                         <g key={tick} className="text-xs text-gray-400">
                             <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="currentColor" strokeDasharray="2,3" />
                             <text x={padding.left - 8} y={y + 4} textAnchor="end">{formatCurrency(value, storeSettings)}</text>
                         </g>
                     )
                })}
                {/* X-axis labels */}
                {data.map((d, i) => {
                    if (data.length > 1 && i % Math.ceil(data.length / 10) === 0) {
                        return (
                            <text key={i} x={xScale(i)} y={height - padding.bottom + 15} textAnchor="middle" className="text-xs text-gray-500">
                                {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </text>
                        );
                    }
                    return null;
                })}

                <path d={profitPath} fill="none" stroke="#22c55e" strokeWidth="2" />
                <path d={revenuePath} fill="none" stroke="#3b82f6" strokeWidth="2" />

                {tooltip && (
                    <g>
                        <line x1={tooltip.x} y1={padding.top} x2={tooltip.x} y2={height - padding.bottom} stroke="rgba(0,0,0,0.2)" strokeDasharray="4,2"/>
                        <circle cx={tooltip.x} cy={yScale(tooltip.revenue)} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                        <circle cx={tooltip.x} cy={yScale(tooltip.profit)} r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                    </g>
                )}
            </svg>
            {tooltip && (
                <div className="absolute p-2 text-xs bg-white rounded-lg shadow-lg pointer-events-none" style={{ top: `${tooltip.y + 5}px`, left: `${tooltip.x + 5}px`, minWidth: '120px' }}>
                    <p className="font-bold">{tooltip.date}</p>
                    <p className="flex justify-between">
                        <span className="text-blue-600">Revenue:</span>
                        <span className="font-semibold">{formatCurrency(tooltip.revenue, storeSettings)}</span>
                    </p>
                    <p className="flex justify-between">
                        <span className="text-green-600">Profit:</span>
                        <span className="font-semibold">{formatCurrency(tooltip.profit, storeSettings)}</span>
                    </p>
                </div>
            )}
        </div>
    );
};

const CashflowChart: React.FC<{ data: { date: string; inflow: number; outflow: number }[], storeSettings: StoreSettings }> = ({ data, storeSettings }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; inflow: number; outflow: number } | null>(null);
    const svgRef = React.useRef<SVGSVGElement>(null);
    const padding = { top: 20, right: 30, bottom: 30, left: 80 };
    const width = 800;
    const height = 300;

    if (data.length === 0) {
        return <div className="text-center text-gray-500 py-10">No cashflow data available for the selected period.</div>;
    }

    const maxVal = Math.max(...data.flatMap(d => [d.inflow, d.outflow]), 0) * 1.1 || 100;

    const xScale = (index: number) => padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
    const yScale = (value: number) => height - padding.bottom - (value / maxVal) * (height - padding.top - padding.bottom);

    const inflowPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.inflow)}`).join(' ');
    const outflowPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.outflow)}`).join(' ');

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const index = Math.round(((x - padding.left) / (width - padding.left - padding.right)) * (data.length - 1));

        if (index >= 0 && index < data.length) {
            const point = data[index];
            setTooltip({
                x: xScale(index),
                y: e.clientY - rect.top,
                date: new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                inflow: point.inflow,
                outflow: point.outflow,
            });
        }
    };
    
    return (
        <div className="relative">
            <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)} className="w-full h-auto">
                {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                     const y = padding.top + tick * (height - padding.top - padding.bottom);
                     const value = maxVal * (1-tick);
                     return (
                         <g key={tick} className="text-xs text-gray-400">
                             <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="currentColor" strokeDasharray="2,3" />
                             <text x={padding.left - 8} y={y + 4} textAnchor="end">{formatCurrency(value, storeSettings)}</text>
                         </g>
                     )
                })}
                {data.map((d, i) => {
                    if (data.length > 1 && i % Math.ceil(data.length / 10) === 0) {
                        return (
                            <text key={i} x={xScale(i)} y={height - padding.bottom + 15} textAnchor="middle" className="text-xs text-gray-500">
                                {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </text>
                        );
                    }
                    return null;
                })}

                <path d={outflowPath} fill="none" stroke="#ef4444" strokeWidth="2" />
                <path d={inflowPath} fill="none" stroke="#22c55e" strokeWidth="2" />

                {tooltip && (
                    <g>
                        <line x1={tooltip.x} y1={padding.top} x2={tooltip.x} y2={height - padding.bottom} stroke="rgba(0,0,0,0.2)" strokeDasharray="4,2"/>
                        <circle cx={tooltip.x} cy={yScale(tooltip.inflow)} r="4" fill="#22c55e" stroke="white" strokeWidth="2" />
                        <circle cx={tooltip.x} cy={yScale(tooltip.outflow)} r="4" fill="#ef4444" stroke="white" strokeWidth="2" />
                    </g>
                )}
            </svg>
            {tooltip && (
                <div className="absolute p-2 text-xs bg-white rounded-lg shadow-lg pointer-events-none" style={{ top: `${tooltip.y + 5}px`, left: `${tooltip.x + 5}px`, minWidth: '120px' }}>
                    <p className="font-bold">{tooltip.date}</p>
                    <p className="flex justify-between">
                        <span className="text-green-600">Inflow:</span>
                        <span className="font-semibold">{formatCurrency(tooltip.inflow, storeSettings)}</span>
                    </p>
                    <p className="flex justify-between">
                        <span className="text-red-600">Outflow:</span>
                        <span className="font-semibold">{formatCurrency(tooltip.outflow, storeSettings)}</span>
                    </p>
                </div>
            )}
        </div>
    );
};


const ReportsPage: React.FC<ReportsPageProps> = ({ storeSettings }) => {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 29); // 30 days including today
        return toDateInputString(d);
    });
    const [endDate, setEndDate] = useState(toDateInputString(new Date()));
    const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem('reports.activeTab') || 'sales');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [showFiltersMobile, setShowFiltersMobile] = useState(false);

    const [reportData, setReportData] = useState<any | null>(null);
    const [dailySales, setDailySales] = useState<{ date: string; totalRevenue: number; totalQuantity: number; items: { name: string; quantity: number; revenue: number }[] }[] | null>(null);
    const [dailyPage, setDailyPage] = useState<number>(1);
    const [dailyPageSize, setDailyPageSize] = useState<number>(7);
    const [personalUse, setPersonalUse] = useState<{ id: string; timestamp: string; userName: string; productName: string; fromQty: number | null; toQty: number | null; change: number | null }[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Command palette state (Ctrl+K)
    const [isCmdOpen, setIsCmdOpen] = useState(false);
    const [cmdQuery, setCmdQuery] = useState('');

    // Available commands to switch tabs quickly
    const commands = useMemo(() => ([
        { label: 'Sales Reports', tab: 'sales' },
        { label: 'Inventory Reports', tab: 'inventory' },
        { label: 'Customer Reports', tab: 'customers' },
        { label: 'Cashflow', tab: 'cashflow' },
        { label: 'Personal Use', tab: 'personal-use' },
    ]), [] as any[]);

    const filteredCommands = useMemo(() => {
        const q = cmdQuery.toLowerCase();
        return (commands as {label:string; tab:string}[]).filter(c => c.label.toLowerCase().includes(q));
    }, [commands, cmdQuery]);

    useEffect(() => {
        localStorage.setItem('reports.activeTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const key = (e.key || '').toLowerCase();
            if ((e.ctrlKey || e.metaKey) && key === 'k') {
                e.preventDefault();
                setIsCmdOpen(prev => !prev);
            } else if (key === 'escape') {
                setIsCmdOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        const fetchReportData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [dash, daily, pu] = await Promise.all([
                    api.get(`/reports/dashboard?startDate=${startDate}&endDate=${endDate}`),
                    api.get(`/reports/daily-sales?startDate=${startDate}&endDate=${endDate}`),
                    api.get(`/reports/personal-use?startDate=${startDate}&endDate=${endDate}`),
                ]);
                setReportData(dash);
                setDailySales(daily.daily || []);
                setPersonalUse(pu.items || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReportData();
    }, [startDate, endDate]);

    // Reset daily pagination when the dataset or date range changes
    useEffect(() => {
        setDailyPage(1);
    }, [dailySales, startDate, endDate]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const setDatePreset = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        setStartDate(toDateInputString(start));
        setEndDate(toDateInputString(end));
    };
    
    const setThisMonth = () => {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth(), 1);
        setStartDate(toDateInputString(start));
        setEndDate(toDateInputString(end));
    }
    
    const salesTrend = useMemo(() => {
        if (!reportData?.sales?.salesTrend) return [];
        const trend = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
         for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = toDateInputString(d);
            trend.push({
                date: dateStr,
                revenue: reportData.sales.salesTrend[dateStr]?.revenue || 0,
                profit: reportData.sales.salesTrend[dateStr]?.profit || 0,
            });
        }
        return trend;
    }, [reportData, startDate, endDate]);

    const cashflowTrend = useMemo(() => {
        if (!reportData?.cashflow?.cashflowTrend) return [];
        const trend = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
         for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = toDateInputString(d);
            trend.push({
                date: dateStr,
                inflow: reportData.cashflow.cashflowTrend[dateStr]?.inflow || 0,
                outflow: reportData.cashflow.cashflowTrend[dateStr]?.outflow || 0,
            });
        }
        return trend;
    }, [reportData, startDate, endDate]);

    const handleExportCSV = () => {
        // This is a simplified export now, based on aggregated data
        const dateString = `${startDate}_to_${endDate}`;
        let headers: string[] = [];
        let rows: any[][] = [];

        if (activeTab === 'sales' && reportData?.sales) {
            headers = ['Product Name', 'Units Sold', 'Total Revenue'];
            rows = reportData.sales.topProductsByRevenue.map((p: any) => [p.name, p.quantity, p.revenue]);
        }
        // Add more export types for other tabs if needed

        if (headers.length === 0) {
            alert("No data to export for this tab.");
            return;
        }

        const escapeCsvCell = (cell: any) => {
            if (cell == null) return '';
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        };

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers, ...rows].map(e => e.map(escapeCsvCell).join(",")).join("\n");
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `${activeTab}_report_${dateString}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleExportPDF = () => {
         const doc = new jsPDF();
        const dateString = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
        
        doc.setFontSize(18);
        doc.text(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Date Range: ${dateString}`, 14, 29);

        if (activeTab === 'sales' && reportData?.sales) {
            (doc as any).autoTable({
                startY: 35,
                body: [
                    [`Revenue: ${formatCurrency(reportData.sales.totalRevenue, storeSettings)}`, `Gross Profit: ${formatCurrency(reportData.sales.totalProfit, storeSettings)}`],
                    [`Transactions: ${reportData.sales.totalTransactions}`, `Avg. Sale: ${formatCurrency(reportData.sales.avgSaleValue, storeSettings)}`],
                ],
                theme: 'plain',
            });
             (doc as any).autoTable({
                head: [['Top Products by Revenue', 'Revenue']],
                body: reportData.sales.topProductsByRevenue.map((p: any) => [p.name, formatCurrency(p.revenue, storeSettings)]),
                startY: (doc as any).lastAutoTable.finalY + 10,
            });
        }
        // Add more PDF export logic for other tabs if needed

        doc.save(`${activeTab}_report_${dateString}.pdf`);
    };

    const TableRow: React.FC<{ label: string, value: string, rank: number }> = ({ label, value, rank }) => (
        <tr className="hover:bg-gray-50">
            <td className="px-2 py-2 text-sm text-gray-500">{rank}</td>
            <td className="px-2 py-2 text-sm text-gray-900 font-medium truncate" title={label}>{label}</td>
            <td className="px-2 py-2 text-sm text-gray-900 text-right font-semibold">{value}</td>
        </tr>
    );

    const TabButton: React.FC<{ tabName: string, label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 md-2 text-sm font-medium rounded-lg  
                ${activeTab === tabName 
                    ? 'border-gray-600 font-extrabold  text-gray-600 bg-gray-200' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
            }
        >
            {label}
        </button>
    );
    
    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center p-10">Loading report data...</div>;
        }
        if (error) {
            return <div className="text-center p-10 text-red-500">Error loading report: {error}</div>;
        }
        if (!reportData) {
            return <div className="text-center p-10 text-gray-500">No data available for the selected period.</div>;
        }
        
        switch (activeTab) {
            case 'sales':
                const sales = reportData.sales;
                return (
                    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                           <StatCard title="Revenue" value={formatCurrency(sales.totalRevenue, storeSettings)} icon={<CurrencyDollarIcon className="h-6 w-6 text-green-600"/>} color="bg-green-100" />
                           <StatCard title="Gross Profit" value={formatCurrency(sales.totalProfit, storeSettings)} icon={<TrendingUpIcon className="h-6 w-6 text-blue-600"/>} color="bg-blue-100" />
                           <StatCard title="Gross Margin" value={`${sales.grossMargin.toFixed(1)}%`} icon={<ReceiptPercentIcon className="h-6 w-6 text-yellow-600"/>} color="bg-yellow-100" />
                           <StatCard title="Transactions" value={`${sales.totalTransactions}`} icon={<ReceiptTaxIcon className="h-6 w-6 text-indigo-600"/>} color="bg-indigo-100" />
                           <StatCard title="Avg. Sale" value={formatCurrency(sales.avgSaleValue, storeSettings)} icon={<ScaleIcon className="h-6 w-6 text-purple-600"/>} color="bg-purple-100" />
                           <StatCard title="COGS" value={formatCurrency(sales.totalCogs, storeSettings)} icon={<MinusCircleIcon className="h-6 w-6 text-red-600"/>} color="bg-red-100" />
                        </div>
                        <ReportBlock title="Sales Trend">
                            <div className="flex items-center space-x-4 pl-6 pb-2 text-sm">
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>Revenue</div>
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>Profit</div>
                            </div>
                            <SalesTrendChart data={salesTrend} storeSettings={storeSettings} />
                        </ReportBlock>
                        {dailySales && dailySales.length > 0 && (
                            <ReportBlock title="Daily Sales (Products)">
                                {(() => {
                                    const allDays = dailySales || [];
                                    const totalDailyPages = Math.max(1, Math.ceil(allDays.length / dailyPageSize));
                                    const safePage = Math.min(dailyPage, totalDailyPages);
                                    const startIdx = (safePage - 1) * dailyPageSize;
                                    const pageDays = allDays.slice(startIdx, startIdx + dailyPageSize);
                                    return (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-sm text-gray-600">
                                                    Showing <strong>{startIdx + 1}</strong> - <strong>{Math.min(startIdx + dailyPageSize, allDays.length)}</strong> of <strong>{allDays.length}</strong> days
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm text-gray-600" htmlFor="dailyPageSize">Per page:</label>
                                                    <select
                                                        id="dailyPageSize"
                                                        className="border rounded-md p-1 text-sm"
                                                        value={dailyPageSize}
                                                        onChange={(e) => { setDailyPageSize(parseInt(e.target.value) || 7); setDailyPage(1); }}
                                                        aria-label="Daily sales days per page"
                                                    >
                                                        <option value={5}>5</option>
                                                        <option value={7}>7</option>
                                                        <option value={10}>10</option>
                                                        <option value={14}>14</option>
                                                        <option value={30}>30</option>
                                                    </select>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            className="px-2 py-1 text-sm border rounded disabled:opacity-50"
                                                            onClick={() => setDailyPage(p => Math.max(1, p - 1))}
                                                            disabled={safePage <= 1}
                                                            aria-label="Previous days"
                                                        >
                                                            Prev
                                                        </button>
                                                        <span className="text-sm text-gray-700 px-2">Page {safePage} / {totalDailyPages}</span>
                                                        <button
                                                            className="px-2 py-1 text-sm border rounded disabled:opacity-50"
                                                            onClick={() => setDailyPage(p => Math.min(totalDailyPages, p + 1))}
                                                            disabled={safePage >= totalDailyPages}
                                                            aria-label="Next days"
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {pageDays.map(day => (
                                                <div key={day.date} className="border rounded-md">
                                                    <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                                                        <div className="font-semibold text-gray-800">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                        <div className="text-sm text-gray-600 flex items-center gap-4">
                                                            <span>Total Qty: <strong>{day.totalQuantity.toLocaleString()}</strong></span>
                                                            <span>Total Revenue: <strong>{formatCurrency(day.totalRevenue, storeSettings)}</strong></span>
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <table className="min-w-full">
                                                            <thead>
                                                                <tr className="text-xs uppercase text-gray-500">
                                                                    <th className="text-left px-2 py-1">Product</th>
                                                                    <th className="text-center px-2 py-1">Qty</th>
                                                                    <th className="text-right px-2 py-1">Revenue</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {day.items.map((item, idx) => (
                                                                    <tr key={item.name + idx} className="border-t hover:bg-gray-50">
                                                                        <td className="px-2 py-1 text-sm">{item.name}</td>
                                                                        <td className="px-2 py-1 text-sm text-center">{item.quantity}</td>
                                                                        <td className="px-2 py-1 text-sm text-right font-medium">{formatCurrency(item.revenue, storeSettings)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex items-center justify-end gap-2 pt-2">
                                                <button
                                                    className="px-2 py-1 text-sm border rounded disabled:opacity-50"
                                                    onClick={() => setDailyPage(p => Math.max(1, p - 1))}
                                                    disabled={safePage <= 1}
                                                    aria-label="Previous days"
                                                >
                                                    Prev
                                                </button>
                                                <span className="text-sm text-gray-700 px-2">Page {safePage} / {totalDailyPages}</span>
                                                <button
                                                    className="px-2 py-1 text-sm border rounded disabled:opacity-50"
                                                    onClick={() => setDailyPage(p => Math.min(totalDailyPages, p + 1))}
                                                    disabled={safePage >= totalDailyPages}
                                                    aria-label="Next days"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </ReportBlock>
                        )}
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ReportBlock title="Top Selling Products by Revenue"><table className="w-full"><tbody>{sales.topProductsByRevenue.map((p: any, i: number) => <TableRow key={p.name} rank={i+1} label={p.name} value={formatCurrency(p.revenue, storeSettings)} />)}</tbody></table></ReportBlock>
                            <ReportBlock title="Top Selling Products by Units"><table className="w-full"><tbody>{sales.topProductsByQuantity.map((p: any, i: number) => <TableRow key={p.name} rank={i+1} label={p.name} value={`${p.quantity} units`} />)}</tbody></table></ReportBlock>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ReportBlock title="Sales by Category"><table className="w-full"><tbody>{sales.salesByCategory.map((c: any, i: number) => <TableRow key={c.name} rank={i+1} label={c.name} value={formatCurrency(c.revenue, storeSettings)} />)}</tbody></table></ReportBlock>
                        </div>
                    </div>
                );
            case 'inventory':
                 const inventory = reportData.inventory;
                 return (
                     <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
                            <StatCard noWrap title="Inventory Retail Value" value={formatCurrency(inventory.totalRetailValue, storeSettings)} icon={<CurrencyDollarIcon className="h-6 w-6 text-blue-600"/>} color="bg-blue-100" />
                            <StatCard noWrap title="Inventory Cost Value" value={formatCurrency(inventory.totalCostValue, storeSettings)} icon={<MinusCircleIcon className="h-6 w-6 text-yellow-600"/>} color="bg-yellow-100" />
                            <StatCard noWrap title="Potential Profit" value={formatCurrency(inventory.potentialProfit, storeSettings)} icon={<TrendingUpIcon className="h-6 w-6 text-green-600"/>} color="bg-green-100" />
                            <StatCard noWrap title="Total Units on Hand" value={inventory.totalUnits.toLocaleString()} icon={<ArchiveBoxIcon className="h-6 w-6 text-purple-600"/>} color="bg-purple-100" />
                        </div>
                    </div>
                 );
            case 'customers':
                const customers = reportData.customers;
                return (
                    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard title="Total Customers" value={customers.totalCustomers.toLocaleString()} icon={<UsersIcon className="h-6 w-6 text-blue-600"/>} color="bg-blue-100" />
                            <StatCard title="Active Customers" value={customers.activeCustomersInPeriod.toLocaleString()} icon={<TrendingUpIcon className="h-6 w-6 text-green-600"/>} color="bg-green-100" />
                            <StatCard title="New Customers" value={customers.newCustomersInPeriod.toLocaleString()} icon={<PlusIcon className="h-6 w-6 text-indigo-600"/>} color="bg-indigo-100" />
                            <StatCard title="Store Credit Owed" value={formatCurrency(customers.totalStoreCreditOwed, storeSettings)} icon={<CurrencyDollarIcon className="h-6 w-6 text-yellow-600"/>} color="bg-yellow-100" />
                        </div>
                    </div>
                );
            case 'cashflow':
                 const cashflow = reportData.cashflow;
                 return (
                    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                           <StatCard title="Total Inflow" value={formatCurrency(cashflow.totalInflow, storeSettings)} icon={<TrendingUpIcon className="h-6 w-6 text-green-600"/>} color="bg-green-100" />
                           <StatCard title="Total Outflow" value={formatCurrency(cashflow.totalOutflow, storeSettings)} icon={<TrendingDownIcon className="h-6 w-6 text-red-600"/>} color="bg-red-100" />
                           <StatCard title="Net Cashflow" value={formatCurrency(cashflow.netCashflow, storeSettings)} icon={<ScaleIcon className={`h-6 w-6 ${cashflow.netCashflow >= 0 ? 'text-blue-600' : 'text-red-600'}`}/>} color={`${cashflow.netCashflow >= 0 ? 'bg-blue-100' : 'bg-red-100'}`} />
                        </div>
                         <ReportBlock title="Cashflow Trend">
                            <div className="flex items-center space-x-4 pl-6 pb-2 text-sm">
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>Inflow</div>
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>Outflow</div>
                            </div>
                            <CashflowChart data={cashflowTrend} storeSettings={storeSettings} />
                        </ReportBlock>
                    </div>
                 );
            case 'personal-use':
                 return (
                    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                        <ReportBlock title="Personal Use Adjustments">
                            {!personalUse || personalUse.length === 0 ? (
                                <div className="p-4 text-gray-500">No personal use records in this period.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="text-xs uppercase text-gray-500">
                                                <th className="text-left px-2 py-2">Date</th>
                                                <th className="text-left px-2 py-2">Product</th>
                                                <th className="text-center px-2 py-2">From</th>
                                                <th className="text-center px-2 py-2">To</th>
                                                <th className="text-center px-2 py-2">Change</th>
                                                <th className="text-left px-2 py-2">By</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {personalUse.map((item) => (
                                                <tr key={item.id} className="border-t hover:bg-gray-50">
                                                    <td className="px-2 py-2 text-sm">{new Date(item.timestamp).toLocaleString()}</td>
                                                    <td className="px-2 py-2 text-sm">{item.productName}</td>
                                                    <td className="px-2 py-2 text-sm text-center">{item.fromQty ?? '-'}</td>
                                                    <td className="px-2 py-2 text-sm text-center">{item.toQty ?? '-'}</td>
                                                    <td className={`px-2 py-2 text-sm text-center ${item.change != null && item.change < 0 ? 'text-red-600' : 'text-gray-800'}`}>{item.change != null ? item.change : '-'}</td>
                                                    <td className="px-2 py-2 text-sm">{item.userName}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </ReportBlock>
                    </div>
                 );
            default:
                return null;
        }
    };


    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header className="sticky top-0 bg-gray-100 z-20 p-3 sm:p-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center justify-between md:block">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-700">Dashboard</h1>
                        <button
                            className="md:hidden inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-white border shadow-sm hover:bg-gray-50"
                            onClick={() => setShowFiltersMobile(v => !v)}
                            aria-expanded={showFiltersMobile}
                            aria-controls="dashboard-filters"
                        >
                            Filters
                        </button>
                    </div>
                    <div id="dashboard-filters" className={`hidden md:block`}>
                        <div className="flex items-center gap-2 flex-wrap">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md text-sm w-full md:w-auto bg-white shadow-sm" />
                            <span className="text-gray-500 hidden md:inline">to</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md text-sm w-full md:w-auto bg-white shadow-sm" />
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={() => setDatePreset(7)} className="flex-1 md:flex-none px-3 py-2 text-sm rounded-md bg-white border shadow-sm hover:bg-gray-50">7 Days</button>
                                <button onClick={() => setDatePreset(30)} className="flex-1 md:flex-none px-3 py-2 text-sm rounded-md bg-white border shadow-sm hover:bg-gray-50">30 Days</button>
                                <button onClick={setThisMonth} className="flex-1 md:flex-none px-3 py-2 text-sm rounded-md bg-white border shadow-sm hover:bg-gray-50">This Month</button>
                            </div>
                            <div className="relative md:ml-2" ref={exportMenuRef}>
                                <button
                                    onClick={() => setIsExportMenuOpen(prev => !prev)}
                                    className="px-3 py-2 text-sm rounded-md bg-white border shadow-sm hover:bg-gray-50 flex items-center gap-2 w-full md:w-auto justify-center"
                                    aria-haspopup="true"
                                    aria-expanded={isExportMenuOpen}
                                >
                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                    Export
                                </button>
                                {isExportMenuOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                        <div className="py-1" role="none">
                                            <a
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); handleExportPDF(); setIsExportMenuOpen(false); }}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                role="menuitem"
                                            >
                                                Download PDF
                                            </a>
                                            <a
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); handleExportCSV(); setIsExportMenuOpen(false); }}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                role="menuitem"
                                            >
                                                Download CSV
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                 <div className="max-w-7xl mx-auto">
                   <div className=" mb-6">
                      <div className="overflow-x-auto overflow-y-hidden">
                          <nav className="-mb-px flex space-x-4 sm:space-x-6 whitespace-nowrap" aria-label="Tabs">
                              <TabButton tabName="sales" label="Sales Reports" />
                              <TabButton tabName="inventory" label="Inventory Reports" />
                              <TabButton tabName="customers" label="Customer Reports" />
                              <TabButton tabName="cashflow" label="Cashflow" />
                              <TabButton tabName="personal-use" label="Personal Use" />
                          </nav>
                      </div>
                   </div>

                   {renderContent()}
                 </div>
            </main>

            {/* Mobile Filters Bottom Sheet */}
            {showFiltersMobile && (
              <div className="fixed inset-0 z-30 md:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-filters-title">
                <div className="absolute inset-0 bg-black/40" onClick={() => setShowFiltersMobile(false)}></div>
                <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl p-4 pt-3 max-h-[80vh] overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
                  <div className="mx-auto w-full max-w-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h2 id="mobile-filters-title" className="text-base font-semibold text-gray-900">Filters</h2>
                      <button className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50" onClick={() => setShowFiltersMobile(false)} aria-label="Close filters">Close</button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md text-sm w-full bg-white" />
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md text-sm w-full bg-white" />
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => { setDatePreset(7); }} className="px-3 py-2 text-sm rounded-md bg-white border hover:bg-gray-50">7 Days</button>
                            <button onClick={() => { setDatePreset(30); }} className="px-3 py-2 text-sm rounded-md bg-white border hover:bg-gray-50">30 Days</button>
                            <button onClick={() => { setThisMonth(); }} className="px-3 py-2 text-sm rounded-md bg-white border hover:bg-gray-50">This Month</button>
                        </div>
                        <div className="grid grid-cols-1">
                            <button onClick={() => { handleExportPDF(); }} className="px-3 py-2 text-sm rounded-md bg-white border hover:bg-gray-50 flex items-center gap-2 justify-center"><ArrowDownTrayIcon className="w-5 h-5"/>Download PDF</button>
                            <button onClick={() => { handleExportCSV(); }} className="mt-2 px-3 py-2 text-sm rounded-md bg-white border hover:bg-gray-50 flex items-center gap-2 justify-center"><ArrowDownTrayIcon className="w-5 h-5"/>Download CSV</button>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isCmdOpen && (
                <div className="cmd-overlay" onClick={() => setIsCmdOpen(false)}>
                    <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
                        <input
                            autoFocus
                            type="text"
                            value={cmdQuery}
                            onChange={(e) => setCmdQuery(e.target.value)}
                            placeholder="Type a command…"
                            className="cmd-input"
                            aria-label="Command palette"
                        />
                        <ul className="cmd-list">
                            {filteredCommands.map((c, idx) => (
                                <li key={idx}>
                                    <button
                                        className="cmd-item"
                                        onClick={() => { setActiveTab(c.tab); setIsCmdOpen(false); setCmdQuery(''); }}
                                    >
                                        {c.label}
                                    </button>
                                </li>
                            ))}
                            {filteredCommands.length === 0 && (
                                <li className="cmd-empty">No matches</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;