import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  Settings, 
  Download, 
  Power, 
  AlertTriangle, 
  Activity, 
  Thermometer, 
  Droplets, 
  Zap, 
  Waves,
  LayoutDashboard,
  History,
  ShieldAlert,
  Menu,
  X,
  RefreshCw,
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { supabase, TABLE_NAME } from './lib/supabase';
import { cn } from './lib/utils';
import { SENSORS, SensorConfig, SensorDataPoint, getStatus, SensorStatus } from './types';

// Mock data generator for when Supabase is not configured or for initial state
const generateMockData = (sensorId: string, count: number = 20): SensorDataPoint[] => {
  const config = SENSORS.find(s => s.id === sensorId)!;
  return Array.from({ length: count }).map((_, i) => {
    const baseValue = (config.min + config.max) / 2;
    const randomVariation = (Math.random() - 0.5) * (config.max - config.min) * 0.2;
    const value = Math.max(config.min, Math.min(config.max, baseValue + randomVariation));
    return {
      id: `${sensorId}-${i}`,
      sensor_id: sensorId,
      value: Number(value.toFixed(2)),
      timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
      status: getStatus(value, config)
    };
  });
};

const StatusBadge = ({ status }: { status: SensorStatus }) => {
  const colors = {
    Good: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Normal: 'bg-blue-50 text-blue-600 border-blue-200',
    Warning: 'bg-amber-50 text-amber-600 border-amber-200',
    Critical: 'bg-rose-50 text-rose-600 border-rose-200'
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
      colors[status],
      status === 'Critical' && "animate-pulse"
    )}>
      {status}
    </span>
  );
};

function SidebarItem({ icon, label, active, onClick, expanded, badge }: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
  expanded: boolean;
  badge?: number;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all relative group",
        active ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"
      )}
    >
      <div className="shrink-0">{icon}</div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1 flex justify-between items-center whitespace-nowrap overflow-hidden"
          >
            <span>{label}</span>
            {badge && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {!expanded && badge && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white" />
      )}
      {!expanded && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
          {label}
        </div>
      )}
    </button>
  );
}

interface SensorCardProps {
  config: SensorConfig;
  data: SensorDataPoint[];
  onStop: (id: string) => void;
  onClick?: () => void;
  isLarge?: boolean;
  key?: string | number;
}

