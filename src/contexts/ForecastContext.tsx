import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSmartHomeServer } from './SmartHomeServerContext';
import { AnomalyAlert, Insight, ModelInfo, PredictionPoint } from '../types/forecast';
import { FlaskForecastProvider } from '../services/forecast/flaskForecastProvider';
import { mockAnomalies, mockInsights, mockModelInfo, mockPredictions } from '../services/forecast/mockFallback';

import { PowerReading } from '../types/smartHomeServer';

interface ForecastContextType {
    predictions: PredictionPoint[];
    anomalies: AnomalyAlert[];
    insights: Insight[];
    modelInfo: ModelInfo;
    isLoading: boolean;
    error: string | null;
    forecastSource: 'real_history' | 'sample' | 'mock_fallback';
    historyHourlyRows: number;
    refresh: () => Promise<void>;
    triggerRetrain: () => Promise<boolean>;
}

const ForecastContext = createContext<ForecastContextType>({} as ForecastContextType);
const FORECAST_REFRESH_MS = 5 * 60 * 1000;

export const useForecast = () => useContext(ForecastContext);

export const ForecastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { config, client } = useSmartHomeServer();
    const [predictions, setPredictions] = useState<PredictionPoint[]>(mockPredictions);
    const [anomalies, setAnomalies] = useState<AnomalyAlert[]>(mockAnomalies);
    const [insights, setInsights] = useState<Insight[]>(mockInsights);
    const [modelInfo, setModelInfo] = useState<ModelInfo>(mockModelInfo);
    const [forecastSource, setForecastSource] = useState<'real_history' | 'sample' | 'mock_fallback'>('mock_fallback');
    const [historyHourlyRows, setHistoryHourlyRows] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const flaskProvider = useMemo(() => {
        const apiUrl = config.forecastApiUrl?.trim();
        return apiUrl ? new FlaskForecastProvider(apiUrl, config.forecastModel || 'xgboost') : null;
    }, [config.forecastApiUrl, config.forecastModel]);

    const applyMockFallback = useCallback(() => {
        setPredictions(mockPredictions);
        setAnomalies(mockAnomalies);
        setInsights(mockInsights);
        setModelInfo({
            ...mockModelInfo,
            lastUpdated: new Date().toISOString(),
        });
        setForecastSource('mock_fallback');
        setHistoryHourlyRows(0);
    }, []);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let history: PowerReading[] | undefined;
            if (client && client.isReady()) {
                try {
                    history = await client.getPowerHistory(1000, 'hourly');
                } catch (historyErr) {
                    console.warn('Failed to fetch hourly power history:', historyErr);
                }
            }

            if (flaskProvider) {
                const bundle = await flaskProvider.getForecastBundle(history);
                setPredictions(bundle.predictions);
                setAnomalies(bundle.anomalies);
                setInsights(bundle.insights);
                setForecastSource(bundle.dataMode);
                setHistoryHourlyRows(bundle.historyHourlyRows);

                try {
                    const info = await flaskProvider.getModelInfo();
                    setModelInfo(info);
                } catch (infoErr) {
                    console.warn('Failed to fetch model info:', infoErr);
                }
                return;
            }

            applyMockFallback();
        } catch (providerError) {
            const message = providerError instanceof Error ? providerError.message : 'Không thể đọc forecast provider';
            setError(message);
            applyMockFallback();
        } finally {
            setIsLoading(false);
        }
    }, [applyMockFallback, client, flaskProvider]);

    useEffect(() => {
        refresh().catch(() => undefined);
        const interval = setInterval(() => {
            refresh().catch(() => undefined);
        }, FORECAST_REFRESH_MS);

        return () => clearInterval(interval);
    }, [refresh]);

    const triggerRetrain = useCallback(async () => {
        if (flaskProvider && flaskProvider.triggerRetrain) {
            return await flaskProvider.triggerRetrain();
        }
        return false;
    }, [flaskProvider]);

    return (
        <ForecastContext.Provider value={{ predictions, anomalies, insights, modelInfo, isLoading, error, forecastSource, historyHourlyRows, refresh, triggerRetrain }}>
            {children}
        </ForecastContext.Provider>
    );
};
