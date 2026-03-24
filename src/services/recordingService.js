// Recording Service
// Handles audio/video recording uploads

import * as FileSystem from 'expo-file-system';
import { mobileApi } from './api/mobileApi';

class RecordingService {
    constructor() {
        this.uploadQueue = [];
        this.isUploading = false;
    }

    async uploadRecording(recordingUri, metadata = {}) {
        const formData = new FormData();

        formData.append('recording', {
            uri: recordingUri,
            type: 'audio/m4a',
            name: `recording_${Date.now()}.m4a`
        });

        Object.keys(metadata).forEach(key => {
            formData.append(key, metadata[key]);
        });

        try {
            const response = await mobileApi.post('/recordings/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return { success: true, data: response };
        } catch (error) {
            this.uploadQueue.push({ uri: recordingUri, metadata });
            return { success: false, queued: true };
        }
    }

    async processQueue() {
        if (this.isUploading || this.uploadQueue.length === 0) {
            return;
        }

        this.isUploading = true;

        while (this.uploadQueue.length > 0) {
            const item = this.uploadQueue[0];
            try {
                await this.uploadRecording(item.uri, item.metadata);
                this.uploadQueue.shift();
            } catch (error) {
                break;
            }
        }

        this.isUploading = false;
    }
}

export default new RecordingService();
