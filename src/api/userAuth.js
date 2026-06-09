import { ApiError, apiRequest } from './client';
let cachedUser = null;
let hasChecked = false;
export const getUserOptions = async () => {
    const result = await apiRequest('/api/auth/user/options');
    return result.data;
};
export const userLogin = async (name, password) => {
    const result = await apiRequest('/api/auth/user/login', {
        method: 'POST',
        body: JSON.stringify({ name, password }),
    });
    cachedUser = result.data;
    hasChecked = true;
    return result.data;
};
export const userLogout = async () => {
    await apiRequest('/api/auth/user/logout', {
        method: 'POST',
    });
    cachedUser = null;
    hasChecked = true;
};
export const checkUserSession = async (force = false) => {
    if (!force && hasChecked) {
        return cachedUser;
    }
    try {
        const result = await apiRequest('/api/auth/user/me');
        cachedUser = result.data;
        hasChecked = true;
        return result.data;
    }
    catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            cachedUser = null;
            hasChecked = true;
            return null;
        }
        throw error;
    }
};
export const getCachedUser = () => cachedUser;
