export type SensorStatus = 'Normal' | 'Warning' | 'Critical' | 'Good';

export interface SensorConfig {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  warningThreshold: number;
  criticalThreshold: number;
  description: string;
  color: string;
}

export interface SensorDataPoint {
  id: string;
  sensor_id: string;
  value: number;
  timestamp: string;
  status: SensorStatus;
}

export const SENSORS: SensorConfig[] = [
  { id: 'bod', name: 'BOD', unit: 'mg/L', min: 0, max: 20, warningThreshold: 10, criticalThreshold: 15, description: 'Biochemical Oxygen Demand', color: '#3b82f6' },
  { id: 'cod', name: 'COD', unit: 'mg/L', min: 0, max: 100, warningThreshold: 50, criticalThreshold: 80, description: 'Chemical Oxygen Demand', color: '#8b5cf6' },
  { id: 'tss', name: 'TSS', unit: 'mg/L', min: 0, max: 20, warningThreshold: 10, criticalThreshold: 15, description: 'Total Suspended Solids', color: '#ec4899' },
  { id: 'ph', name: 'pH', unit: 'pH', min: 0, max: 14, warningThreshold: 8.5, criticalThreshold: 9.5, description: 'Potential of Hydrogen', color: '#10b981' },
  { id: 'temp', name: 'Temperature', unit: '°C', min: 0, max: 50, warningThreshold: 35, criticalThreshold: 45, description: 'Wastewater Temperature', color: '#f59e0b' },
  { id: 'do', name: 'DO', unit: 'mg/L', min: 0, max: 10, warningThreshold: 2, criticalThreshold: 1, description: 'Dissolved Oxygen', color: '#06b6d4' },
  { id: 'ammonia', name: 'Ammonia', unit: 'mg/L', min: 0, max: 10, warningThreshold: 5, criticalThreshold: 8, description: 'Ammoniacal Nitrogen', color: '#f43f5e' },
  { id: 'mlss', name: 'MLSS', unit: 'mg/L', min: 0, max: 6000, warningThreshold: 4500, criticalThreshold: 5500, description: 'Mixed Liquor Suspended Solids', color: '#6366f1' },
  { id: 'airflow', name: 'Airflow', unit: 'm³/hr', min: 0, max: 10000, warningThreshold: 8500, criticalThreshold: 9500, description: 'Blower Airflow Rate', color: '#14b8a6' },
  { id: 'ote', name: 'OTE', unit: '%', min: 0, max: 40, warningThreshold: 20, criticalThreshold: 15, description: 'Oxygen Transfer Efficiency', color: '#d946ef' },
  { id: 'tn', name: 'TN', unit: 'mg/L', min: 0, max: 30, warningThreshold: 10, criticalThreshold: 15, description: 'Total Nitrogen', color: '#84cc16' },
  { id: 'phosphorus', name: 'Phosphorus', unit: 'mg/L', min: 0, max: 5, warningThreshold: 2, criticalThreshold: 3, description: 'Total Phosphorus', color: '#f97316' },
  { id: 'sludge_level', name: 'Sludge Level', unit: 'm', min: 0, max: 5, warningThreshold: 3, criticalThreshold: 4, description: 'Sludge Blanket Level', color: '#78716c' },
  { id: 'svi', name: 'SVI', unit: 'mL/g', min: 0, max: 200, warningThreshold: 120, criticalThreshold: 150, description: 'Sludge Volume Index', color: '#475569' },
  { id: 'ras_flow', name: 'RAS Flow', unit: 'm³/hr', min: 0, max: 500, warningThreshold: 400, criticalThreshold: 450, description: 'Return Activated Sludge Flow', color: '#2563eb' },
  { id: 'was_flow', name: 'WAS Flow', unit: 'm³/hr', min: 0, max: 100, warningThreshold: 80, criticalThreshold: 90, description: 'Waste Activated Sludge Flow', color: '#7c3aed' },
  { id: 'chlorine_dose', name: 'Chlorine Dose', unit: 'mg/L', min: 0, max: 5, warningThreshold: 2.5, criticalThreshold: 3.5, description: 'Chlorine Dosing Rate', color: '#db2777' },
  { id: 'residual_chlorine', name: 'Res. Chlorine', unit: 'mg/L', min: 0, max: 2, warningThreshold: 1.5, criticalThreshold: 1.8, description: 'Residual Chlorine', color: '#059669' },
  { id: 'energy', name: 'Energy', unit: 'kWh', min: 0, max: 1000, warningThreshold: 800, criticalThreshold: 900, description: 'Total Energy Consumption', color: '#ea580c' },
  { id: 'vibration', name: 'Vibration', unit: 'mm/s', min: 0, max: 10, warningThreshold: 5, criticalThreshold: 8, description: 'Equipment Vibration', color: '#57534e' },
];

export function getStatus(value: number, config: SensorConfig): SensorStatus {
  // Special case for DO and OTE where lower is worse
  if (config.id === 'do' || config.id === 'ote') {
    if (value <= config.criticalThreshold) return 'Critical';
    if (value <= config.warningThreshold) return 'Warning';
    return 'Good';
  }
  
  if (value >= config.criticalThreshold) return 'Critical';
  if (value >= config.warningThreshold) return 'Warning';
  if (value < config.warningThreshold * 0.8) return 'Good';
  return 'Normal';
}
