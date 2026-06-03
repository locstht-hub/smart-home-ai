import { Device } from './data';

export interface PlcDeviceMapping {
    id: string;
    roomId: 'living' | 'bedroom' | 'kitchen' | 'garage';
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
        id: 'living_main_light',
        roomId: 'living',
        appName: 'Đèn chính phòng khách',
        type: 'light',
        apiDeviceId: 'living_main_light',
        plcStatusTag: 'DB1.DBX1.2',
        plcOnCommandTag: 'DB7.DBX0.0',
        plcOffCommandTag: 'DB7.DBX0.1',
        defaultPowerW: 45,
    },
    {
        id: 'kitchen_light',
        roomId: 'kitchen',
        appName: 'Đèn phòng bếp',
        type: 'light',
        apiDeviceId: 'kitchen_light',
        plcStatusTag: 'DB1.DBX1.3',
        plcOnCommandTag: 'DB7.DBX0.2',
        plcOffCommandTag: 'DB7.DBX0.3',
        defaultPowerW: 35,
    },
    {
        id: 'bedroom_light',
        roomId: 'bedroom',
        appName: 'Đèn phòng ngủ',
        type: 'light',
        apiDeviceId: 'bedroom_light',
        plcStatusTag: 'DB1.DBX1.4',
        plcOnCommandTag: 'DB7.DBX0.4',
        plcOffCommandTag: 'DB7.DBX0.5',
        defaultPowerW: 15,
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
