import baseUrl from '@/utils/base-urls';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const BASE_URL = `${baseUrl.serverUrl}api/v1/`;

class ApiService {
    static axiosInstance: any;
    static cancelTokens: any[] = [];
    static access_token: string | null = null;

    static init(): void {
        ApiService.axiosInstance = axios.create({
            baseURL: BASE_URL,
            timeout: 10000,
        });

        this.access_token = localStorage.getItem('access_token');
        if (this.access_token) {
            this.setHeader(this.access_token);
        }

        // Attach Token to Every Request
        ApiService.axiosInstance.interceptors.request.use(
            (config: AxiosRequestConfig) => {
                const token = this.getAccessToken();
                if (token) {
                    config.headers = {
                        ...config.headers,
                        Authorization: `Bearer ${token}`, // Pass Bearer token
                    };
                }
                return config;
            },
            (error: any) => Promise.reject(error)
        );

        // Response Interceptor
        ApiService.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => {
                return response;
            },
            (error: any) => {
                return Promise.reject(error);
            }
        );
    }

    static setHeader(access_token: string): void {
        this.access_token = access_token;
        ApiService.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        ApiService.axiosInstance.defaults.headers.common['Accept'] = 'application/json';
    }

    static setTokenInLocal(token: string): void {
        localStorage.setItem('access_token', token);
        this.setHeader(token);
    }

    static removeTokenFromLocal(): void {
        localStorage.removeItem('access_token');
        this.access_token = null;
        delete ApiService.axiosInstance.defaults.headers.common['Authorization'];
    }

    static getAccessToken(): string | null {
        return this.access_token;
    }

    static async get(resource: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        return ApiService.axiosInstance.get(resource, config);
    }

    static async post(resource: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        return ApiService.axiosInstance.post(resource, data, config);
    }

    static async put(resource: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        return ApiService.axiosInstance.put(resource, data, config);
    }

    static async patch(resource: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        return ApiService.axiosInstance.patch(resource, data, config);
    }

    static async delete(resource: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        return ApiService.axiosInstance.delete(resource, config);
    }
}

export default ApiService;
