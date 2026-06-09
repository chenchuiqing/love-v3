import { apiRequest } from './client';
export const fetchComments = async (memoryId) => {
    const result = await apiRequest(`/api/memories/${memoryId}/comments`);
    return result.data;
};
export const createComment = async (memoryId, data) => {
    const result = await apiRequest(`/api/memories/${memoryId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return result.data;
};
export const deleteComment = async (commentId) => {
    await apiRequest(`/api/comments/${commentId}`, {
        method: 'DELETE',
    });
};
