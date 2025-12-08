import { Student } from "@/types";
import { SchoolClass } from "@/types/types";
import React, { createContext, useContext, useMemo, ReactNode } from "react";


export interface UserModel {
    success: boolean;
    accessToken: string;
    refreshToken: string;
    expiresIn: 980;
    user: {
        uid: string;
        email: string;
    }
}

type HeaderType = Record<string, string>;

// Custom error class for API errors
class ApiError extends Error {
    public statusCode: number;
    public statusText: string;
    public isNetworkError: boolean;

    constructor(message: string, statusCode: number = 0, statusText: string = "", isNetworkError: boolean = false) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.statusText = statusText;
        this.isNetworkError = isNetworkError;
    }
}

// Response type for consistent API responses
interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: ApiError | null;
}

class Client {

    private apiKey: string;
    private MainURl: string;

    public UserModel: UserModel | null = null;

    constructor() {
        this.apiKey = import.meta.env.VITE_API_KEY || "";
        // this.MainURl = import.meta.env.VITE_API_URL || "";
        this.MainURl = "http://localhost:3000";
    }

    public async getStudents() {
        return await this.sendRequest<Student[]>("/api/students", "GET");
    }

    public async getClasses() {
        return await this.sendRequest<SchoolClass[]>("/api/classes", "GET");
    }

    public async register(email: string, password: string) {
        const res = await this.sendRequest<UserModel>("/auth/register", "POST", { email, password });

        if (res.success) {
            this.UserModel = res.data;

        }

        return res;
    }

    public async login(email: string, password: string) {

        const res = await this.sendRequest<UserModel>("/auth/login", "POST", { email, password });


        if (res.success) {
            this.UserModel = res.data;

        }

        return res;

    }

    // Public method to send requests with proper error handling
    private async sendRequest<T>(endpoint: string, method: "GET" | "POST", body?: unknown): Promise<ApiResponse<T>> {
        try {
            if (!endpoint) {
                throw new ApiError("Endpoint is not valid", 400, "Bad Request");
            }

            if (!method) {
                throw new ApiError("Method is not valid", 400, "Bad Request");
            }

            const url = `${this.MainURl}${endpoint}`;

            if (method === "GET") {
                return await this.get<T>(url);
            }

            if (method === "POST") {
                return await this.post<T>(url, body);
            }

            throw new ApiError("Method not supported", 405, "Method Not Allowed");

        } catch (error) {
            return this.handleError<T>(error);
        }
    }

    // Centralized error handler for all requests
    private handleError<T>(error: unknown): ApiResponse<T> {
        if (error instanceof ApiError) {
            return {
                success: false,
                data: null,
                error: error,
            };
        }

        if (error instanceof TypeError && error.message === "Failed to fetch") {
            return {
                success: false,
                data: null,
                error: new ApiError(
                    "Network error: Unable to connect to the server",
                    0,
                    "Network Error",
                    true
                ),
            };
        }

        if (error instanceof Error) {
            return {
                success: false,
                data: null,
                error: new ApiError(error.message, 500, "Internal Error"),
            };
        }

        return {
            success: false,
            data: null,
            error: new ApiError("An unknown error occurred", 500, "Unknown Error"),
        };
    }

    // Handle the response and parse JSON
    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        try {
            if (!response.ok) {
                // Try to get error message from response body
                let errorMessage = `Request failed with status ${response.status}`;
                try {
                    const errorBody = await response.json();
                    errorMessage = errorBody.message || errorBody.error || errorMessage;
                } catch {
                    // Response body is not JSON, use default message
                }

                throw new ApiError(errorMessage, response.status, response.statusText);
            }

            // Try to parse JSON response
            const data = await response.json() as T;
            return {
                success: true,
                data: data,
                error: null,
            };

        } catch (error) {
            return this.handleError<T>(error);
        }
    }

    private async get<T>(url: string): Promise<ApiResponse<T>> {
        try {
            const headers = this._Headers();
            const response = await fetch(url, {
                method: "GET",
                headers: headers,
            });
            return await this.handleResponse<T>(response);

        } catch (error) {
            return this.handleError<T>(error);
        }
    }

    private async post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
        try {
            if (!url) {
                throw new ApiError("URL is not valid", 400, "Bad Request");
            }

            if (!body) {
                throw new ApiError("Body is not valid", 400, "Bad Request");
            }

            const headers = this._Headers();
            console.log(headers);

            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
            });

            return await this.handleResponse<T>(response);

        } catch (error) {
            return this.handleError<T>(error);
        }
    }

    private _Headers(): HeaderType {
        if (!this.apiKey) {
            throw new ApiError("API Key is not valid", 401, "Unauthorized");
        }

        const headers: HeaderType = {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKey,
        };


        if (this.UserModel?.accessToken) {
            headers["authorization"] = `Bearer ${this.UserModel.accessToken}`;
        }


        return headers;
    }
}

export { ApiError, type ApiResponse };



interface ClientContextProps {
    client: Client;
}

export const ClientContext = createContext<ClientContextProps | undefined>(
    undefined
);

interface ClientProviderProps {
    children: ReactNode;
}

export const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
    const client = useMemo(() => {
        return new Client();
    }, []);

    return (
        <ClientContext.Provider value={{ client }}>
            {children}
        </ClientContext.Provider>
    );
};

export const useClient = () => {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error("useClient deve essere usato dentro ClientProvider");
    }
    return context.client;
};
