import { AnomalyAlert, ForecastBundle, ForecastProvider, Insight, ModelInfo, PredictionPoint } from '../../types/forecast';
import { PowerReading } from '../../types/smartHomeServer';

export function checkHistorySufficiency(history?: PowerReading[]): boolean {
    if (!history || history.length === 0) return false;
    const validHours = history.filter(r => {
        if (!r.timestamp || r.power_kw === null || r.power_kw === undefined) return false;
        const t = new Date(r.timestamp).getTime();
        return !isNaN(t);
    });
    return validHours.length >= 337;
}

interface BackendModelInfo extends ModelInfo {
    datasetName?: string;
    datasetSize?: number;
    testMae?: number;
    testRmse?: number;
    testMape?: number;
}

const DEFAULT_TIMEOUT = 8000;

export class FlaskForecastProvider implements ForecastProvider {
    private readonly baseUrl: string;
    private readonly timeout: number;
    private readonly model: string;

    constructor(baseUrl: string, model: string = 'xgboost', timeout = DEFAULT_TIMEOUT) {
        this.baseUrl = baseUrl.trim().replace(/\/+$/, '');
        this.model = model;
        this.timeout = timeout;
    }

    private buildRequestBody(history?: PowerReading[]): any {
        const hasEnoughData = checkHistorySufficiency(history);
        if (hasEnoughData && history) {
            return {
                history: history.map((r) => ({
                    timestamp: r.timestamp,
                    power_kw: typeof r.power_kw === 'number' ? r.power_kw : 0,
                    reactive_power_kw: 0,
                    voltage: typeof r.voltage === 'number' ? r.voltage : 0,
                    current_a: typeof r.current === 'number' ? r.current : 0,
                    sub_metering_1: 0,
                    sub_metering_2: 0,
                    sub_metering_3: 0,
                })),
                allow_sample: false,
            };
        }
        return {
            allow_sample: true,
        };
    }

    async getForecastBundle(history?: PowerReading[]): Promise<ForecastBundle> {
        const response = await this.request<{
            predictions: PredictionPoint[];
            anomalies: AnomalyAlert[];
            insights: Insight[];
            dataMode: 'real_history' | 'sample' | 'mock_fallback';
            historyHourlyRows: number;
        }>(`/forecast/bundle?model=${this.model}`, {
            method: 'POST',
            body: JSON.stringify(this.buildRequestBody(history)),
        });
        return {
            predictions: response.predictions,
            anomalies: response.anomalies,
            insights: response.insights,
            dataMode: response.dataMode,
            historyHourlyRows: response.historyHourlyRows,
        };
    }

    async getPredictions(history?: PowerReading[]): Promise<PredictionPoint[]> {
        const bundle = await this.getForecastBundle(history);
        return bundle.predictions;
    }

    async getAnomalies(history?: PowerReading[]): Promise<AnomalyAlert[]> {
        const bundle = await this.getForecastBundle(history);
        return bundle.anomalies;
    }

    async getInsights(history?: PowerReading[]): Promise<Insight[]> {
        const bundle = await this.getForecastBundle(history);
        return bundle.insights;
    }


    async getModelInfo(): Promise<ModelInfo> {
        const info = await this.request<BackendModelInfo>(`/forecast/model-info?model=${this.model}`);
        return {
            name: info.name || 'Flask Forecast Model',
            lastUpdated: info.lastUpdated || new Date().toISOString(),
            trainingSamples: info.trainingSamples || info.datasetSize,
            mode: 'real_model',
        };
    }

    async triggerRetrain(): Promise<boolean> {
        try {
            const response = await this.request<{ status: string; message: string }>(`/forecast/trigger-retrain?model=${this.model}`, {
                method: 'POST',
            });
            return response.status === 'accepted';
        } catch (error) {
            console.error('Trigger retrain failed:', error);
            return false;
        }
    }

    private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        if (!this.baseUrl) {
            throw new Error('Forecast API chưa được cấu hình');
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                ...init,
                headers: {
                    'Content-Type': 'application/json',
                    ...(init.headers || {}),
                },
                signal: controller.signal,
            });

            if (!response.ok) {
                const body = await response.text();
                throw new Error(body || `Forecast API trả về mã ${response.status}`);
            }

            return response.json() as Promise<T>;
        } finally {
            clearTimeout(timer);
        }
    }
}
