import { Device } from './data';

export interface PlcDeviceMapping {
    id: string;
    roomId: 'living' | 'bedroom' | 'kitchen' | 'garage' | 'bathroom';
    appName: string;
    type: Device['type'];
    apiDeviceId: string;
    plcStatusTag: string;
    plcOnCommandTag: string;
    plcOffCommandTag: string;
    defaultPowerW: number;
}

export const PLC_DEVICE_MAPPINGS: PlcDeviceMapping[] = [
    {
        id: 'bedroom_lamp1',
        roomId: 'bedroom',
        appName: 'Đèn phòng ngủ',
        type: 'light',
        apiDeviceId: 'bedroom_lamp1',
        plcStatusTag: 'DB1.DBX1.4',
        plcOnCommandTag: 'DB7.DBX0.0',
        plcOffCommandTag: 'DB7.DBX0.1',
        defaultPowerW: 15,
    },
    {
        id: 'living_lamp2',
        roomId: 'living',
        appName: 'Đèn phòng khách',
        type: 'light',
        apiDeviceId: 'living_lamp2',
        plcStatusTag: 'DB1.DBX1.5',
        plcOnCommandTag: 'DB7.DBX0.2',
        plcOffCommandTag: 'DB7.DBX0.3',
        defaultPowerW: 45,
    },
    {
        id: 'living_ac1',
        roomId: 'living',
        appName: 'Máy lạnh phòng khách',
        type: 'ac',
        apiDeviceId: 'living_ac1',
        plcStatusTag: 'DB1.DBX2.1',
        plcOnCommandTag: 'DB7.DBX1.0',
        plcOffCommandTag: 'DB7.DBX1.1',
        defaultPowerW: 1200,
    },
    {
        id: 'bedroom_ac2',
        roomId: 'bedroom',
        appName: 'Máy lạnh phòng ngủ',
        type: 'ac',
        apiDeviceId: 'bedroom_ac2',
        plcStatusTag: 'DB1.DBX2.0',
        plcOnCommandTag: 'DB7.DBX1.2',
        plcOffCommandTag: 'DB7.DBX1.3',
        defaultPowerW: 900,
    },
    {
        id: 'kitchen_lamp3',
        roomId: 'kitchen',
        appName: 'Đèn phòng bếp',
        type: 'light',
        apiDeviceId: 'kitchen_lamp3',
        plcStatusTag: 'DB1.DBX1.6',
        plcOnCommandTag: 'DB7.DBX0.4',
        plcOffCommandTag: 'DB7.DBX0.5',
        defaultPowerW: 35,
    },
    {
        id: 'bathroom_lamp4',
        roomId: 'bathroom',
        appName: 'Đèn nhà vệ sinh',
        type: 'light',
        apiDeviceId: 'bathroom_lamp4',
        plcStatusTag: 'DB1.DBX1.7',
        plcOnCommandTag: 'DB7.DBX0.6',
        plcOffCommandTag: 'DB7.DBX0.7',
        defaultPowerW: 20,
    },
];

export const getPlcMappingByDeviceId = (deviceId: string): PlcDeviceMapping | undefined => {
    return PLC_DEVICE_MAPPINGS.find((item) => item.apiDeviceId === deviceId);
};

export const buildPlcMappingSummary = () => {
    return PLC_DEVICE_MAPPINGS.map((item, index) => (
        `${index + 1}. ${item.appName}\n` +
        `PLC status: ${item.plcStatusTag} | PLC ON: ${item.plcOnCommandTag} | PLC OFF: ${item.plcOffCommandTag}\n` +
        `API device: ${item.apiDeviceId}`
    )).join('\n\n');
};
