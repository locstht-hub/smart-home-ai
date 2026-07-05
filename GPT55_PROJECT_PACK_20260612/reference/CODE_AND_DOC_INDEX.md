# Code And Document Index

## Root documents

- `README.md`: tong quan repo, thanh phan, cach chay backend/app/site.
- `TEST_PLAN_LUAN_VAN.md`: ke hoach test, thu thap so lieu, bang metric cho luan van.
- `BACKEND_ENDPOINT_AUDIT.md`: doi chieu endpoint backend voi mobile app/admin site.
- `PROJECT_HANDOFF_CURRENT_STATUS.md`: trang thai du an tai moc 2026-05-26.
- `TOM_TAT_TIEN_DO_DU_AN_SMART_HOME_AI.md`: tom tat tien do.
- `TIEN_TRINH_DU_AN.md`: nhat ky/tien trinh dai hon.
- `TAI_LIEU_PHAN_BIEN_KIEN_TRUC.md`: tai lieu phan bien/kien truc.
- `PLC_SERVER_MAPPING_GUIDE.md`: mapping PLC/server.
- `HUONG_DAN_SU_DUNG_APP.md`: huong dan su dung app.

## Mobile app

- `src/screens/LoginScreen.tsx`: man dang nhap.
- `src/screens/RegisterScreen.tsx`: man dang ky.
- `src/screens/DashboardScreen.tsx`: tong quan dien nang/quota/device summary.
- `src/screens/RoomsScreen.tsx`: phong/thiet bi va dieu khien.
- `src/screens/AnalysisScreen.tsx`: bieu do, forecast, report.
- `src/screens/ChatScreen.tsx`: chatbot, speech-to-text/text-to-speech.
- `src/screens/SettingsScreen.tsx`: cau hinh backend/forecast/account.
- `src/screens/AdminScreen.tsx`: quan tri trong app.
- `src/screens/MemberManagementScreen.tsx`: quan ly thanh vien trong nha.
- `src/services/smartHome/client.ts`: client goi Smart Home Server API.
- `src/services/forecast/flaskForecastProvider.ts`: client goi Forecast API.
- `src/contexts/*`: Auth, data, forecast va server config context.

## Backend

- `backend/smart_home_server/app.py`: Flask app chinh, endpoints.
- `backend/smart_home_server/auth_store.py`: user/home/role/session/audit storage.
- `backend/smart_home_server/assistant_runtime.py`: assistant provider/fallback.
- `backend/smart_home_server/assistant_intents.py`: intent/rule cho assistant.
- `backend/smart_home_server/README.md`: workflow, endpoints, PLC config.

## Forecast

- `backend/forecast_api/app.py`: Forecast API Flask.
- `backend/forecast_api/server.js`: Node fallback server.
- `backend/forecast_api/lstm_predictor.py`: LSTM predictor helper.
- `ml-training/forecast-24h-colab/train_24h_forecast.py`: training forecast classical ML.
- `ml-training/forecast-24h-colab/train_lstm_forecast.py`: training LSTM forecast.
- `model_metrics/metrics.json`: metrics Random Forest/XGBoost.
- `model_metrics/metrics_lstm.json`: metrics LSTM neu can so sanh.

## PLC

- `backend/plc_gateway/power_api.py`: gateway toi gian doc power tu PLC.
- `backend/plc_gateway/README.md`: luong du lieu va tag cong suat.
- `backend/plc_gateway/power_config.example.json`: config mau.

## Sites

- `admin-site/index.html`, `admin-site/app.js`, `admin-site/styles.css`: web admin.
- `project-site/index.html`, `project-site/progress.html`, `project-site/knowledge.js`, `project-site/styles.css`: website gioi thieu va FAQ.

## ML assistants

- `ml-training/assistant-user-energy-qa`: dataset/test plan cho User Energy Assistant.
- `ml-training/assistant-project-qa`: dataset Project Assistant.
- `ml-training/assistant-intent`: intent classifier/dataset.

## Build

- `package.json`: scripts va dependencies.
- `scripts/build-android-release.ps1`: build Android release qua short path `C:\shb`.
- APK release gan nhat nam o repo goc: `android/app/build/outputs/apk/release/app-release-arm64-v8a.apk`.


