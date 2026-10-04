const initCatalog = () => {
  Alpine.data('catalog', () => ({
    sidebarOpen: false,
    searchDraft: '',
    pending: true,
    products: [],
    totalProducts: 0,
    categories: [],
    
    sortOptions: [
      { value: "", label: "Recomendado", icon: "⭐" },
      { value: "precio-asc", label: "Precio: menor a mayor", icon: "↑" },
      { value: "precio-desc", label: "Precio: mayor a menor", icon: "↓" },
      { value: "nombre-asc", label: "Nombre: A → Z", icon: "A" },
      { value: "nombre-desc", label: "Nombre: Z → A", icon: "Z" },
    ],

    openSections: {
      search: false,
      price: false,
      sort: false,
      cats: false,
    },

    filters: {
      categoria: null,
      subcategoria: null,
      nuevoLanzamiento: false,
      q: '',
      precioMin: null,
      precioMax: null,
      sort: '',
      page: 1,
      limit: 24,
    },

    init() {
      // Leer parámetros de la URL
      const params = new URLSearchParams(window.location.search);
      this.filters.categoria = params.get('categoria');
      this.filters.subcategoria = params.get('subcategoria');
      this.filters.nuevoLanzamiento = params.get('nuevoLanzamiento') === '1';
      this.filters.q = params.get('q') || '';
      this.searchDraft = this.filters.q;
      this.filters.precioMin = params.get('precioMin') ? Number(params.get('precioMin')) : null;
      this.filters.precioMax = params.get('precioMax') ? Number(params.get('precioMax')) : null;
      this.filters.sort = params.get('sort') || '';
      this.filters.page = params.get('page') ? Number(params.get('page')) : 1;
      
      this.syncOpenSectionsFromFilters();
      this.fetchCategories();
      this.fetchProducts();
      
      // Escuchar eventos popstate (navegación atrás/adelante)
      window.addEventListener('popstate', () => {
        const p = new URLSearchParams(window.location.search);
        this.filters.categoria = p.get('categoria');
        this.filters.subcategoria = p.get('subcategoria');
        this.filters.nuevoLanzamiento = p.get('nuevoLanzamiento') === '1';
        this.filters.q = p.get('q') || '';
        this.searchDraft = this.filters.q;
        this.filters.precioMin = p.get('precioMin') ? Number(p.get('precioMin')) : null;
        this.filters.precioMax = p.get('precioMax') ? Number(p.get('precioMax')) : null;
        this.filters.sort = p.get('sort') || '';
        this.filters.page = p.get('page') ? Number(p.get('page')) : 1;
        this.syncOpenSectionsFromFilters();
        this.fetchProducts();
      });
    },

    get activeFilterCount() {
      let count = 0;
      if (this.filters.categoria) count++;
      if (this.filters.subcategoria) count++;
      if (this.filters.nuevoLanzamiento) count++;
      if (this.filters.q) count++;
      if (this.filters.precioMin !== null) count++;
      if (this.filters.precioMax !== null) count++;
      if (this.filters.sort) count++;
      return count;
    },

    syncOpenSectionsFromFilters() {
      this.openSections.search = Boolean(this.filters.q);
      this.openSections.price = this.filters.precioMin !== null || this.filters.precioMax !== null;
      this.openSections.sort = Boolean(this.filters.sort);
      this.openSections.cats = Boolean(this.filters.categoria) || Boolean(this.filters.subcategoria) || this.filters.nuevoLanzamiento;
    },

    toggleSection(key) {
      this.openSections[key] = !this.openSections[key];
    },

    async fetchCategories() {
      try {
        const res = await fetch('/api/categories?active=true');
        const json = await res.json();
        this.categories = json.data || [];
      } catch (err) {
        console.error('Error fetching categories', err);
      }
    },

    async fetchProducts(append = false) {
      this.pending = true;
      try {
        // Construir query string
        const q = new URLSearchParams();
        // Convertir categoria slug a ID (el backend API actualmente espera categoryId, pero actualizaremos el backend para soportar categoria por slug o el mapeo aquí)
        // Por ahora lo pasamos tal cual, asumimos que el ApiProductController se adaptará
        if (this.filters.categoria) q.set('categoria', this.filters.categoria);
        if (this.filters.subcategoria) q.set('subcategoria', this.filters.subcategoria);
        if (this.filters.nuevoLanzamiento) q.set('nuevoLanzamiento', '1');
        if (this.filters.q) q.set('q', this.filters.q);
        if (this.filters.precioMin !== null) q.set('precioMin', this.filters.precioMin);
        if (this.filters.precioMax !== null) q.set('precioMax', this.filters.precioMax);
        if (this.filters.sort) q.set('sort', this.filters.sort);
        q.set('page', this.filters.page);
        q.set('limit', this.filters.limit);

        const res = await fetch(`/api/products?${q.toString()}`);
        const json = await res.json();
        
        if (append) {
          this.products = [...this.products, ...(json.data || [])];
        } else {
          this.products = json.data || [];
        }
        this.totalProducts = json.total || 0;
      } catch (err) {
        console.error('Error fetching products', err);
      } finally {
        this.pending = false;
      }
    },

    onFilterChange() {
      this.filters.page = 1;
      this.updateUrl();
      this.fetchProducts();
    },

    loadMore() {
      this.filters.page++;
      this.updateUrl();
      this.fetchProducts(true);
    },

    updateUrl() {
      const q = new URLSearchParams();
      if (this.filters.categoria) q.set('categoria', this.filters.categoria);
      if (this.filters.subcategoria) q.set('subcategoria', this.filters.subcategoria);
      if (this.filters.nuevoLanzamiento) q.set('nuevoLanzamiento', '1');
      if (this.filters.q) q.set('q', this.filters.q);
      if (this.filters.precioMin !== null) q.set('precioMin', this.filters.precioMin);
      if (this.filters.precioMax !== null) q.set('precioMax', this.filters.precioMax);
      if (this.filters.sort) q.set('sort', this.filters.sort);
      // Omitir page 1 en URL por limpieza si se quiere, pero lo incluimos
      if (this.filters.page > 1) q.set('page', this.filters.page);
      
      const newUrl = `${window.location.pathname}?${q.toString()}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    },

    applySearch() {
      this.filters.q = this.searchDraft.trim();
      this.openSections.search = true;
      this.onFilterChange();
    },

    clearSearch() {
      this.searchDraft = "";
      this.filters.q = "";
      this.openSections.search = false;
      this.onFilterChange();
    },

    selectCategory(slug) {
      this.filters.categoria = slug;
      this.filters.subcategoria = null;
      this.filters.nuevoLanzamiento = false;
      this.openSections.cats = true;
      this.onFilterChange();
    },

    toggleNuevoLanzamiento() {
      this.filters.nuevoLanzamiento = !this.filters.nuevoLanzamiento;
      if (this.filters.nuevoLanzamiento) {
        this.filters.categoria = null;
        this.filters.subcategoria = null;
      }
      this.openSections.cats = true;
      this.onFilterChange();
    },

    selectSubcategory(slug) {
      this.filters.subcategoria = slug;
      this.filters.nuevoLanzamiento = false;
      this.openSections.cats = true;
      this.onFilterChange();
    },

    resetFilters() {
      this.filters.categoria = null;
      this.filters.subcategoria = null;
      this.filters.q = "";
      this.filters.precioMin = null;
      this.filters.precioMax = null;
      this.filters.sort = "";
      this.filters.nuevoLanzamiento = false;
      this.searchDraft = "";
      this.onFilterChange();
    },

    manejarAgregarAlCarrito(producto) {
      // Despachar evento para el cart store (Alpine global store)
      window.dispatchEvent(new CustomEvent('add-to-cart', {
        detail: {
          id: producto.id,
          name: producto.name,
          price: producto.price,
          quantity: 1,
          image: producto.images && producto.images.length > 0
            ? (producto.images.find(i => i.isPrimary)?.url || producto.images[0].url)
            : null
        }
      }));
    }
  }));
};

if (window.Alpine) {
  initCatalog();
} else {
  document.addEventListener('alpine:init', initCatalog);
}
