// Syria Development Network - Main JavaScript
class SyriaDevelopmentNetwork {
    constructor() {
        this.initiatives = [];
        this.filteredInitiatives = [];
        this.currentPage = 1;
        this.isLoading = false;
        this.searchTimeout = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadInitiatives();
    }
    
    // Initialize DOM elements
    initializeElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            categoryFilter: document.getElementById('categoryFilter'),
            countryFilter: document.getElementById('countryFilter'),
            cityFilter: document.getElementById('cityFilter'),
            clearFilters: document.getElementById('clearFilters'),
            sortSelect: document.getElementById('sortSelect'),
            resultsCount: document.getElementById('resultsCount'),
            initiativesGrid: document.getElementById('initiativesGrid'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            errorMessage: document.getElementById('errorMessage'),
            noResults: document.getElementById('noResults'),
            loadMoreContainer: document.getElementById('loadMoreContainer'),
            loadMoreBtn: document.getElementById('loadMoreBtn'),
            retryButton: document.getElementById('retryButton'),
            backToTop: document.getElementById('backToTop')
        };
    }
    
    // Bind event listeners
    bindEvents() {
        // Search functionality
        this.elements.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        this.elements.clearSearch.addEventListener('click', () => {
            this.clearSearch();
        });
        
        // Filter functionality
        this.elements.categoryFilter.addEventListener('change', () => {
            this.applyFilters();
        });
        
        this.elements.countryFilter.addEventListener('change', () => {
            this.applyFilters();
        });
        
        this.elements.cityFilter.addEventListener('change', () => {
            this.applyFilters();
        });
        
        this.elements.clearFilters.addEventListener('click', () => {
            this.clearFilters();
        });
        
        // Sort functionality
        this.elements.sortSelect.addEventListener('change', () => {
            this.applySorting();
        });
        
        // Load more functionality
        this.elements.loadMoreBtn.addEventListener('click', () => {
            this.loadMore();
        });
        
        // Retry functionality
        this.elements.retryButton.addEventListener('click', () => {
            this.loadInitiatives();
        });
        
        // Back to top functionality
        this.elements.backToTop.addEventListener('click', () => {
            this.scrollToTop();
        });
        
        // Scroll event for back to top button
        window.addEventListener('scroll', () => {
            this.toggleBackToTop();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }
    
    // Load initiatives from Google Sheets
    async loadInitiatives() {
        try {
            this.showLoading();
            this.hideError();
            
            // Check cache first
            const cachedData = this.getCachedData();
            if (cachedData) {
                this.initiatives = cachedData;
                this.setupFilters();
                this.clearAllFilters();
                this.displayInitiatives();
                return;
            }
            
            // Fetch from Google Sheets
            const data = await this.fetchFromGoogleSheets();
            this.initiatives = this.processData(data);
            
            // Cache the data
            this.cacheData(this.initiatives);
            
            // Setup filters and display
            this.setupFilters();
            this.clearAllFilters();
            this.displayInitiatives();
            
        } catch (error) {
            console.error('Error loading initiatives:', error);
            
            // Show specific error messages based on error type
            if (error.message.includes('CSV parsing error')) {
                this.showError(CONFIG.ERROR_MESSAGES.PARSE_ERROR);
            } else if (error.message.includes('HTML redirect')) {
                this.showError(CONFIG.ERROR_MESSAGES.REDIRECT_ERROR);
            } else if (error.message.includes('HTTP error')) {
                this.showError(CONFIG.ERROR_MESSAGES.CSV_ERROR);
            } else if (error.message.includes('Network')) {
                this.showError(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
            } else {
                this.showError(CONFIG.ERROR_MESSAGES.FETCH_FAILED);
            }
        } finally {
            this.hideLoading();
        }
    }
    
    // Fetch data from Google Sheets CSV export
    async fetchFromGoogleSheets() {
        const { CSV_URL, MAX_RETRIES, RETRY_DELAY } = CONFIG.GOOGLE_SHEETS;
        
        let lastError;
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(CSV_URL, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/csv, text/plain, */*',
                        'Cache-Control': 'no-cache'
                    },
                    redirect: 'follow'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const csvText = await response.text();
                
                if (!csvText || csvText.trim().length === 0) {
                    throw new Error('Empty CSV data received');
                }
                
                // Check if we received HTML instead of CSV (redirect page)
                if (csvText.trim().toLowerCase().startsWith('<html') || 
                    csvText.includes('<title>') || 
                    csvText.includes('temporary redirect')) {
                    throw new Error('Received HTML redirect instead of CSV data');
                }
                
                // Debug: Log first few lines of CSV
                console.log('CSV Preview:', csvText.split('\n').slice(0, 3).join('\n'));
                
                return this.parseCSV(csvText);
                
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt < MAX_RETRIES) {
                    await this.delay(RETRY_DELAY * attempt); // Exponential backoff
                }
            }
        }
        
        throw new Error(`Failed to fetch data after ${MAX_RETRIES} attempts: ${lastError.message}`);
    }
    
    // Parse CSV text into array of objects
    parseCSV(csvText) {
        try {
            const lines = csvText.trim().split('\n');
            
            if (lines.length < 2) {
                throw new Error('CSV must have at least a header row and one data row');
            }
            
            // Parse headers
            const headers = this.parseCSVRow(lines[0]);
            
            // Parse data rows
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const row = this.parseCSVRow(lines[i]);
                if (row.length > 0 && row[0]) { // Skip empty rows
                    const initiative = {};
                    headers.forEach((header, index) => {
                        initiative[header] = row[index] || '';
                    });
                    data.push(initiative);
                }
            }
            
            return data;
            
        } catch (error) {
            throw new Error(`CSV parsing error: ${error.message}`);
        }
    }
    
    // Parse a single CSV row, handling quoted fields
    parseCSVRow(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
        
        // Add the last field
        result.push(current.trim());
        
        return result;
    }
    
    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Process raw data from CSV
    processData(rawData) {
        return rawData.filter(initiative => 
            initiative[CONFIG.COLUMNS.INITIATIVE_NAME] && 
            initiative[CONFIG.COLUMNS.INITIATIVE_NAME].trim()
        );
    }
    
    // Setup filter options
    setupFilters() {
        const categories = [...new Set(this.initiatives.map(i => i[CONFIG.COLUMNS.CATEGORY]).filter(Boolean))];
        const countries = [...new Set(this.initiatives.map(i => i[CONFIG.COLUMNS.COUNTRY]).filter(Boolean))];
        const cities = [...new Set(this.initiatives.map(i => i[CONFIG.COLUMNS.CITY]).filter(Boolean))];
        
        this.populateFilter(this.elements.categoryFilter, categories);
        this.populateFilter(this.elements.countryFilter, countries);
        this.populateFilter(this.elements.cityFilter, cities);
    }
    
    // Populate filter dropdown
    populateFilter(selectElement, options) {
        // Clear existing options except the first one
        while (selectElement.children.length > 1) {
            selectElement.removeChild(selectElement.lastChild);
        }
        
        // Add new options
        options.sort().forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
    }
    
    // Handle search functionality
    handleSearch(searchTerm) {
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Show/hide clear search button
        this.elements.clearSearch.style.display = searchTerm ? 'block' : 'none';
        
        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
        }, CONFIG.APP.SEARCH_DEBOUNCE);
    }
    
    // Apply filters and search
    applyFilters() {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        const categoryFilter = this.elements.categoryFilter.value;
        const countryFilter = this.elements.countryFilter.value;
        const cityFilter = this.elements.cityFilter.value;
        
        this.filteredInitiatives = this.initiatives.filter(initiative => {
            // Search filter
            const searchMatch = !searchTerm || 
                initiative[CONFIG.COLUMNS.INITIATIVE_NAME].toLowerCase().includes(searchTerm) ||
                initiative[CONFIG.COLUMNS.CATEGORY].toLowerCase().includes(searchTerm) ||
                initiative[CONFIG.COLUMNS.COUNTRY].toLowerCase().includes(searchTerm) ||
                initiative[CONFIG.COLUMNS.CITY].toLowerCase().includes(searchTerm) ||
                initiative[CONFIG.COLUMNS.DESCRIPTION].toLowerCase().includes(searchTerm);
            
            // Category filter
            const categoryMatch = !categoryFilter || initiative[CONFIG.COLUMNS.CATEGORY] === categoryFilter;
            
            // Country filter
            const countryMatch = !countryFilter || initiative[CONFIG.COLUMNS.COUNTRY] === countryFilter;
            
            // City filter
            const cityMatch = !cityFilter || initiative[CONFIG.COLUMNS.CITY] === cityFilter;
            
            return searchMatch && categoryMatch && countryMatch && cityMatch;
        });
        
        this.currentPage = 1;
        this.applySorting();
        this.displayInitiatives();
    }
    
    // Apply sorting
    applySorting() {
        const sortBy = this.elements.sortSelect.value;
        
        this.filteredInitiatives.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a[CONFIG.COLUMNS.INITIATIVE_NAME].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.INITIATIVE_NAME].toLowerCase();
                    return aValue.localeCompare(bValue);
                    
                case 'name-desc':
                    aValue = a[CONFIG.COLUMNS.INITIATIVE_NAME].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.INITIATIVE_NAME].toLowerCase();
                    return bValue.localeCompare(aValue);
                    
                case 'category':
                    aValue = a[CONFIG.COLUMNS.CATEGORY].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.CATEGORY].toLowerCase();
                    return aValue.localeCompare(bValue);
                    
                case 'country':
                    aValue = a[CONFIG.COLUMNS.COUNTRY].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.COUNTRY].toLowerCase();
                    return aValue.localeCompare(bValue);
                    
                case 'city':
                    aValue = a[CONFIG.COLUMNS.CITY].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.CITY].toLowerCase();
                    return aValue.localeCompare(bValue);
                    
                default:
                    return 0;
            }
        });
        
        this.displayInitiatives();
    }
    
    // Display initiatives
    displayInitiatives() {
        const startIndex = (this.currentPage - 1) * CONFIG.APP.ITEMS_PER_PAGE;
        const endIndex = startIndex + CONFIG.APP.ITEMS_PER_PAGE;
        const initiativesToShow = this.filteredInitiatives.slice(startIndex, endIndex);
        
        // Update results count
        this.updateResultsCount();
        
        // Show/hide no results message
        if (this.filteredInitiatives.length === 0) {
            this.showNoResults();
            return;
        } else {
            this.hideNoResults();
        }
        
        // Clear grid if it's the first page
        if (this.currentPage === 1) {
            this.elements.initiativesGrid.innerHTML = '';
        }
        
        // Add initiative cards
        initiativesToShow.forEach(initiative => {
            const card = this.createInitiativeCard(initiative);
            this.elements.initiativesGrid.appendChild(card);
        });
        
        // Show/hide load more button
        this.elements.loadMoreContainer.style.display = 
            endIndex < this.filteredInitiatives.length ? 'block' : 'none';
    }
    
    // Create initiative card
    createInitiativeCard(initiative) {
        const card = document.createElement('div');
        card.className = 'initiative-card';
        
        const location = this.formatLocation(initiative);
        const socialLinks = this.createSocialLinks(initiative);
        
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${this.escapeHtml(initiative[CONFIG.COLUMNS.INITIATIVE_NAME])}</h3>
                ${initiative[CONFIG.COLUMNS.CATEGORY] ? 
                    `<span class="card-category">${this.escapeHtml(initiative[CONFIG.COLUMNS.CATEGORY])}</span>` : ''}
            </div>
            <div class="card-body">
                ${initiative[CONFIG.COLUMNS.DESCRIPTION] ? 
                    `<p class="card-description">${this.escapeHtml(initiative[CONFIG.COLUMNS.DESCRIPTION])}</p>` : ''}
                
                ${location ? `<div class="card-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${location}</span>
                </div>` : ''}
                
                <div class="card-contact">
                    ${initiative[CONFIG.COLUMNS.WEBSITE] ? `
                        <div class="contact-item">
                            <i class="fas fa-globe"></i>
                            <a href="${this.escapeHtml(initiative[CONFIG.COLUMNS.WEBSITE])}" target="_blank" rel="noopener">
                                Visit Website
                            </a>
                        </div>
                    ` : ''}
                    
                    ${initiative[CONFIG.COLUMNS.PHONE] ? `
                        <div class="contact-item">
                            <i class="fas fa-phone"></i>
                            <a href="tel:${this.escapeHtml(initiative[CONFIG.COLUMNS.PHONE])}">
                                ${this.escapeHtml(initiative[CONFIG.COLUMNS.PHONE])}
                            </a>
                        </div>
                    ` : ''}
                    
                    ${initiative[CONFIG.COLUMNS.ADDRESS] ? `
                        <div class="contact-item">
                            <i class="fas fa-map-pin"></i>
                            <span>${this.escapeHtml(initiative[CONFIG.COLUMNS.ADDRESS])}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${socialLinks ? `<div class="card-social">${socialLinks}</div>` : ''}
            </div>
        `;
        
        return card;
    }
    
    // Format location string
    formatLocation(initiative) {
        const parts = [
            initiative[CONFIG.COLUMNS.CITY],
            initiative[CONFIG.COLUMNS.COUNTRY]
        ].filter(Boolean);
        
        return parts.length > 0 ? parts.join(', ') : null;
    }
    
    // Create social media links
    createSocialLinks(initiative) {
        const links = [];
        
        Object.entries(CONFIG.SOCIAL_PLATFORMS).forEach(([column, platform]) => {
            const account = initiative[column];
            if (account) {
                const url = this.formatSocialUrl(platform.baseUrl, account);
                links.push(`
                    <a href="${url}" target="_blank" rel="noopener" class="social-link" 
                       title="${column.replace(' Account', '')}">
                        <i class="${platform.icon}"></i>
                    </a>
                `);
            }
        });
        
        return links.join('');
    }
    
    // Format social media URL
    formatSocialUrl(baseUrl, account) {
        // Remove @ symbol if present
        const cleanAccount = account.replace(/^@/, '');
        return baseUrl + cleanAccount;
    }
    
    // Update results count
    updateResultsCount() {
        const total = this.filteredInitiatives.length;
        const showing = Math.min(this.currentPage * CONFIG.APP.ITEMS_PER_PAGE, total);
        
        this.elements.resultsCount.textContent = 
            total === 0 ? 'No initiatives found' : 
            `Showing ${showing} of ${total} initiative${total === 1 ? '' : 's'}`;
    }
    
    // Load more initiatives
    loadMore() {
        this.currentPage++;
        this.displayInitiatives();
        
        // Scroll to show new content
        const lastCard = this.elements.initiativesGrid.lastElementChild;
        if (lastCard) {
            lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    // Clear search
    clearSearch() {
        this.elements.searchInput.value = '';
        this.elements.clearSearch.style.display = 'none';
        this.applyFilters();
    }
    
    // Clear filters
    clearFilters() {
        this.elements.categoryFilter.value = '';
        this.elements.countryFilter.value = '';
        this.elements.cityFilter.value = '';
        this.applyFilters();
    }
    
    // Clear all filters and search (used on initial load)
    clearAllFilters() {
        this.elements.searchInput.value = '';
        this.elements.categoryFilter.value = '';
        this.elements.countryFilter.value = '';
        this.elements.cityFilter.value = '';
        this.elements.sortSelect.value = 'name';
        this.elements.clearSearch.style.display = 'none';
        this.currentPage = 1;
        
        // Set filtered initiatives to all initiatives and apply sorting
        this.filteredInitiatives = [...this.initiatives];
        this.applySorting();
    }
    
    // Show loading state
    showLoading() {
        this.isLoading = true;
        this.elements.loadingSpinner.style.display = 'block';
        this.elements.initiativesGrid.style.display = 'none';
    }
    
    // Hide loading state
    hideLoading() {
        this.isLoading = false;
        this.elements.loadingSpinner.style.display = 'none';
        this.elements.initiativesGrid.style.display = 'grid';
    }
    
    // Show error message
    showError(message) {
        this.elements.errorMessage.querySelector('p').textContent = message;
        this.elements.errorMessage.style.display = 'block';
        this.elements.initiativesGrid.style.display = 'none';
    }
    
    // Hide error message
    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }
    
    // Show no results message
    showNoResults() {
        this.elements.noResults.style.display = 'block';
        this.elements.initiativesGrid.style.display = 'none';
        this.elements.loadMoreContainer.style.display = 'none';
    }
    
    // Hide no results message
    hideNoResults() {
        this.elements.noResults.style.display = 'none';
        this.elements.initiativesGrid.style.display = 'grid';
    }
    
    // Cache data in localStorage
    cacheData(data) {
        if (!CONFIG.FEATURES.ENABLE_CACHING) return;
        
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.CACHED_DATA, JSON.stringify(data));
            localStorage.setItem(CONFIG.STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
        } catch (error) {
            console.warn('Failed to cache data:', error);
        }
    }
    
    // Get cached data
    getCachedData() {
        if (!CONFIG.FEATURES.ENABLE_CACHING) return null;
        
        try {
            const cachedData = localStorage.getItem(CONFIG.STORAGE_KEYS.CACHED_DATA);
            const timestamp = localStorage.getItem(CONFIG.STORAGE_KEYS.CACHE_TIMESTAMP);
            
            if (cachedData && timestamp) {
                const age = Date.now() - parseInt(timestamp);
                if (age < CONFIG.GOOGLE_SHEETS.CACHE_DURATION) {
                    return JSON.parse(cachedData);
                }
            }
        } catch (error) {
            console.warn('Failed to retrieve cached data:', error);
        }
        
        return null;
    }
    
    // Toggle back to top button
    toggleBackToTop() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        this.elements.backToTop.style.display = scrollTop > 300 ? 'block' : 'none';
    }
    
    // Scroll to top
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Handle keyboard navigation
    handleKeyboardNavigation(event) {
        // Escape key to clear search
        if (event.key === 'Escape' && document.activeElement === this.elements.searchInput) {
            this.clearSearch();
            this.elements.searchInput.blur();
        }
    }
    
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SyriaDevelopmentNetwork();
}); 