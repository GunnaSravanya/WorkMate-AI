import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('wm_currentUser');
        return saved ? JSON.parse(saved) : null;
    });

    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('wm_language') || 'en';
    });

    const t = (path) => {
        const keys = path.split('.');
        let result = translations[language];
        for (const key of keys) {
            if (result && result[key]) {
                result = result[key];
            } else {
                return path; // Fallback to key name
            }
        }
        return result;
    };

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('wm_language', lang);
    };

    const fetchJobs = async () => {
        try {
            const res = await fetch('/api/jobs');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setJobs(data);
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const [schemesData, setSchemesData] = useState({});
    const [financeData, setFinanceData] = useState({});

    const fetchSchemes = async () => {
        try {
            const res = await fetch('/api/schemes');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setSchemesData(data);
        } catch (err) {
            console.error('Error fetching schemes:', err);
        }
    };

    const fetchLoans = async () => {
        try {
            const res = await fetch('/api/loans');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setFinanceData(data);
        } catch (err) {
            console.error('Error fetching loans:', err);
        }
    };

    const getRecommendedSchemes = async (userProfile, limit = 5) => {
        try {
            const res = await fetch(`/api/schemes/recommend?limit=${limit}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userProfile)
            });
            const data = await res.json();
            return data.recommendations || [];
        } catch (err) {
            console.error('Error getting recommendations:', err);
            return [];
        }
    };

    const searchSchemes = async (query) => {
        try {
            const res = await fetch(`/api/schemes/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            return data || [];
        } catch (err) {
            console.error('Error searching schemes:', err);
            return [];
        }
    };

    const fetchNotifications = async () => {
        if (!currentUser) return;
        try {
            const res = await fetchWithAuth(`/api/notifications/${currentUser.id}`);
            const data = await res.json();
            setNotifications(data);
        } catch (err) {
            console.error('Fetch notifications error:', err);
        }
    };

    useEffect(() => {
        fetchJobs();
        fetchSchemes();
        fetchLoans();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchNotifications();
        }

        const interval = setInterval(() => {
            if (currentUser) {
                fetchNotifications();
                fetchJobs();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [currentUser]);

    const fetchWithAuth = async (url, options = {}) => {
        try {
            const token = localStorage.getItem('wm_token');
            const headers = {
                'Content-Type': 'application/json',
                ...(token && { 'x-auth-token': token }),
                ...options.headers
            };
            const res = await fetch(url, { ...options, headers });

            // Check if response is not JSON when it's expected to be
            const contentType = res.headers.get("content-type");
            if (res.status !== 204 && contentType && !contentType.includes("application/json")) {
                console.warn(`Non-JSON response from ${url}:`, res.status);
            }

            return res;
        } catch (err) {
            console.error(`Fetch error for ${url}:`, err);
            throw err; // Re-throw so callers can handle it if needed
        }
    };

    const login = async (email, password) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error('Non-JSON response received:', text);
                if (res.status === 404) {
                    alert('Backend endpoint not found. Please ensure the server is running correctly (try: npm run dev:all).');
                } else if (res.status >= 500) {
                    alert('Server error (500). This usually happens if the backend server crashed or is misconfigured. Please check the terminal logs.');
                } else {
                    alert('Server returned an invalid response. This often happens if the backend is offline or its proxy is misconfigured.');
                }
                return false;
            }

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('wm_token', data.token);
                localStorage.setItem('wm_currentUser', JSON.stringify(data.user));
                setCurrentUser(data.user);
                return true;
            } else {
                alert(data.message || 'Login failed');
                return false;
            }
        } catch (err) {
            console.error('Login error:', err);
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                alert('Cannot connect to server. Please check if the backend is running on http://localhost:5000');
            } else {
                alert('Login error: ' + err.message);
            }
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('wm_token');
        localStorage.removeItem('wm_currentUser');
        setCurrentUser(null);
    };

    const registerUser = async (userData) => {
        try {
            console.log('Registering user with data:', { ...userData, password: '***' });
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error('Non-JSON response received from registration:', text);
                alert('Registration error: Server returned an invalid response. Please ensure the backend is running.');
                return false;
            }

            const data = await res.json();
            console.log('Registration Response:', { ok: res.ok, status: res.status, data });
            if (res.ok) {
                localStorage.setItem('wm_token', data.token);
                localStorage.setItem('wm_currentUser', JSON.stringify(data.user));
                setCurrentUser(data.user);
                await fetchJobs();
                console.log('Registration Success');
                return true;
            } else {
                alert(data.message || 'Registration failed');
                return false;
            }
        } catch (err) {
            console.error('Registration error:', err);
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                alert('Cannot connect to server for registration. Please check if the backend is running.');
            } else {
                alert('Registration error: ' + err.message);
            }
            return false;
        }
    };

    const postJob = async (jobData) => {
        try {
            const res = await fetchWithAuth('/api/jobs', {
                method: 'POST',
                body: JSON.stringify(jobData)
            });
            if (res.ok) {
                await fetchJobs();
                return true;
            }
        } catch (err) {
            console.error('Post job error:', err);
        }
        return false;
    };

    const acceptJob = async (jobId) => {
        try {
            const res = await fetchWithAuth(`/api/jobs/${jobId}/accept`, {
                method: 'PATCH'
            });
            if (res.ok) {
                fetchJobs();
                return true;
            }
        } catch (err) {
            console.error('Accept job error:', err);
        }
        return false;
    };

    const markAttendance = async (jobId, status, dayIndex) => {
        try {
            const res = await fetchWithAuth(`/api/jobs/${jobId}/attendance`, {
                method: 'PATCH',
                body: JSON.stringify({ status, dayIndex })
            });
            if (res.ok) {
                await fetchJobs();
                return true;
            } else {
                const errData = await res.json();
                console.error('Mark attendance failed:', errData);
                alert(`Error: ${errData.message}`);
            }
        } catch (err) {
            console.error('Mark attendance error:', err);
            alert('Network error marking attendance');
        }
        return false;
    };

    const completeJob = async (jobId) => {
        try {
            const res = await fetchWithAuth(`/api/jobs/${jobId}/complete`, {
                method: 'PATCH'
            });
            if (res.ok) {
                await fetchJobs();
                return true;
            } else {
                const errData = await res.json();
                console.error('Complete job failed:', errData);
                alert(`Error: ${errData.message}`);
            }
        } catch (err) {
            console.error('Complete job error:', err);
            alert('Network error completing job');
        }
        return false;
    };

    const payJob = async (jobId) => {
        try {
            const res = await fetchWithAuth(`/api/jobs/${jobId}/pay`, {
                method: 'PATCH'
            });
            if (res.ok) {
                await fetchJobs();
                return true;
            } else {
                const errData = await res.json();
                console.error('Pay job failed:', errData);
                alert(`Error: ${errData.message}`);
            }
        } catch (err) {
            console.error('Pay job error:', err);
            alert('Network error paying job');
        }
        return false;
    };

    const addManualJob = async (jobData) => {
        try {
            const res = await fetchWithAuth('/api/jobs', {
                method: 'POST',
                body: JSON.stringify({ ...jobData, type: 'manual' })
            });
            if (res.ok) {
                await fetchJobs();
                return true;
            }
        } catch (err) {
            console.error('Add manual job error:', err);
        }
        return false;
    };

    const myNotifications = notifications.filter(n => String(n.userId) === String(currentUser?.id));

    return (
        <AppContext.Provider value={{
            users, jobs, currentUser, schemesData, financeData, loading,
            language, t, changeLanguage,
            login, logout, registerUser,
            postJob, acceptJob, markAttendance, completeJob, payJob, addManualJob,
            getRecommendedSchemes, searchSchemes,
            notifications: myNotifications,
            fetchWithAuth
        }}>
            {children}
        </AppContext.Provider>
    );
};
