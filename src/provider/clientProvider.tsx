import { Student, SchoolClass, SchoolClassExpanded, Exercise, ExerciseGroup, Evaluation } from "@/types/types";
import React, { createContext, useContext, useMemo, ReactNode, useState, useEffect, useCallback } from "react";

const USER_STORAGE_KEY = "sportsgrade_user";

// ============ UI-COMPATIBLE TYPES ============
// These types match the legacy UI component expectations

export interface UIStudent {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    classId: string;
    className: string;
    avatar?: string;
    email?: string;
    dateOfBirth?: string;
    gender: 'M' | 'F';
    averageGrade: number;
    totalGrades: number;
    lastActivityDate: string;
    performanceLevel: 'excellent' | 'good' | 'average' | 'needs-improvement';
    trends: {
        improving: boolean;
        percentageChange: number;
    };
}

export interface UIGrade {
    id: string;
    studentId: string;
    exerciseType: string;
    exerciseName: string;
    date: string;
    criteria: {
        technical: number;
        effort: number;
        teamwork?: number;
        overall: number;
    };
    finalGrade: number;
    notes?: string;
}

export interface UIClass {
    id: string;
    name: string;
    year: string;
    studentCount: number;
    averageGrade: number;
    totalExercises: number;
    isArchived: boolean;
}

// ============ CONVERSION FUNCTIONS ============

