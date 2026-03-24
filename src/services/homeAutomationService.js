// Home Automation Service
// API calls for home automation

import { mobileApi, ENDPOINTS } from './api/mobileApi';

export const getDevices = async () => {
    return mobileApi.get(ENDPOINTS.homeAutomation.devices);
};

export const getDevice = async (deviceId) => {
    return mobileApi.get(ENDPOINTS.homeAutomation.device(deviceId));
};

export const addDevice = async (deviceData) => {
    return mobileApi.post(ENDPOINTS.homeAutomation.add, deviceData);
};

export const updateDevice = async (deviceId, deviceData) => {
    return mobileApi.put(ENDPOINTS.homeAutomation.update(deviceId), deviceData);
};

export const deleteDevice = async (deviceId) => {
    return mobileApi.delete(ENDPOINTS.homeAutomation.delete(deviceId));
};

export const controlDevice = async (deviceId, command) => {
    return mobileApi.post(ENDPOINTS.homeAutomation.control(deviceId), command);
};

export const getRooms = async () => {
    return mobileApi.get(ENDPOINTS.homeAutomation.devices);
};

export const getDevicesByRoom = async (room) => {
    return mobileApi.get(ENDPOINTS.homeAutomation.devices);
};

export const getDevicesByType = async (deviceType) => {
    return mobileApi.get(ENDPOINTS.homeAutomation.devices);
};

export const getStatistics = async () => {
    return mobileApi.get(ENDPOINTS.homeAutomation.devices);
};

export default {
    getDevices,
    getDevice,
    addDevice,
    updateDevice,
    deleteDevice,
    controlDevice,
    getRooms,
    getDevicesByRoom,
    getDevicesByType,
    getStatistics
};
