export class ApiError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}
export const apiRequest = async (url, init) => {
    const response = await fetch(url, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
        ...init,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = typeof payload?.message === 'string' ? payload.message : '请求失败';
        throw new ApiError(message, response.status);
    }
    return payload;
};
