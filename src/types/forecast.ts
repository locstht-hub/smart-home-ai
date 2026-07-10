import { PowerReading } from './smartHomeServer';

export type ForecastSource = 'server_rule' | 'flask_model' | 'mock_fallback' | 'real_history' | 'sample';

export interface PredictionPoint {
    time: string;
    predictedKw: number;
    confidence: number;
    source: ForecastSource;
}

export interface AnomalyAlert {
    id: string;
    deviceName: string;
    roomName: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    detail?: string;
    currentPower?: number;
    normalPower?: number;
    detectedAt: string;
    source: Exclude<ForecastSource, 'mock_fallback'> | 'mock_fallback';
}

export interface Insight {
    id: string;
    title: string;
    detail: string;
    value?: string;
    source: Exclude<ForecastSource, 'mock_fallback'> | 'mock_fallback';
}

export interface ModelInfo {
    name: string;
    lastUpdated: string;
    trainingSamples?: number;
    mode: 'demo_rule' | 'real_model';
}

export interface ForecastBundle {
    predictions: PredictionPoint[];
    anomalies: AnomalyAlert[];
    insights: Insight[];
    dataMode: 'real_history' | 'sample' | 'mock_fallback';
    historyHourlyRows: number;
}

export interface ForecastProvider {
    getPredictions(history?: PowerReading[]): Promise<PredictionPoint[]>;
    getAnomalies(history?: PowerReading[]): Promise<AnomalyAlert[]>;
    getInsights(history?: PowerReading[]): Promise<Insight[]>;
    getForecastBundle(history?: PowerReading[]): Promise<ForecastBundle>;
    getModelInfo(): Promise<ModelInfo>;
    triggerRetrain?(): Promise<boolean>;
}

