import { api } from './api';

export interface FacebookStatus {
    /** Server has a FACEBOOK_APP_ID (the FB SDK can run). */
    configured: boolean;
    appId: string;
    /** Store has the social_marketing module (or dev-free). */
    entitled: boolean;
    /** A Page is connected with a usable token. */
    connected: boolean;
    enabled: boolean;
    pageId: string | null;
    pageName: string | null;
}

export interface FacebookPageRef { id: string; name: string; instagram_business_id?: string | null; }

export interface FacebookPost {
    id: string;
    message?: string;
    story?: string;
    created_time: string;
    full_picture?: string;
    permalink_url?: string;
    comments?: { summary?: { total_count?: number } };
    likes?: { summary?: { total_count?: number } };
    shares?: { count?: number };
}

export interface FacebookComment {
    id: string;
    message: string;
    from?: { name?: string; id?: string };
    created_time: string;
    like_count?: number;
    is_hidden?: boolean;
}

/** Permissions requested at Facebook Login for full Page management. */
export const FACEBOOK_SCOPES = [
    'public_profile',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_manage_engagement',
    'pages_read_user_content',
    'read_insights',
    'business_management',
];

const SDK_VERSION = 'v21.0';
let sdkPromise: Promise<void> | null = null;

/** Lazy-load + init the Facebook JS SDK (once). */
export const loadFacebookSdk = (appId: string): Promise<void> => {
    if (typeof window === 'undefined') return Promise.resolve();
    if ((window as any).FB) return Promise.resolve();
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise<void>((resolve, reject) => {
        (window as any).fbAsyncInit = () => {
            (window as any).FB.init({ appId, cookie: true, xfbml: false, version: SDK_VERSION });
            resolve();
        };
        const id = 'facebook-jssdk';
        if (document.getElementById(id)) return;
        const s = document.createElement('script');
        s.id = id;
        s.src = 'https://connect.facebook.net/en_US/sdk.js';
        s.async = true; s.defer = true; s.crossOrigin = 'anonymous';
        s.onerror = () => reject(new Error('Could not load the Facebook SDK (check your connection / ad-blocker).'));
        document.body.appendChild(s);
    });
    return sdkPromise;
};

/** Open the Facebook Login dialog; resolves with a short-lived user access token. */
export const facebookLogin = (): Promise<string> => new Promise((resolve, reject) => {
    const FB = (window as any).FB;
    if (!FB) return reject(new Error('Facebook SDK not ready.'));
    FB.login((response: any) => {
        const token = response?.authResponse?.accessToken;
        if (token) resolve(token);
        else reject(new Error('Facebook login was cancelled or not authorized.'));
    }, { scope: FACEBOOK_SCOPES.join(','), return_scopes: true });
});

/** Frontend wrapper around the backend Facebook Pages endpoints. */
export const facebookService = {
    getStatus: () => api.get<FacebookStatus>('/facebook/status'),

    connect: (accessToken: string) =>
        api.post<{ connected: boolean; page?: FacebookPageRef; pages?: FacebookPageRef[] }>('/facebook/connect', { accessToken }, { skipQueue: true }),

    selectPage: (pageId: string) =>
        api.post<{ connected: boolean; page: FacebookPageRef }>('/facebook/select-page', { pageId }, { skipQueue: true }),

    setEnabled: (enabled: boolean) => api.put('/facebook/enabled', { enabled }),
    disconnect: () => api.post('/facebook/disconnect', {}, { skipQueue: true }),

    publish: (payload: { message?: string; link?: string; imageUrl?: string }) =>
        api.post<{ success: boolean; id?: string; post_id?: string; message?: string }>('/facebook/publish', payload, { skipQueue: true }),

    getPosts: () => api.get<FacebookPost[]>('/facebook/posts'),
    getComments: (postId: string) => api.get<FacebookComment[]>(`/facebook/posts/${postId}/comments`),
    replyComment: (commentId: string, message: string) =>
        api.post<{ success: boolean }>(`/facebook/comments/${commentId}/reply`, { message }, { skipQueue: true }),
    hideComment: (commentId: string, hidden: boolean) =>
        api.post<{ success: boolean }>(`/facebook/comments/${commentId}/hide`, { hidden }, { skipQueue: true }),
    deleteComment: (commentId: string) => api.delete<{ success: boolean }>(`/facebook/comments/${commentId}`),

    getInsights: () => api.get<any[]>('/facebook/insights'),
};

export default facebookService;