const SensorCard = ({ 
  config, 
  data, 
  onStop,
  onClick,
  isLarge = false
}: SensorCardProps) => {
  const currentData = data[data.length - 1];
  const isCritical = currentData?.status === 'Critical';

  const min = data.length ? Math.min(...data.map(d => d.value)).toFixed(1) : '--';
  const max = data.length ? Math.max(...data.map(d => d.value)).toFixed(1) : '--';
  const avg = data.length ? (data.reduce((a, b) => a + Number(b.value), 0) / data.length).toFixed(1) : '--';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-all group relative overflow-hidden shadow-sm hover:shadow-md",
        isLarge ? "p-6" : "p-3",
        isCritical && "border-rose-200",
        onClick && "cursor-pointer active:scale-[0.98]"
      )}
    >
      {isCritical && (
        <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse" />
      )}
      
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className={cn(
            "text-slate-500 font-medium uppercase tracking-wider",
            isLarge ? "text-xs" : "text-[10px]"
          )}>{config.name}</h3>
          <p className={cn(
            "text-slate-400 line-clamp-1",
            isLarge ? "text-xs" : "text-[9px]"
          )}>{config.description}</p>
        </div>
        <StatusBadge status={currentData?.status || 'Normal'} />
      </div>

      <div className={cn("flex", isLarge ? "flex-col md:flex-row md:items-end gap-6 mb-6" : "items-baseline gap-1.5 mb-2")}>
        <div className="flex items-baseline gap-1.5">
          <span className={cn(
            "font-bold text-slate-900 tabular-nums",
            isLarge ? "text-5xl" : "text-xl"
          )}>
            {currentData?.value || '--'}
          </span>
          <span className={cn(
            "text-slate-400",
            isLarge ? "text-base font-medium" : "text-xs"
          )}>{config.unit}</span>
        </div>

        {isLarge && (
          <div className="flex gap-3 mb-1">
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 min-w-[70px]">
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-0.5">Min</span>
              <span className="text-sm font-bold text-slate-700">{min}</span>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 min-w-[70px]">
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-0.5">Average</span>
              <span className="text-sm font-bold text-slate-700">{avg}</span>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 min-w-[70px]">
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-0.5">Max</span>
              <span className="text-sm font-bold text-slate-700">{max}</span>
            </div>
          </div>
        )}
      </div>

      <div className={cn(
        "w-full",
        isLarge ? "h-64" : "h-20"
      )}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={isLarge ? { top: 10, right: 10, left: -20, bottom: 0 } : undefined}>
            <defs>
              <linearGradient id={`gradient-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            {isLarge && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />}
            {isLarge && (
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(val) => format(new Date(val), 'HH:mm')}
                stroke="#cbd5e1"
                fontSize={10}
                tickMargin={10}
              />
            )}
            {isLarge && (
              <YAxis 
                stroke="#cbd5e1"
                fontSize={10}
                domain={['auto', 'auto']}
              />
            )}
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#0f172a' }}
              labelFormatter={(label) => format(new Date(label), 'MMM d, HH:mm:ss')}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={config.color} 
              fillOpacity={1} 
              fill={`url(#gradient-${config.id})`} 
              strokeWidth={isLarge ? 3 : 2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className={cn(
          "text-slate-400",
          isLarge ? "text-xs" : "text-[10px]"
        )}>
          Last update: {currentData ? format(new Date(currentData.timestamp), 'HH:mm:ss') : '--'}
        </div>
      </div>
    </motion.div>
  );
};

const KPICard = ({ title, value, unit, icon: Icon, trend, status }: { 
  title: string; 
  value: string | number; 
  unit: string; 
  icon: any; 
  trend?: string;
  status?: SensorStatus;
}) => {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
      <div className={cn(
        "p-3 rounded-lg",
        status === 'Critical' ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
      )}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{value}</span>
          <span className="text-slate-400 text-sm">{unit}</span>
        </div>
        {trend && (
          <p className={cn(
            "text-[10px] mt-1 font-bold",
            trend.startsWith('+') ? "text-rose-600" : "text-emerald-600"
          )}>
            {trend} from last hour
          </p>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [sensorData, setSensorData] = useState<Record<string, SensorDataPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState(60);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [notifications, setNotifications] = useState<{ id: string; message: string; timestamp: Date; sensorId: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSection, setCurrentSection] = useState<'dashboard' | 'alerts' | 'history' | 'security' | 'config' | 'total-sensors'>('dashboard');
  const [selectedHistorySensor, setSelectedHistorySensor] = useState<string | null>(null);
  const [selectedTotalSensor, setSelectedTotalSensor] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showSensorsDropdown, setShowSensorsDropdown] = useState(false);
  const [showPlantDropdown, setShowPlantDropdown] = useState(false);

  const handleStopSensor = (sensorId: string) => {
    const sensor = SENSORS.find(s => s.id === sensorId);
    if (sensor) {
      alert(`EMERGENCY STOP: ${sensor.name} has been deactivated.`);
      // In a real app, this would call an API to stop the sensor
    }
  };

  const fetchData = async () => {
    try {
      // Reset countdown
      setCountdown(60);
      
      // Attempt to fetch from Supabase if configured
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(400); // 20 sensors * 20 points

      if (error || !data || data.length === 0) {
        console.warn('Supabase fetch failed or empty, using mock data');
        const mockData: Record<string, SensorDataPoint[]> = {};
        SENSORS.forEach(sensor => {
          mockData[sensor.id] = generateMockData(sensor.id);
        });
        setSensorData(mockData);
      } else {
        // Group by sensor_id
        const grouped = data.reduce((acc: any, curr: any) => {
          if (!acc[curr.sensor_id]) acc[curr.sensor_id] = [];
          acc[curr.sensor_id].push(curr);
          return acc;
        }, {});
        
        // Ensure each sensor has data (even if mock)
        SENSORS.forEach(sensor => {
          if (!grouped[sensor.id]) {
            grouped[sensor.id] = generateMockData(sensor.id);
          } else {
            // Sort ascending for charts
            grouped[sensor.id].sort((a: any, b: any) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          }
        });
        setSensorData(grouped);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      // Fallback to mock on error
      const mockData: Record<string, SensorDataPoint[]> = {};
      SENSORS.forEach(sensor => {
        mockData[sensor.id] = generateMockData(sensor.id);
      });
      setSensorData(mockData);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchData();
    const fetchInterval = setInterval(fetchData, 60000); // 60s refresh
    
    const timerInterval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(timerInterval);
    };
  }, []);

  // Check for alerts
  useEffect(() => {
    const newAlerts: { id: string; message: string; timestamp: Date; sensorId: string }[] = [];
    Object.entries(sensorData).forEach(([id, data]) => {
      const d = data as SensorDataPoint[];
      const latest = d[d.length - 1];
      if (latest?.status === 'Critical' || latest?.status === 'Warning') {
        const config = SENSORS.find(s => s.id === id);
        const alertId = `${id}-${latest.timestamp}`;
        
        // Only add if not already in notifications
        if (!notifications.some(n => n.id === alertId)) {
          newAlerts.push({
            id: alertId,
            message: `${latest.status.toUpperCase()}: ${config?.name} reached ${latest.value} ${config?.unit}`,
            timestamp: new Date(latest.timestamp),
            sensorId: id
          });
        }
      }
    });
    if (newAlerts.length > 0) {
      setNotifications(prev => [...newAlerts, ...prev].slice(0, 20));
    }
  }, [sensorData]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Sensor,Value,Unit,Status,Timestamp\n"
      + Object.entries(sensorData).flatMap(([id, data]) => {
          const config = SENSORS.find(s => s.id === id);
          return (data as SensorDataPoint[]).map(d => `${config?.name},${d.value},${config?.unit},${d.status},${d.timestamp}`);
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stp_sensor_data_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSensors = useMemo(() => {
    return SENSORS.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const kpis = useMemo(() => {
    const energyData = sensorData['energy'] as SensorDataPoint[] | undefined;
    const totalEnergy = energyData?.[energyData.length - 1]?.value || 0;
    
    const oteData = sensorData['ote'] as SensorDataPoint[] | undefined;
    const avgEfficiency = (oteData?.[oteData.length - 1]?.value || 0).toFixed(1);
    
    const criticalCount = Object.values(sensorData).filter(data => {
      const d = data as SensorDataPoint[];
      return d[d.length - 1]?.status === 'Critical';
    }).length;

    return [
      { title: 'Total Power', value: totalEnergy, unit: 'kWh', icon: Zap, trend: '+2.4%', status: 'Normal' as SensorStatus },
      { title: 'Avg Efficiency', value: (sensorData['ote']?.[sensorData['ote'].length - 1]?.value || 0).toFixed(1), unit: '%', icon: Activity, trend: '-0.5%', status: 'Normal' as SensorStatus },
      { title: 'Active Alerts', value: criticalCount, unit: 'Issues', icon: ShieldAlert, status: criticalCount > 0 ? 'Critical' : 'Good' as SensorStatus },
      { title: 'Plant Flow', value: '185.4', unit: 'MLD', icon: Waves, trend: '+1.2%', status: 'Good' as SensorStatus },
    ];
  }, [sensorData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="text-blue-500 animate-spin" size={48} />
        <p className="text-slate-400 font-medium animate-pulse tracking-widest uppercase text-xs">Initializing Industrial Systems...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 flex font-sans selection:bg-blue-100 selection:text-blue-700 overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarExpanded ? 240 : 72 }}
        onClick={() => !isSidebarExpanded && setIsSidebarExpanded(true)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out lg:relative shadow-sm",
          !isSidebarOpen && "-translate-x-full lg:translate-x-0",
          !isSidebarExpanded && "cursor-pointer hover:bg-slate-50"
        )}
      >
        <div className="p-4 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
                <Activity className="text-white" size={24} />
              </div>
              {isSidebarExpanded && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  <h1 className="font-bold text-slate-900 tracking-tight leading-none">Pirana STP</h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Control Center</p>
                </motion.div>
              )}
            </div>
            <button 
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors hidden lg:block"
            >
              {isSidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto overflow-x-hidden pb-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            <SidebarItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={currentSection === 'dashboard'} 
              onClick={() => setCurrentSection('dashboard')}
              expanded={isSidebarExpanded}
            />
            
            {/* Total Sensors Dropdown */}
            <div className="space-y-1">
              <button 
                onClick={() => {
                  if (isSidebarExpanded) {
                    setShowSensorsDropdown(!showSensorsDropdown);
                  } else {
                    setSelectedTotalSensor(null);
                    setCurrentSection('total-sensors');
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all relative group",
                  (showSensorsDropdown || currentSection === 'total-sensors') ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <div className="shrink-0"><Activity size={20} /></div>
                {isSidebarExpanded && (
                  <div className="flex-1 flex justify-between items-center">
                    <span onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTotalSensor(null);
                      setCurrentSection('total-sensors');
                    }}>Total Sensors</span>
                    <ChevronDown size={16} className={cn("transition-transform", showSensorsDropdown && "rotate-180")} />
                  </div>
                )}
              </button>
              <AnimatePresence>
                {isSidebarExpanded && showSensorsDropdown && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-10 space-y-1"
                  >
                    {SENSORS.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => {
                          setSelectedTotalSensor(s.id);
                          setCurrentSection('total-sensors');
                        }}
                        className="w-full text-left py-2 text-[11px] text-slate-500 hover:text-blue-400 transition-colors truncate"
                      >
                        {s.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Plant Section Dropdown */}
            <div className="space-y-1">
              <button 
                onClick={() => isSidebarExpanded && setShowPlantDropdown(!showPlantDropdown)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all relative group",
                  showPlantDropdown ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <div className="shrink-0"><Waves size={20} /></div>
                {isSidebarExpanded && (
                  <div className="flex-1 flex justify-between items-center">
                    <span>Plant Section</span>
                    <ChevronDown size={16} className={cn("transition-transform", showPlantDropdown && "rotate-180")} />
                  </div>
                )}
              </button>
              <AnimatePresence>
                {isSidebarExpanded && showPlantDropdown && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-10 space-y-1"
                  >
                    {['Inlet Section', 'Primary Treatment', 'Secondary Treatment', 'Sludge Handling'].map(section => (
                      <button 
                        key={section}
                        onClick={() => setCurrentSection('dashboard')}
                        className="w-full text-left py-2 text-[11px] text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        {section}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <SidebarItem 
              icon={<Bell size={20} />} 
              label="Alerts" 
              active={currentSection === 'alerts'} 
              onClick={() => setCurrentSection('alerts')}
              expanded={isSidebarExpanded}
              badge={notifications.length > 0 ? notifications.length : undefined}
            />
            <SidebarItem 
              icon={<History size={20} />} 
              label="History Logs" 
              active={currentSection === 'history'} 
              onClick={() => setCurrentSection('history')}
              expanded={isSidebarExpanded}
            />
            <SidebarItem 
              icon={<ShieldAlert size={20} />} 
              label="Security" 
              active={currentSection === 'security'} 
              onClick={() => setCurrentSection('security')}
              expanded={isSidebarExpanded}
            />
            <SidebarItem 
              icon={<Settings size={20} />} 
              label="Configuration" 
              active={currentSection === 'config'} 
              onClick={() => setCurrentSection('config')}
              expanded={isSidebarExpanded}
            />

            <div className={cn(
              "mt-8 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 transition-all overflow-hidden",
              !isSidebarExpanded && "p-1.5"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold shrink-0 text-slate-600">RD</div>
                {isSidebarExpanded && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs font-bold text-slate-900 truncate">Rahul Dev Singh</p>
                    <p className="text-[10px] text-slate-500 truncate">System Administrator</p>
                  </motion.div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="min-h-[72px] bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">STP Operational Dashboard</h1>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search sensors..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[9px] font-medium text-slate-500 shadow-sm">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="tracking-widest uppercase">Refresh:</span>
              <span className="text-blue-600 font-bold w-4 inline-block text-[11px] tabular-nums">{countdown}s</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[9px] font-medium text-slate-500 shadow-sm">
              <Clock size={10} className="text-blue-600" />
              <span className="text-slate-500 uppercase tracking-widest">Time:</span>
              <span className="text-slate-900 font-bold tabular-nums text-[11px]">{format(currentTime, 'HH:mm:ss')}</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-slate-600 relative"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                      <h4 className="font-bold text-sm text-slate-900">System Alerts</h4>
                      <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">No active alerts</div>
                      ) : (
                        notifications.map((note) => (
                          <button 
                            key={note.id} 
                            onClick={() => {
                              setSelectedHistorySensor(note.sensorId);
                              setCurrentSection('history');
                              setShowNotifications(false);
                            }}
                            className="w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3"
                          >
                            <div className="mt-1">
                              {note.message.includes('CRITICAL') ? (
                                <ShieldAlert size={14} className="text-rose-500" />
                              ) : (
                                <AlertTriangle size={14} className="text-amber-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-slate-700 line-clamp-2 font-medium">{note.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{format(note.timestamp, 'HH:mm:ss')}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          setCurrentSection('alerts');
                          setShowNotifications(false);
                        }}
                        className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:bg-slate-50 transition-colors"
                      >
                        View All Alerts
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export Data</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          {currentSection === 'dashboard' ? (
            <>
              {/* KPI Section */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, i) => (
                  <KPICard key={i} {...kpi} />
                ))}
              </section>

              {/* Sensors Grid */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Real-time Sensor Network</h2>
                    <p className="text-slate-500 text-xs mt-1">Monitoring 20 critical process parameters with 60s refresh cycle</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <RefreshCw size={12} className="animate-spin-slow" />
                    Auto-refreshing
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredSensors.map((sensor) => (
                    <SensorCard 
                      key={sensor.id} 
                      config={sensor} 
                      data={sensorData[sensor.id] as SensorDataPoint[] || []} 
                      onStop={handleStopSensor}
                      onClick={() => {
                        setSelectedTotalSensor(sensor.id);
                        setCurrentSection('total-sensors');
                      }}
                    />
                  ))}
                </div>
              </section>
            </>
          ) : 
          currentSection === 'total-sensors' ? (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {selectedTotalSensor 
                      ? `${SENSORS.find(s => s.id === selectedTotalSensor)?.name} Sensor Analysis` 
                      : 'Total Sensors Network'}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    {selectedTotalSensor 
                      ? `Detailed real-time monitoring for ${SENSORS.find(s => s.id === selectedTotalSensor)?.name}` 
                      : 'Real-time performance graphs for all critical parameters'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {selectedTotalSensor && (
                    <button 
                      onClick={() => setSelectedTotalSensor(null)}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-widest border border-slate-200 transition-all shadow-sm"
                    >
                      Show All Sensors
                    </button>
                  )}
                  <button 
                    onClick={() => setCurrentSection('dashboard')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-blue-600/20"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
              <div className={cn(
                "grid gap-6",
                selectedTotalSensor ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}>
                {SENSORS.filter(s => !selectedTotalSensor || s.id === selectedTotalSensor).map((sensor) => (
                  <SensorCard 
                    key={sensor.id} 
                    config={sensor} 
                    data={sensorData[sensor.id] as SensorDataPoint[] || []} 
                    onStop={handleStopSensor}
                    isLarge={!!selectedTotalSensor}
                  />
                ))}
              </div>
            </section>
          ) : 
          currentSection === 'alerts' ? (
            <section className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Alerts & Notifications</h2>
                  <p className="text-slate-500 text-sm mt-1">Historical log of threshold violations and system warnings</p>
                </div>
                <button 
                  onClick={() => setNotifications([])}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-200 shadow-sm"
                >
                  Clear History
                </button>
              </div>

              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                    <ShieldAlert size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400">No active alerts detected in the current session.</p>
                  </div>
                ) : (
                  notifications.map((note) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={note.id}
                      className={cn(
                        "bg-white border rounded-lg p-3 flex items-center gap-3 transition-all shadow-sm",
                        note.message.includes('CRITICAL') ? "border-rose-200 bg-rose-50/30" : "border-slate-100"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        note.message.includes('CRITICAL') ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {note.message.includes('CRITICAL') ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className={cn(
                            "font-bold uppercase tracking-wider text-[9px]",
                            note.message.includes('CRITICAL') ? "text-rose-600" : "text-amber-600"
                          )}>
                            {note.message.includes('CRITICAL') ? 'Critical Violation' : 'System Warning'}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {format(note.timestamp, 'HH:mm:ss')}
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs mt-0.5 font-medium">{note.message}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedHistorySensor(note.sensorId);
                          setCurrentSection('history');
                        }}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all border border-slate-200"
                      >
                        Inspect
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          ) : 
          currentSection === 'history' ? (
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sensor History Logs</h2>
                  <p className="text-slate-500 text-sm mt-1">Detailed historical analysis and system control</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">From:</span>
                    <input 
                      type="date" 
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">To:</span>
                    <input 
                      type="date" 
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                  </div>
                  <select 
                    value={selectedHistorySensor || ''} 
                    onChange={(e) => setSelectedHistorySensor(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                  >
                    <option value="" disabled>Select Sensor</option>
                    {SENSORS.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-200 shadow-sm"
                  >
                    <Download size={14} />
                    Export
                  </button>
                </div>
              </div>

              {selectedHistorySensor ? (
                <div className="space-y-6">
                  {/* Graph Section */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <Activity size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {SENSORS.find(s => s.id === selectedHistorySensor)?.name} Trend Analysis
                          </h3>
                          <p className="text-slate-500 text-xs">Real-time performance monitoring</p>
                        </div>
                      </div>
                      
                      {/* Switch Button (Emergency Stop) */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">System Status:</span>
                          <div className={cn(
                            "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                            getStatus(sensorData[selectedHistorySensor]?.[sensorData[selectedHistorySensor].length - 1]?.value || 0, SENSORS.find(s => s.id === selectedHistorySensor)!) === 'Critical' 
                              ? "bg-rose-50 text-rose-600" 
                              : "bg-emerald-50 text-emerald-600"
                          )}>
                            {getStatus(sensorData[selectedHistorySensor]?.[sensorData[selectedHistorySensor].length - 1]?.value || 0, SENSORS.find(s => s.id === selectedHistorySensor)!) === 'Critical' ? 'Critical' : 'Active'}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleStopSensor(selectedHistorySensor)}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-rose-600/20"
                        >
                          <Power size={14} />
                          Emergency Switch
                        </button>
                      </div>
                    </div>

                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={(sensorData[selectedHistorySensor] || []).filter(d => {
                          const date = new Date(d.timestamp);
                          const from = new Date(fromDate);
                          const to = new Date(toDate);
                          to.setHours(23, 59, 59, 999);
                          return date >= from && date <= to;
                        })}>
                          <defs>
                            <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={SENSORS.find(s => s.id === selectedHistorySensor)?.color || "#3b82f6"} stopOpacity={0.2}/>
                              <stop offset="95%" stopColor={SENSORS.find(s => s.id === selectedHistorySensor)?.color || "#3b82f6"} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis 
                            dataKey="timestamp" 
                            stroke="#94a3b8"
                            fontSize={10}
                            tickFormatter={(str) => format(new Date(str), 'HH:mm')}
                            minTickGap={30}
                          />
                          <YAxis 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            domain={['auto', 'auto']}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#0f172a' }}
                            labelFormatter={(label) => format(new Date(label), 'MMM dd, HH:mm:ss')}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={SENSORS.find(s => s.id === selectedHistorySensor)?.color || "#3b82f6"} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorHistory)" 
                            animationDuration={1000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Data Table Section */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                      <h3 className="font-bold text-sm text-slate-900">Historical Data Points</h3>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">Filtered by date range</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                          <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">Value</th>
                            <th className="px-6 py-3">Unit</th>
                            <th className="px-6 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[...(sensorData[selectedHistorySensor] || [])]
                            .filter(d => {
                              const date = new Date(d.timestamp);
                              const from = new Date(fromDate);
                              const to = new Date(toDate);
                              to.setHours(23, 59, 59, 999);
                              return date >= from && date <= to;
                            })
                            .reverse()
                            .map((d, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                  {format(new Date(d.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-900">
                                  {d.value.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-slate-400">
                                  {SENSORS.find(s => s.id === selectedHistorySensor)?.unit}
                                </td>
                                <td className="px-6 py-4">
                                  <StatusBadge status={d.status} />
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-20 text-center shadow-sm">
                  <History size={64} className="mx-auto text-slate-100 mb-6" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Sensor to View History</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Choose a sensor from the dropdown or click 'Inspect' on an alert to view detailed historical data and system controls.
                  </p>
                </div>
              )}
            </section>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
              <Settings size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-900">Section Under Construction</p>
              <p className="text-sm">This module is part of the Phase 4 implementation roadmap.</p>
              <button 
                onClick={() => setCurrentSection('dashboard')}
                className="mt-6 text-blue-600 font-bold uppercase tracking-widest text-xs hover:underline"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
