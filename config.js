// Configuration file for Syria Development Network
const CONFIG = {
    // Google Sheets Configuration
    GOOGLE_SHEETS: {
        // The Google Sheets file ID from the URL
        SPREADSHEET_ID: '1I8gjMYP_To9usV_oFfWXsg7s6bV-0uMBU6q54VY7wXw',
        
        // CSV Export URL (publicly accessible)
        // For testing, using local CSV file. Replace with your Google Sheets CSV URL when ready
        CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQT_ys6UuVzp9td2IXEGOdGg9Qr-I0UOwmjMWpJVDkHu7RZdZ74sCl28GeVo90JLedchKfAxU15EvAF/pub?output=csv',
        
        // Cache duration in milliseconds (5 minutes)
        CACHE_DURATION: 5 * 60 * 1000,
        
        // Retry attempts for failed requests
        MAX_RETRIES: 3,
        
        // Retry delay in milliseconds
        RETRY_DELAY: 1000
    },
    
    // Application Settings
    APP: {
        // Number of items to display per page
        ITEMS_PER_PAGE: 12,
        
        // Search debounce delay in milliseconds
        SEARCH_DEBOUNCE: 300,
        
        // Animation duration for smooth transitions
        ANIMATION_DURATION: 300,
        
        // Auto-refresh interval in milliseconds (disabled by default)
        AUTO_REFRESH_INTERVAL: null, // Set to a number to enable auto-refresh
    },
    
    // Social Media Platforms
    SOCIAL_PLATFORMS: {
        'X Account': {
            baseUrl: 'https://x.com/',
            color: '#1DA1F2'
        },
        'Instagram Account': {
            baseUrl: 'https://instagram.com/',
            color: '#E4405F'
        },
        'Linkedin Account': {
            baseUrl: 'https://linkedin.com/in/',
            color: '#0077B5'
        },
        'Facebook Account': {
            baseUrl: 'https://facebook.com/',
            color: '#1877F2'
        }
    },
    
    // Data Column Mapping
    COLUMNS: {
        INITIATIVE_NAME: 'Initiative Name',
        X_ACCOUNT: 'X Account',
        INSTAGRAM_ACCOUNT: 'Instagram Account',
        LINKEDIN_ACCOUNT: 'Linkedin Account',
        FACEBOOK_ACCOUNT: 'Facebook Account',
        WEBSITE: 'Website',
        COUNTRY: 'Country',
        CITY: 'City',
        ADDRESS: 'Address',
        PHONE: 'Phone',
        CATEGORY: 'Category',
        DESCRIPTION: 'Description',
        NOTES: 'Notes'
    },
    
    // Default Categories (will be populated from data)
    DEFAULT_CATEGORIES: [
        'Education',
        'Healthcare',
        'Infrastructure',
        'Economic Development',
        'Humanitarian Aid',
        'Technology',
        'Environment',
        'Cultural Preservation',
        'Youth Development',
        'Women Empowerment'
    ],
    
    // Error Messages
    ERROR_MESSAGES: {
        FETCH_FAILED: 'Failed to load initiatives. Please check your internet connection and try again.',
        NO_DATA: 'No initiatives found. Please try adjusting your search criteria.',
        CSV_ERROR: 'Unable to load data from Google Sheets. Please try again later.',
        NETWORK_ERROR: 'Network error. Please check your connection and try again.',
        INVALID_RESPONSE: 'Invalid CSV data received. Please check the spreadsheet format.',
        PARSE_ERROR: 'Error parsing CSV data. Please check the spreadsheet format.',
        REDIRECT_ERROR: 'Unable to access CSV data. Please ensure the spreadsheet is published to web and the URL is correct.'
    },
    
    // Loading States
    LOADING_STATES: {
        INITIAL: 'Loading initiatives...',
        SEARCHING: 'Searching initiatives...',
        FILTERING: 'Filtering results...',
        LOADING_MORE: 'Loading more initiatives...'
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        CACHED_DATA: 'syria_dev_network_data',
        CACHE_TIMESTAMP: 'syria_dev_network_cache_timestamp',
        USER_PREFERENCES: 'syria_dev_network_preferences',
        SEARCH_HISTORY: 'syria_dev_network_search_history'
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_CACHING: true,
        ENABLE_SEARCH_HISTORY: true,
        ENABLE_AUTO_REFRESH: false,
        ENABLE_ANALYTICS: false,
        ENABLE_OFFLINE_MODE: false
    },
    
    // Analytics Configuration (if enabled)
    ANALYTICS: {
        GOOGLE_ANALYTICS_ID: '', // Add your GA4 ID here
        TRACK_SEARCHES: true,
        TRACK_FILTERS: true,
        TRACK_CLICKS: true
    }
};

// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} 