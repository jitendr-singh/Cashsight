import axios from 'axios';

// Ek base axios instance banayein jisme backend ka URL fixed ho
const API = axios.create({
    baseURL: 'http://localhost:8000/api/v1', // Aapka FastAPI backend endpoint
    timeout: 10000, // Agar 10 seconds tak response na aaye toh request cancel ho jaye
    headers: {
        'Content-Type': 'application/json',
    },
});

// REQUEST INTERCEPTOR: Har request bhejne se pehle localStorage se token check karega
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Login ke baad hum token yahan save karenge
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // FastAPI OAuth2 format
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// RESPONSE INTERCEPTOR: Agar token expire ho jaye (401 Unauthorized), toh user ko login page par bhej de
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('Session expired or unauthorized. Redirecting to login...');
            localStorage.removeItem('token'); // Purana invalid token hatao
            // Agar aap chaho toh yahan window.location.href = '/login' bhi kar sakte ho baad mein
        }
        return Promise.reject(error);
    }
);

export default API;