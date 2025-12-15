import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// 处理后端返回的 URL，添加基础 URL
// 生产环境和开发环境都使用相对路径，让代理或同域部署处理
export function getFullUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    // 已经是完整 URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // 相对路径，确保以 / 开头
    if (!url.startsWith('/')) {
        url = '/' + url;
    }
    return url;
}

// 处理头像 URL
export function getAvatarUrl(avatar: string | null | undefined): string | null {
    return getFullUrl(avatar);
}

// 处理媒体 URL（图片、视频等）
// V2.3 后端已改为直接返回数组，但保留兼容旧格式的逻辑
export function getMediaUrl(mediaUrls: string | string[] | null | undefined): string | null {
    if (!mediaUrls) return null;
    
    // V2.3: 后端直接返回数组
    if (Array.isArray(mediaUrls)) {
        return mediaUrls.length > 0 ? getFullUrl(mediaUrls[0]) : null;
    }
    
    // 兼容旧格式：JSON 字符串
    let url = mediaUrls;
    if (typeof mediaUrls === 'string' && mediaUrls.startsWith('[')) {
        try {
            const parsed = JSON.parse(mediaUrls);
            url = Array.isArray(parsed) ? parsed[0] : parsed;
        } catch {
            url = mediaUrls;
        }
    } else if (typeof mediaUrls === 'string') {
        url = mediaUrls.split(',')[0];
    }
    
    return getFullUrl(url);
}

// 获取所有媒体 URL（用于多图展示）
export function getAllMediaUrls(mediaUrls: string | string[] | null | undefined): string[] {
    if (!mediaUrls) return [];
    
    // V2.3: 后端直接返回数组
    if (Array.isArray(mediaUrls)) {
        return mediaUrls.map(url => getFullUrl(url)).filter((url): url is string => url !== null);
    }
    
    // 兼容旧格式
    if (typeof mediaUrls === 'string' && mediaUrls.startsWith('[')) {
        try {
            const parsed = JSON.parse(mediaUrls);
            if (Array.isArray(parsed)) {
                return parsed.map(url => getFullUrl(url)).filter((url): url is string => url !== null);
            }
        } catch {
            // 解析失败，当作单个 URL
        }
    }
    
    const url = getFullUrl(mediaUrls);
    return url ? [url] : [];
}

export function getApiErrorMessage(error: any, t: any): string {
    if (!error) return t('errors.generic');

    // V2.3: 处理 429 限流错误
    if (error.response?.status === 429) {
        return t('errors.rate_limit') || '操作太频繁，请稍后再试';
    }

    // 1. Check for specific error_code from backend (New standard)
    const errorCode = error.response?.data?.error_code;
    if (errorCode) {
        const translated = t(`errors.${errorCode}`);
        // If translation key equals the error code, it means missing translation, fallback to message or code
        if (translated !== `errors.${errorCode}`) {
            return translated;
        }
        return error.response?.data?.message || errorCode;
    }

    // 2. Fallback to detail (FastAPI default validation errors)
    const detail = error.response?.data?.detail;
    if (detail) {
        if (Array.isArray(detail)) {
            return detail.map((d: any) => d.msg).join(', ');
        }
        return typeof detail === 'string' ? detail : JSON.stringify(detail);
    }

    // 3. Network or other errors
    return error.message || t('errors.generic');
}
