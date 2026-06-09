import { apiRequest } from './client';
export const fetchMemories = async () => {
    const result = await apiRequest('/api/memories');
    return result.data;
};
export const fetchPublishMemories = async () => {
    const result = await apiRequest('/api/publish/memories');
    return result.data;
};
export const fetchPublishMemoryById = async (id) => {
    const result = await apiRequest(`/api/publish/memories/${id}`);
    return result.data;
};
export const createPublishMemory = async (memory) => {
    const result = await apiRequest('/api/publish/memories', {
        method: 'POST',
        body: JSON.stringify(memory),
    });
    return result.data;
};
export const updatePublishMemory = async (id, memory) => {
    const result = await apiRequest(`/api/publish/memories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(memory),
    });
    return result.data;
};
export const deletePublishMemory = async (id) => {
    await apiRequest(`/api/publish/memories/${id}`, {
        method: 'DELETE',
    });
};
export const uploadPublishMedia = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/publish/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = typeof payload?.message === 'string' ? payload.message : '上传失败';
        throw new Error(message);
    }
    return payload.data.url;
};
