// layout-state.js
// Exporta el estado compartido para el Header y Footer en Thymeleaf (Vue 3)

function useLayoutState(Vue) {
    const { ref, reactive, computed, onMounted, onUnmounted } = Vue;

    const scrolled = ref(false);
    const activeSection = ref('#inicio');
    const mobileMenuOpen = ref(false);
    const mobileProductsOpen = ref(false);
    const megaOpen = ref(false);

    const categories = ref([]);
    const subcategories = ref([]);
    const activeCatId = ref(null);

    const cartStore = reactive({
        isOpen: false,
        items: []
    });
    
    // Favorites state
    const favoritesStore = reactive({
        items: []
    });
    
    // Auth state (will fetch from server)
    const loggedIn = ref(false);
    const user = ref(null);

    // Configuración del negocio
    const businessConfig = ref({
        name: 'ByteMarket',
        whatsapp: '+51 999 999 999',
        ruc: '',
        email: '',
        address: '',
        logoUrl: '/images/logo.png',
        stockEnabled: 1,
        autoPaymentEnabled: 0,
        couponsEnabled: 0,
        multiuserEnabled: 0
    });

    const fetchBusinessConfig = async () => {
        try {
            const res = await fetch('/api/landing/business-config');
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    businessConfig.value = { ...businessConfig.value, ...data };
                }
            }
        } catch (e) {
            console.error('Error fetching business config', e);
        }
    };

    // Compute cart totals dynamically — ahora usan cartStore directamente (sin .value)
    const cartItemCount = computed(() => {
        return cartStore.items.reduce((acc, item) => acc + (item.quantity || 1), 0);
    });
    
    const cartTotalAmount = computed(() => {
        return cartStore.items.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
    });

    const formatPrice = (val) => `S/ ${Number(val).toFixed(2)}`;
    const cartTotalLabel = computed(() => formatPrice(cartTotalAmount.value));

    // Cart Actions — sin .value porque cartStore es reactive
    const saveCart = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cp_cart', JSON.stringify(cartStore.items));
        }
    };

    const loadCart = () => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('cp_cart');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    cartStore.items.splice(0, cartStore.items.length, ...parsed);
                } catch(e) {
                    console.error('Error loading cart', e);
                }
            }
        }
    };

    const checkAuthSession = async () => {
        try {
            const res = await fetch('/api/_auth/session');
            if (res.ok) {
                const data = await res.json();
                if (data && data.user) {
                    user.value = data.user;
                    loggedIn.value = true;
                    await syncFavoritesFromDB();
                } else {
                    user.value = null;
                    loggedIn.value = false;
                    loadFavoritesFromLocal();
                }
            }
        } catch (e) {
            console.error('Error fetching session', e);
            loadFavoritesFromLocal();
        }
    };

    // Favorites Logic
    const favoritesCount = computed(() => favoritesStore.items.length);

    const loadFavoritesFromLocal = () => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('bytemarket_wishlist');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    favoritesStore.items.splice(0, favoritesStore.items.length, ...parsed);
                } catch(e) {}
            }
        }
    };

    const saveFavoritesToLocal = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('bytemarket_wishlist', JSON.stringify(favoritesStore.items));
        }
    };

    const syncFavoritesFromDB = async () => {
        try {
            const res = await fetch('/api/users/favorites');
            if (res.ok) {
                const dbFavorites = await res.json();
                favoritesStore.items.splice(0, favoritesStore.items.length, ...dbFavorites);
                saveFavoritesToLocal(); // Keep local in sync
            }
        } catch (e) {
            console.error('Error syncing favorites', e);
        }
    };

    const toggleGlobalFavorite = async (productId) => {
        const isFav = favoritesStore.items.includes(productId);
        
        if (isFav) {
            favoritesStore.items.splice(favoritesStore.items.indexOf(productId), 1);
            saveFavoritesToLocal();
            if (loggedIn.value) {
                fetch(`/api/users/favorites/${productId}`, { method: 'DELETE' }).catch(console.error);
            }
        } else {
            favoritesStore.items.push(productId);
            saveFavoritesToLocal();
            if (loggedIn.value) {
                fetch(`/api/users/favorites/${productId}`, { method: 'POST' }).catch(console.error);
            }
        }
        return !isFav;
    };

    const addToCart = async (product) => {
        const existing = cartStore.items.find(i => i.id === product.id);
        if (existing) {
            existing.quantity++;
        } else {
            const primary = product?.images?.find(i => i.isPrimary);
            const imageUrl = primary?.url || product?.images?.[0]?.url || null;
            cartStore.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: imageUrl
            });
        }
        saveCart();
        cartStore.isOpen = true;
    };

    const removeFromCart = (productId) => {
        const idx = cartStore.items.findIndex(i => i.id === productId);
        if (idx !== -1) cartStore.items.splice(idx, 1);
        saveCart();
    };

    const updateQuantity = (productId, qty) => {
        const item = cartStore.items.find(i => i.id === productId);
        if (item) {
            if (qty < 1) qty = 1;
            item.quantity = qty;
            saveCart();
        }
    };

    const clearCart = () => {
        cartStore.items.splice(0, cartStore.items.length);
        saveCart();
    };

    // Search Autocomplete Logic
    const searchQuery = ref('');
    const searchSuggestions = ref([]);
    const isSearchLoading = ref(false);
    const searchTimeout = ref(null);
    const showSearchDropdown = ref(false);

    const onSearchInput = (e) => {
        const val = e.target.value;
        searchQuery.value = val;
        
        if (searchTimeout.value) clearTimeout(searchTimeout.value);
        
        if (!val || val.length < 2) {
            searchSuggestions.value = [];
            showSearchDropdown.value = false;
            return;
        }

        isSearchLoading.value = true;
        showSearchDropdown.value = true;

        searchTimeout.value = setTimeout(async () => {
            try {
                const res = await fetch(`/api/products?q=${encodeURIComponent(val)}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    searchSuggestions.value = data.data || [];
                }
            } catch(e) {
                console.error(e);
            } finally {
                isSearchLoading.value = false;
            }
        }, 400); 
    };
    
    const submitSearch = () => {
        if (searchQuery.value) {
            window.location.href = `/productos?q=${encodeURIComponent(searchQuery.value)}`;
        }
    };

    const handleClearCart = () => {
        if (confirm('¿Vaciar el carrito? Esta acción no se puede deshacer.')) {
            clearCart();
        }
    };

    const openCart = () => { 
        console.log('Abriendo carrito...');
        cartStore.isOpen = true; 
    };
    const closeCart = () => { cartStore.isOpen = false; };

    const goToCheckout = () => {
        if (!loggedIn.value) {
            window.location.href = '/login?redirect=/checkout';
        } else {
            window.location.href = '/checkout';
        }
    };

    const simpleNavLinks = [
        { name: "Inicio", path: "#inicio" },
        { name: "Beneficios", path: "#beneficios" },
        { name: "Lanzamientos", path: "#nuevos-lanzamientos" },
    ];
    const trailingNavLinks = [
        { name: "Galería", path: "#galeria" },
        { name: "Contacto", path: "#contacto" },
    ];
    const allNavLinks = [...simpleNavLinks, ...trailingNavLinks];

    const currentYear = ref(new Date().getFullYear());
    const companyName = ref('ByteMarket');

    const toggleMobileMenu = () => { mobileMenuOpen.value = !mobileMenuOpen.value; };
    
    const scrollToSection = (hash) => {
        if (window.location.pathname !== "/") {
            window.location.href = `${window.location.origin}/${hash}`; return;
        }
        const el = document.querySelector(hash);
        if (!el) return;
        activeSection.value = hash;
        history.replaceState(null, "", hash);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleMobileNavClick = (hash) => {
        mobileMenuOpen.value = false;
        scrollToSection(hash);
    };

    let closeTimer = null;
    const openMega = async () => {
        megaOpen.value = true;
        if (categories.value.length === 0) {
            try {
                const res = await fetch('/api/categories');
                if (res.ok) {
                    const data = await res.json();
                    categories.value = data.data || [];
                    if (activeCatId.value !== null) {
                        const cat = categories.value.find(c => c.id === activeCatId.value);
                        subcategories.value = cat ? (cat.subcategories || []) : [];
                    } else {
                        let allSubs = [];
                        categories.value.forEach(cat => {
                            if (cat.subcategories && cat.subcategories.length > 0) {
                                allSubs = allSubs.concat(cat.subcategories);
                            }
                        });
                        subcategories.value = allSubs;
                    }
                }
            } catch(e) { console.error('Error fetching categories:', e); }
        }
    };
    const closeMega = () => { megaOpen.value = false; };
    const toggleMega = () => { megaOpen.value ? closeMega() : openMega(); };
    const previewCategory = (id) => { 
        activeCatId.value = id; 
        if (id === null) {
            let allSubs = [];
            categories.value.forEach(cat => {
                if (cat.subcategories && cat.subcategories.length > 0) {
                    allSubs = allSubs.concat(cat.subcategories);
                }
            });
            subcategories.value = allSubs;
        } else {
            const cat = categories.value.find(c => c.id === id);
            subcategories.value = cat ? (cat.subcategories || []) : [];
        }
    };
    const goToCategory = (id) => {
        closeMega();
        const slug = id === null ? "" : categories.value.find(c => c.id === id)?.slug ?? "";
        window.location.assign(id === null ? "/productos" : `/productos?categoria=${slug}`);
    };
    const openMenuOnHover = () => { if (closeTimer) clearTimeout(closeTimer); openMega(); };
    const scheduleClose = () => {
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(closeMega, 180);
    };
    const cancelClose = () => { if (closeTimer) clearTimeout(closeTimer); };

    const resolveActiveSection = () => {
        if (window.location.pathname !== "/") { activeSection.value = ""; return; }
        scrolled.value = window.scrollY > 10;
        const line = window.scrollY + window.innerHeight * 0.35;
        const links = [...simpleNavLinks, ...trailingNavLinks];
        let current = links[0]?.path ?? "#inicio";
        for (const link of links) {
            const el = document.querySelector(link.path);
            if (!el) continue;
            if (line >= el.offsetTop) current = link.path;
        }
        activeSection.value = current;
    };

    onMounted(() => {
        resolveActiveSection();
        checkAuthSession();
        fetchBusinessConfig();
        loadCart();
        window.addEventListener("scroll", resolveActiveSection, { passive: true });
    });

    onUnmounted(() => {
        window.removeEventListener("scroll", resolveActiveSection);
    });

    return {
        searchQuery, searchSuggestions, isSearchLoading, showSearchDropdown, onSearchInput, submitSearch,
        scrolled, activeSection, mobileMenuOpen, mobileProductsOpen, megaOpen,
        categories, subcategories, activeCatId, cartStore, loggedIn, user,
        businessConfig,
        simpleNavLinks, trailingNavLinks, allNavLinks, currentYear, companyName,
        cartTotalLabel, cartItemCount, cartTotalAmount, addToCart, removeFromCart,
        updateQuantity, clearCart, handleClearCart, openCart, closeCart, goToCheckout, toggleMobileMenu, scrollToSection, handleMobileNavClick,
        openMega, closeMega, toggleMega, previewCategory, goToCategory,
        openMenuOnHover, scheduleClose, cancelClose, formatPrice
    };
}