function toUIStudent(
    student: Student,
    classes: SchoolClass[],
    evaluations: Evaluation[]
): UIStudent {
    const studentClass = classes.find(c => c.id === student.currentClassId);
    // Filter to only include confirmed evaluations (score > 0)
    // Excludes NON VALUTATO and VALUTANDO which have score = 0
    const studentEvals = evaluations.filter(e => e.studentId === student.id && e.score > 0);
    const avgGrade = studentEvals.length > 0
        ? studentEvals.reduce((sum, e) => sum + e.score, 0) / studentEvals.length
        : 0;

    let performanceLevel: UIStudent['performanceLevel'] = 'average';
    if (avgGrade >= 8) performanceLevel = 'excellent';
    else if (avgGrade >= 7) performanceLevel = 'good';
    else if (avgGrade >= 6) performanceLevel = 'average';
    else performanceLevel = 'needs-improvement';

    return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName} ${student.lastName}`,
        classId: student.currentClassId,
        className: studentClass?.className || 'N/A',
        gender: student.gender === 'M' ? 'M' : 'F',
        dateOfBirth: student.birthdate,
        averageGrade: Math.round(avgGrade * 10) / 10,
        totalGrades: studentEvals.length,
        lastActivityDate: studentEvals.length > 0
            ? studentEvals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
            : student.createdAt,
        performanceLevel,
        trends: {
            improving: true, // Placeholder - would need historical data
            percentageChange: 0,
        },
    };
}

function toUIGrade(
    evaluation: Evaluation,
    exercises: Exercise[],
    exerciseGroups: ExerciseGroup[]
): UIGrade {
    const exercise = exercises.find(e => e.id === evaluation.exerciseId);
    const group = exercise ? exerciseGroups.find(g => g.id === exercise.exerciseGroupId) : null;

    return {
        id: `${evaluation.studentId}-${evaluation.exerciseId}`,
        studentId: evaluation.studentId,
        exerciseType: group?.groupName || 'altro',
        exerciseName: exercise?.name || 'Esercizio',
        date: evaluation.createdAt,
        criteria: {
            technical: evaluation.score,
            effort: evaluation.score,
            overall: evaluation.score,
        },
        finalGrade: evaluation.score,
        notes: evaluation.comments,
    };
}

function toUIClass(
    schoolClass: SchoolClass,
    evaluations: Evaluation[],
    students: Student[]
): UIClass {
    const classStudents = students.filter(s => s.currentClassId === schoolClass.id);
    const classStudentIds = classStudents.map(s => s.id);
    // Filter to only include confirmed evaluations (score > 0)
    // Excludes NON VALUTATO and VALUTANDO which have score = 0
    const classEvals = evaluations.filter(e => classStudentIds.includes(e.studentId) && e.score > 0);
    const avgGrade = classEvals.length > 0
        ? classEvals.reduce((sum, e) => sum + e.score, 0) / classEvals.length
        : 0;

    return {
        id: schoolClass.id,
        name: schoolClass.className,
        year: schoolClass.schoolYear,
        studentCount: schoolClass.students.length,
        averageGrade: Math.round(avgGrade * 10) / 10,
        totalExercises: schoolClass.exerciseGroups.length,
        isArchived: schoolClass.isArchived,
    };
}

export interface UserModel {
    success: boolean;
    expiresIn: number;
    accessToken?: string;
    refreshToken?: string;
    user: {
        uid: string;
        email: string;
        displayName: string;
        avatar?: string;
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

    private _userModel: UserModel | null = null;
    private onUserChange: ((user: UserModel | null) => void) | null = null;

    constructor() {
        this.apiKey = import.meta.env.VITE_API_KEY || "";
        this.MainURl = import.meta.env.VITE_API_URL || "";
        // this.MainURl = "http://localhost:3000";
    }


    // Check if user is authenticated
    public async isAuthenticated(): Promise<boolean> {
        try {
            const response = await this.sendRequest<UserModel>('/api/user', "GET");  // Endpoint che restituisce user da verifyJWT
            if (response.success) {
                this._userModel = response.data;

                return true;
            }

            return false;
        } catch {

            return false;
        }
    }

    // Logout - clear user data and cookies
    public async logout() {
        try {
            await this.sendRequest("/auth/logout", "POST");
        } catch (e) {
            console.error("Logout error", e);
        }
        this.UserModel = null;
    }

    // ============ STUDENTS API ============
    public async getStudents() {
        return await this.sendRequest<Student[]>("/api/students", "GET");
    }

    public async getStudent(id: string) {
        return await this.sendRequest<Student>(`/api/students/${id}`, "GET");
    }

    public async createStudent(data: Omit<Student, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
        return await this.sendRequest<Student>("/api/students", "POST", data);
    }

    public async updateStudent(id: string, data: Partial<Omit<Student, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>) {
        return await this.sendRequest<Student>(`/api/students/${id}`, "PUT", data);
    }

    public async deleteStudent(id: string) {
        return await this.sendRequest<void>(`/api/students/${id}`, "DELETE");
    }

    // ============ CLASSES API ============
    public async getClasses() {
        return await this.sendRequest<SchoolClass[]>("/api/classes", "GET");
    }

    public async getClassById(id: string) {
        return await this.sendRequest<SchoolClassExpanded>(`/api/classes/${id}`, "GET");
    }

    public async getArchivedClasses() {
        return await this.sendRequest<SchoolClass[]>("/api/classes/archived", "GET");
    }

    public async getNonArchivedClasses() {
        return await this.sendRequest<SchoolClass[]>("/api/classes/non-archived", "GET");
    }

    // CreateClass accepts student data objects that will be created by the backend
    public async createClass(data: {
        className: string;
        schoolYear?: string;
        students?: Array<{ firstName: string; lastName: string; gender?: string; birthdate?: string; notes?: string }>;
    }) {
        return await this.sendRequest<{ message: string; classId: string; studentsCount: number; studentIds: string[] }>("/api/classes", "POST", data);
    }

    public async updateClass(id: string, data: Partial<Omit<SchoolClass, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>) {
        return await this.sendRequest<SchoolClass>(`/api/classes/${id}`, "PUT", data);
    }

    public async deleteClass(id: string) {
        return await this.sendRequest<void>(`/api/classes/${id}`, "DELETE");
    }

    // ============ EXERCISES API ============
    public async getAllExercises() {
        return await this.sendRequest<Exercise[]>("/api/exercises", "GET");
    }

    public async getExercise(id: string) {
        return await this.sendRequest<Exercise>(`/api/exercises/${id}`, "GET");
    }

    public async getExercisesByGroupId(groupId: string) {
        return await this.sendRequest<Exercise[]>(`/api/exercises/exercise-group/${groupId}`, "GET");
    }

    public async createExercise(data: Omit<Exercise, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
        return await this.sendRequest<Exercise>("/api/exercises", "POST", data);
    }

    public async updateExercise(id: string, data: Partial<Omit<Exercise, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>) {
        return await this.sendRequest<Exercise>(`/api/exercises/${id}`, "PUT", data);
    }

    public async deleteExercise(id: string) {
        return await this.sendRequest<void>(`/api/exercises/${id}`, "DELETE");
    }

    // ============ EXERCISE GROUPS API ============
    public async getAllExerciseGroups() {
        return await this.sendRequest<ExerciseGroup[]>("/api/exercisesGroup", "GET");
    }

    public async getExerciseGroup(id: string) {
        return await this.sendRequest<ExerciseGroup>(`/api/exercisesGroup/${id}`, "GET");
    }

    public async createExerciseGroup(data: Omit<ExerciseGroup, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
        return await this.sendRequest<ExerciseGroup>("/api/exercisesGroup", "POST", data);
    }

    public async updateExerciseGroup(id: string, data: Partial<Omit<ExerciseGroup, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>) {
        return await this.sendRequest<ExerciseGroup>(`/api/exercisesGroup/${id}`, "PUT", data);
    }

    public async deleteExerciseGroup(id: string) {
        return await this.sendRequest<void>(`/api/exercisesGroup/${id}`, "DELETE");
    }

    // ============ EVALUATIONS API ============
    public async getAllEvaluations() {
        return await this.sendRequest<Evaluation[]>("/api/evaluations", "GET");
    }

    public async getEvaluationById(id: string) {
        return await this.sendRequest<Evaluation>(`/api/evaluations/${id}`, "GET");
    }

    public async getEvaluationsByStudentId(studentId: string) {
        return await this.sendRequest<Evaluation[]>(`/api/evaluations/student/${studentId}`, "GET");
    }

    public async createEvaluation(data: Omit<Evaluation, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
        return await this.sendRequest<Evaluation>("/api/evaluations", "POST", data);
    }

    public async deleteEvaluation(id: string) {
        return await this.sendRequest<void>(`/api/evaluations/${id}`, "DELETE");
    }

    public async register(email: string, password: string, firstName: string, lastName: string) {
        const res = await this.sendRequest<UserModel>("/auth/register", "POST", { email, password, firstName, lastName });

        if (res.success) {
            this.UserModel = res.data;
            this.isAuthenticated()
        }

        return res;
    }

    public async login(email: string, password: string) {
        const res = await this.sendRequest<UserModel>("/auth/login", "POST", { email, password });


        if (res.success) {
            this.UserModel = res.data;

            this.isAuthenticated()
        }

        return res;
    }

    // Getter for UserModel
    public get UserModel(): UserModel | null {
        return this._userModel;
    }

    // Setter for UserModel - automatically persists to localStorage
    public set UserModel(value: UserModel | null) {
        this._userModel = value;
        this.persistUser(value);
        this.onUserChange?.(value);
    }

    // Set callback for user changes (used by React context)
    public setOnUserChange(callback: (user: UserModel | null) => void) {
        this.onUserChange = callback;
    }

    // Persist user to localStorage
    private persistUser(user: UserModel | null) {
        if (user) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    }

    // Load user from localStorage
    public loadPersistedUser(): UserModel | null {
        try {
            const stored = localStorage.getItem(USER_STORAGE_KEY);
            if (stored) {
                const user = JSON.parse(stored) as UserModel;
                this._userModel = user;
                return user;
            }
        } catch (error) {
            console.error("Failed to load persisted user:", error);
            localStorage.removeItem(USER_STORAGE_KEY);
        }
        return null;
    }




    // Refresh the access token using the refresh token (via cookie)
    public async refreshAccessToken(): Promise<boolean> {
        try {
            // No body needed, refresh token is in the cookie
            const response = await this.sendRequest<{ accessToken?: string; expiresIn?: number }>("/auth/refresh-token", "POST");

            if (response.success) {
                // If the server returns a new access token in body, update it (optional depending on implementation)
                // But primarily we rely on the cookie being updated by the response headers

                // We might want to re-fetch the user to ensure we have the latest state
                // but for now, just marking as success is enough for the interceptor to retry

                return true;
            }

            return false;
        } catch (error) {
            console.error("Error refreshing token:", error);
            return false;
        }
    }

    // Get the expiration date of the refresh token - NOT POSSIBLE with HttpOnly cookies
    public getRefreshTokenExpiration(): Date | null {
        return null;
    }

    // Check if refresh token is about to expire - NOT POSSIBLE with HttpOnly cookies
    public isRefreshTokenNearExpiry(_hoursBuffer: number = 24): boolean {
        return false;
    }

    // Check if access token is expired - NOT POSSIBLE with HttpOnly cookies
    // We rely on the API returning 401
    public isAccessTokenExpired(): boolean {
        return false;
    }

    // Validate session and refresh if needed - call this on app startup
    public async validateAndRefreshSession(): Promise<boolean> {
        // Just try to fetch the user. If it succeeds (potentially after auto-refresh), we are good.
        // If it fails, we are not logged in.
        return await this.isAuthenticated();
    }



    // Public method to send requests with proper error handling and auto-refresh
    private async sendRequest<T>(endpoint: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown, isRetry: boolean = false): Promise<ApiResponse<T>> {
        try {
            if (!endpoint) {
                throw new ApiError("Endpoint is not valid", 400, "Bad Request");
            }

            if (!method) {
                throw new ApiError("Method is not valid", 400, "Bad Request");
            }

            const url = `${this.MainURl}${endpoint}`;

            let result: ApiResponse<T>;

            if (method === "GET") {
                result = await this.get<T>(url);
            } else if (method === "POST") {
                result = await this.post<T>(url, body);
            } else if (method === "PUT") {
                result = await this.put<T>(url, body);
            } else if (method === "DELETE") {
                result = await this.delete<T>(url);
            } else {
                throw new ApiError("Method not supported", 405, "Method Not Allowed");
            }

            // Se riceviamo 401 e non è già un retry, prova a refreshare il token
            if (!result.success && result.error?.statusCode === 401 && !isRetry) {

                const refreshed = await this.refreshAccessToken();

                if (refreshed) {
                    // Riprova la richiesta originale

                    return await this.sendRequest<T>(endpoint, method, body, true);
                } else {
                    // Refresh fallito, l'utente deve riloggarsi
                    console.error("Token refresh failed, user needs to login again");
                    this.logout();
                }
            }

            return result;

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
                credentials: "include",
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

            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                credentials: "include",
                body: JSON.stringify(body),
            });

            return await this.handleResponse<T>(response);

        } catch (error) {
            return this.handleError<T>(error);
        }
    }

    private async put<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
        try {
            if (!url) {
                throw new ApiError("URL is not valid", 400, "Bad Request");
            }

            const headers = this._Headers();

            const response = await fetch(url, {
                method: "PUT",
                headers: headers,
                credentials: "include",
                body: body ? JSON.stringify(body) : undefined,
            });

            return await this.handleResponse<T>(response);

        } catch (error) {
            return this.handleError<T>(error);
        }
    }

    private async delete<T>(url: string): Promise<ApiResponse<T>> {
        try {
            if (!url) {
                throw new ApiError("URL is not valid", 400, "Bad Request");
            }

            const headers = this._Headers();

            const response = await fetch(url, {
                method: "DELETE",
                credentials: "include",
                headers: headers,
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


        // if (this._userModel?.accessToken) {
        //     headers["authorization"] = `Bearer ${this._userModel.accessToken}`;
        // }


        return headers;
    }
}

export { ApiError, type ApiResponse };



interface ClientContextProps {
    client: Client;
    user: UserModel | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
    // Classes
    classes: SchoolClass[];
    refreshClasses: () => Promise<void>;
    // Students
    students: Student[];
    refreshStudents: () => Promise<void>;
    // Exercises
    exercises: Exercise[];
    refreshExercises: () => Promise<void>;
    // Exercise Groups
    exerciseGroups: ExerciseGroup[];
    refreshExerciseGroups: () => Promise<void>;
    // Evaluations
    evaluations: Evaluation[];
    refreshEvaluations: () => Promise<void>;
    // Utility to refresh all data
    refreshAllData: () => Promise<void>;
}

export const ClientContext = createContext<ClientContextProps | undefined>(
    undefined
);

interface ClientProviderProps {
    children: ReactNode;
}

export const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserModel | null>(null);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const client = useMemo(() => {
        const c = new Client();
        return c;
    }, []);

    // Initialize user state from client on mount and validate session
    useEffect(() => {
        const initializeSession = async () => {
            setIsLoading(true);

            // First load persisted user data
            const persistedUser = client.loadPersistedUser();

            if (persistedUser) {
                // Validate and refresh session if needed
                const isValid = await client.validateAndRefreshSession();

                if (isValid) {
                    // Session is valid or was refreshed successfully
                    setUser(client.UserModel);
                } else {
                    // Session is invalid, user needs to re-login
                    setUser(null);
                }
            }

            setIsLoading(false);
        };

        // Set up callback for user changes
        client.setOnUserChange((newUser) => {
            setUser(newUser);
        });

        initializeSession();
    }, [client]);

    const logout = useCallback(() => {
        client.logout();
        setUser(null);
        setClasses([]);
        setStudents([]);
        setExercises([]);
        setExerciseGroups([]);
        setEvaluations([]);
    }, [client]);

    const refreshClasses = useCallback(async () => {
        if (!user) return;
        try {
            const response = await client.getClasses();
            if (response.success && response.data) {
                setClasses(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch classes", error);
        }
    }, [client, user]);

    const refreshStudents = useCallback(async () => {
        if (!user) return;
        try {
            const response = await client.getStudents();
            if (response.success && response.data) {
                setStudents(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    }, [client, user]);

    const refreshExercises = useCallback(async () => {
        if (!user) return;
        try {
            const response = await client.getAllExercises();
            if (response.success && response.data) {
                setExercises(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch exercises", error);
        }
    }, [client, user]);

    const refreshExerciseGroups = useCallback(async () => {
        if (!user) return;
        try {
            const response = await client.getAllExerciseGroups();
            if (response.success && response.data) {
                setExerciseGroups(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch exercise groups", error);
        }
    }, [client, user]);

    const refreshEvaluations = useCallback(async () => {
        if (!user) return;
        try {
            const response = await client.getAllEvaluations();
            if (response.success && response.data) {
                setEvaluations(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch evaluations", error);
        }
    }, [client, user]);

    const refreshAllData = useCallback(async () => {
        await Promise.all([
            refreshClasses(),
            refreshStudents(),
            refreshExercises(),
            refreshExerciseGroups(),
            refreshEvaluations(),
        ]);
    }, [refreshClasses, refreshStudents, refreshExercises, refreshExerciseGroups, refreshEvaluations]);

    // Fetch all data when user is authenticated
    useEffect(() => {
        if (user) {
            refreshAllData();
        }
    }, [user, refreshAllData]);

    const isAuthenticated = user !== null;

    const value = useMemo(() => ({
        client,
        user,
        isAuthenticated,
        isLoading,
        logout,
        classes,
        refreshClasses,
        students,
        refreshStudents,
        exercises,
        refreshExercises,
        exerciseGroups,
        refreshExerciseGroups,
        evaluations,
        refreshEvaluations,
        refreshAllData,
    }), [client, user, isAuthenticated, isLoading, logout, classes, refreshClasses, students, refreshStudents, exercises, refreshExercises, exerciseGroups, refreshExerciseGroups, evaluations, refreshEvaluations, refreshAllData]);

    return (
        <ClientContext.Provider value={value}>
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

// New hook for accessing auth state
export const useAuth = () => {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error("useAuth deve essere usato dentro ClientProvider");
    }
    return {
        user: context.user,
        isAuthenticated: context.isAuthenticated,
        isLoading: context.isLoading,
        logout: context.logout,
    };
};

export const useSchoolData = () => {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error("useSchoolData must be used within a ClientProvider");
    }

    // Compute UI-compatible data
    const uiStudents = useMemo(() =>
        context.students.map(s => toUIStudent(s, context.classes, context.evaluations)),
        [context.students, context.classes, context.evaluations]
    );

    const uiGrades = useMemo(() =>
        context.evaluations.map(e => toUIGrade(e, context.exercises, context.exerciseGroups)),
        [context.evaluations, context.exercises, context.exerciseGroups]
    );

    const uiClasses = useMemo(() =>
        context.classes.map(c => toUIClass(c, context.evaluations, context.students)),
        [context.classes, context.evaluations, context.students]
    );

    // Helper to get UI students for a specific class
    const getUIStudentsByClass = useCallback((classId: string) =>
        uiStudents.filter(s => s.classId === classId),
        [uiStudents]
    );

    // Helper to get UI grades for a specific class
    const getUIGradesByClass = useCallback((classId: string) => {
        const classStudentIds = uiStudents
            .filter(s => s.classId === classId)
            .map(s => s.id);
        return uiGrades.filter(g => classStudentIds.includes(g.studentId));
    }, [uiStudents, uiGrades]);

    return {
        // Raw backend data
        classes: context.classes,
        refreshClasses: context.refreshClasses,
        students: context.students,
        refreshStudents: context.refreshStudents,
        exercises: context.exercises,
        refreshExercises: context.refreshExercises,
        exerciseGroups: context.exerciseGroups,
        refreshExerciseGroups: context.refreshExerciseGroups,
        evaluations: context.evaluations,
        refreshEvaluations: context.refreshEvaluations,
        refreshAllData: context.refreshAllData,
        // UI-compatible data
        uiStudents,
        uiGrades,
        uiClasses,
        getUIStudentsByClass,
        getUIGradesByClass,
    };
};
