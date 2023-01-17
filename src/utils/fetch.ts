import axios, { AxiosRequestConfig, AxiosResponse, Canceler } from 'axios';
import qs from 'qs';

interface CustomRequestConfig extends AxiosRequestConfig {
    // 根据业务确定
    requestKey?: string;
    // 是否自动重试
    retry?: boolean;
    // 最多重试次数
    maxRetryTimes?: number;
    // 是否自动取消未完成的请求, 发起新的请求时, 是否取消当前未完成的请求
    latest?: boolean;
    // 请求key, 根据业务逻辑区分, 通过key取消对应未完成的请求
}

interface RequestConfig extends CustomRequestConfig {
    requestId: number;
    cancel: Canceler;
}

const defaultConfig: CustomRequestConfig = {
    url: '',
    method: 'get',
    requestKey: '',
    params: {},
    responseType: 'json',
    timeout: 10000,
    retry: false,
    maxRetryTimes: 5,
    latest: false,
}

let requestId = 0;
const requestMap = new Map();

const instance = axios.create();
instance.interceptors.request.use(_requestSuccessInterceptor, _requestErrorInterceptor);
instance.interceptors.response.use(_reponseSuccessInterceptor, _reponseErrorInterceptor);

/**
 * 发起请求成功拦截器
 * @param config 
 * @returns 
 */
function _requestSuccessInterceptor(config: AxiosRequestConfig): AxiosRequestConfig | Promise<AxiosRequestConfig> {
    const preRequestConfig = requestMap.get((config as RequestConfig).requestKey);

    if (preRequestConfig && preRequestConfig.requestId < (config as RequestConfig).requestId) {
        console.log('取消请求', preRequestConfig.requestKey, preRequestConfig.requestId)
        preRequestConfig.cancel();
    }

    // 覆盖当前请求
    requestMap.set((config as RequestConfig).requestKey, config);

    console.log('最新请求 requestId', (config as RequestConfig).requestKey, (config as RequestConfig).requestId)
    
    return config;
};

/**
 * 发起请求异常拦截器
 */
function _requestErrorInterceptor() {};

/**
 * 获取响应成功拦截器
 * @param response 
 * @returns 
 */
function _reponseSuccessInterceptor(response: AxiosResponse<any, any>): AxiosResponse<any, any> | Promise<AxiosResponse<any, any>> {
    const { data, config } = response;
    const requestInstance = requestMap.get((config as RequestConfig).requestKey);

    console.log('完成请求的 requestId', requestInstance.requestKey, requestInstance.requestId, requestMap);

    requestMap.set(requestInstance.requestKey, null);

    return response;
};

/**
 * 获取响应异常拦截器
 * @param error 
 * @returns 
 */
function _reponseErrorInterceptor(error: AxiosResponse<any, any>): AxiosResponse<any, any> | Promise<AxiosResponse<any, any>> {
    return error;
};

function _request(config: RequestConfig) {
    const promise = new Promise((resolve, reject) => {
        instance.request(config)
            .then(response => {    
                const {
                    data, status, statusText, headers, config,
                } = response;
    
                resolve({ data });
            })
            .catch(error => {
                reject(error);
            });
    });

    return promise;
}

function request(options: CustomRequestConfig = defaultConfig) {
    requestId += 1;

    const { params, ...restOptions } = options;

    const config = { ...restOptions, requestId } as RequestConfig;

    const cancelToken = new axios.CancelToken(cancel => {
        config.cancel = cancel;
    });

    config.cancelToken = cancelToken;

    if (config.method === 'get') {
        config.params = params;
    } else if (['post', 'put', 'patch'].indexOf(config.method || '') >= 0) {
        config.data = qs.stringify(params);
    }

    return _request(config);
}

/**
 * 取消当前所有请求
 */
function cancelAllRequest() {
    for (const [requestKey, config] of requestMap) {
        config && config.cancel();
    }

    requestId = 0;
}

/**
 * 根据 requestKey 取消请求
 * @param requestKey 
 */
function cancelRequestByKey(requestKey: string) {
    const config = requestMap.get(requestKey);
    config && config.cancel()
}

export {
    instance,
    request,
    cancelAllRequest,
    cancelRequestByKey,
}
