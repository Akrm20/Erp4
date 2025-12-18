// ==================== الكلاس الرئيسي للتطبيق ====================
// التطبيق الرئيسي - نظام نقطة بيع البقالة
class GroceryPOSApp {
    constructor() {
        this.db = null;
        this.cart = [];
        this.currentTab = 'pos';
        this.currentCategory = 'all';
        
        console.log('✅ تم إنشاء مثيل GroceryPOSApp');
    }

    async init() {
        try {
            console.log('🚀 بدء تهيئة التطبيق...');
            
            // 1. تهيئة قاعدة البيانات
            await this.initializeDatabase();
            
            // 2. تحميل البيانات الأولية
            await this.loadInitialData();
            
            // 3. إعداد واجهة المستخدم
            this.setupUI();
            
            // 4. تحديث الإحصائيات
            await this.updateDashboardStats();
            
            // 5. إعداد كشف الاتصال
            this.setupOfflineDetection();
            
            console.log('🎉 تم تهيئة التطبيق بنجاح');
        } catch (error) {
            console.error('❌ خطأ في تهيئة التطبيق:', error);
            this.showToast('خطأ في تهيئة النظام', 'error');
        }
    }

    async initializeDatabase() {
        try {
            console.log('📊 تهيئة قاعدة البيانات...');
            
            if (window.db) {
                this.db = window.db;
                console.log('✅ تم استخدام قاعدة البيانات الحالية');
            } else {
                console.log('⚠️ إنشاء قاعدة بيانات جديدة...');
                this.db = new GroceryPOSDB();
                await this.db.init();
                window.db = this.db;
            }
            
            // التحقق من اتصال قاعدة البيانات
            const testData = await this.db.getAll('settings');
            console.log(`✅ قاعدة البيانات جاهزة (${testData.length} إعداد)`);
            
        } catch (error) {
            console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
            throw new Error('فشل تهيئة قاعدة البيانات');
        }
    }

    async loadInitialData() {
        try {
            console.log('📦 تحميل البيانات الأولية...');
            
            // التحقق من وجود بيانات أساسية
            const categories = await this.db.getAll('categories');
            console.log(`📁 عدد الفئات: ${categories.length}`);
            
            if (categories.length === 0) {
                console.log('➕ إنشاء الفئات الافتراضية...');
                await this.createDefaultCategories();
            }

            const products = await this.db.getAll('products');
            console.log(`📦 عدد المنتجات: ${products.length}`);
            
            if (products.length === 0) {
                console.log('➕ إنشاء المنتجات العينة...');
                await this.createSampleProducts();
            }

            // تحميل إعدادات النظام
            await this.loadSystemSettings();
            
            console.log('✅ تم تحميل البيانات الأولية بنجاح');
            
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات الأولية:', error);
            throw error;
        }
    }

    async createDefaultCategories() {
        try {
            const defaultCategories = [
                { name: 'مشروبات', icon: 'fas fa-wine-bottle', color: '#3498db' },
                { name: 'معلبات', icon: 'fas fa-can-food', color: '#e74c3c' },
                { name: 'مكسرات', icon: 'fas fa-seedling', color: '#f39c12' },
                { name: 'حلويات', icon: 'fas fa-candy', color: '#9b59b6' },
                { name: 'مثلجات', icon: 'fas fa-ice-cream', color: '#1abc9c' },
                { name: 'خضروات', icon: 'fas fa-carrot', color: '#27ae60' },
                { name: 'فواكه', icon: 'fas fa-apple-alt', color: '#2ecc71' },
                { name: 'لحوم', icon: 'fas fa-drumstick-bite', color: '#c0392b' },
                { name: 'ألبان', icon: 'fas fa-cheese', color: '#f1c40f' },
                { name: 'منظفات', icon: 'fas fa-pump-soap', color: '#7f8c8d' }
            ];

            for (const category of defaultCategories) {
                await this.db.add('categories', {
                    name: category.name,
                    icon: category.icon,
                    color: category.color,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            
            console.log(`✅ تم إنشاء ${defaultCategories.length} فئة`);
        } catch (error) {
            console.error('❌ خطأ في إنشاء الفئات:', error);
            throw error;
        }
    }

    async createSampleProducts() {
        try {
            const categories = await this.db.getAll('categories');
            const beveragesCategory = categories.find(c => c.name === 'مشروبات');
            const sweetsCategory = categories.find(c => c.name === 'حلويات');
            
            const sampleProducts = [
                {
                    name: 'كوكاكولا 330 مل',
                    barcode: '5449000000996',
                    salePrice: 500,
                    costPrice: 350,
                    stock: 100,
                    minStock: 10,
                    unit: 'حبة',
                    categoryId: beveragesCategory?.id || null,
                    image: null,
                    taxRate: 0
                },
                {
                    name: 'بيبسي 330 مل',
                    barcode: '5449000131880',
                    salePrice: 500,
                    costPrice: 350,
                    stock: 80,
                    minStock: 10,
                    unit: 'حبة',
                    categoryId: beveragesCategory?.id || null,
                    image: null,
                    taxRate: 0
                },
                {
                    name: 'شوكولاتة كادبوري',
                    barcode: '7622210645142',
                    salePrice: 800,
                    costPrice: 600,
                    stock: 50,
                    minStock: 5,
                    unit: 'حبة',
                    categoryId: sweetsCategory?.id || null,
                    image: null,
                    taxRate: 0
                }
            ];

            let addedCount = 0;
            for (const product of sampleProducts) {
                try {
                    await this.db.add('products', product);
                    addedCount++;
                    console.log(`➕ تم إضافة: ${product.name}`);
                } catch (error) {
                    console.warn(`⚠️ لم يتم إضافة ${product.name}:`, error.message);
                }
            }
            
            console.log(`✅ تم إضافة ${addedCount} منتج من أصل ${sampleProducts.length}`);
        } catch (error) {
            console.error('❌ خطأ في إنشاء المنتجات:', error);
            throw error;
        }
    }


    setupUI() {
        // إعداد التبويبات
        this.setupTabs();
        
        // إعداد البحث
        this.setupSearch();
        
        // إعداد السلة
        this.setupCart();
        
        // إعداد الأزرار
        this.setupButtons();
        
        // تحميل الفئات والمنتجات
        this.loadCategories();
        this.loadProducts();
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // تحديث التبويب النشط
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
        
        // تحديث المحتوى
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        this.currentTab = tabId;
        
        // تحميل بيانات التبويب
        switch(tabId) {
            case 'products':
                this.loadProductsTable();
                break;
            case 'categories':
                this.loadCategoriesAdmin();
                break;
            case 'customers':
                this.loadCustomersTable();
                break;
            case 'suppliers':
                this.loadSuppliersTable();
                break;
            case 'purchases':
                this.loadPurchasesTable();
                break;
            case 'accounting':
                this.updateDashboardStats();
                break;
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('product-search');
        searchInput.addEventListener('input', (e) => {
            this.searchProducts(e.target.value);
        });

        const categoryFilter = document.getElementById('category-filter');
        categoryFilter.addEventListener('change', (e) => {
            this.currentCategory = e.target.value;
            this.loadProducts();
        });
    }

    setupCart() {
        const cartBtn = document.getElementById('cart-btn');
        const cartPanel = document.getElementById('cart-panel');
        const closeCartBtn = document.querySelector('.close-cart');
        const clearCartBtn = document.getElementById('clear-cart');
        const checkoutBtn = document.getElementById('checkout-btn');

        cartBtn.addEventListener('click', () => {
            cartPanel.classList.add('open');
        });

        closeCartBtn.addEventListener('click', () => {
            cartPanel.classList.remove('open');
        });

        clearCartBtn.addEventListener('click', () => {
            this.clearCart();
        });

        checkoutBtn.addEventListener('click', () => {
            this.checkout();
        });

        // إغلاق السلة بالنقر خارجها
        document.addEventListener('click', (e) => {
            if (!cartPanel.contains(e.target) && !cartBtn.contains(e.target)) {
                cartPanel.classList.remove('open');
            }
        });
    }

    setupButtons() {
        // زر الإعدادات
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.openSettings();
        });

        // زر المزامنة
        document.getElementById('sync-btn').addEventListener('click', () => {
            this.syncData();
        });

        // زر إضافة منتج
        document.getElementById('add-product-btn').addEventListener('click', () => {
            this.openProductModal();
        });

        // زر إضافة فئة
        document.getElementById('add-category-btn').addEventListener('click', () => {
            this.openCategoryModal();
        });
    }

    async loadCategories() {
        try {
            const categories = await this.db.getAll('categories');
            const categoriesGrid = document.getElementById('categories-grid');
            const categoryFilter = document.getElementById('category-filter');
            
            // تنظيف القوائم
            categoriesGrid.innerHTML = '';
            categoryFilter.innerHTML = '<option value="all">جميع الفئات</option>';
            
            // إضافة فئة "الكل"
            const allCategory = document.createElement('div');
            allCategory.className = 'category-card';
            allCategory.innerHTML = `
                <div class="category-icon">
                    <i class="fas fa-layer-group"></i>
                </div>
                <h3>الكل</h3>
                <div class="category-count">${await this.getTotalProductsCount()} منتج</div>
            `;
            allCategory.addEventListener('click', () => {
                this.currentCategory = 'all';
                this.loadProducts();
                // إضافة فئة نشطة
                document.querySelectorAll('.category-card').forEach(card => {
                    card.classList.remove('active');
                });
                allCategory.classList.add('active');
            });
            categoriesGrid.appendChild(allCategory);
            
            // إضافة الفئات
            for (const category of categories) {
                // بطاقة الفئة
                const categoryCard = document.createElement('div');
                categoryCard.className = 'category-card';
                categoryCard.style.borderTop = `3px solid ${category.color || '#4CAF50'}`;
                categoryCard.innerHTML = `
                    <div class="category-icon">
                        <i class="${category.icon || 'fas fa-tag'}"></i>
                    </div>
                    <h3>${category.name}</h3>
                    <div class="category-count">${await this.getCategoryProductsCount(category.id)} منتج</div>
                `;
                
                categoryCard.addEventListener('click', () => {
                    this.currentCategory = category.id;
                    this.loadProducts();
                    // إضافة فئة نشطة
                    document.querySelectorAll('.category-card').forEach(card => {
                        card.classList.remove('active');
                    });
                    categoryCard.classList.add('active');
                });
                
                categoriesGrid.appendChild(categoryCard);
                
                // خيار الفلتر
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            }
            
        } catch (error) {
            console.error('خطأ في تحميل الفئات:', error);
        }
    }

    async loadProducts(searchTerm = '') {
        try {
            let products;
            if (searchTerm) {
                products = await this.db.searchProducts(searchTerm);
            } else if (this.currentCategory === 'all') {
                products = await this.db.getAll('products');
            } else {
                products = await this.db.getProductsByCategory(this.currentCategory);
            }
            
            const productsGrid = document.getElementById('products-grid');
            productsGrid.innerHTML = '';
            
            for (const product of products) {
                const category = await this.db.get('categories', product.categoryId);
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-image">
                        ${product.image ? 
                            `<img src="${product.image}" alt="${product.name}">` : 
                            `<div class="placeholder"><i class="fas fa-box"></i></div>`
                        }
                    </div>
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">${this.formatCurrency(product.salePrice)}</div>
                        <div class="product-stock ${(product.stock || 0) <= (product.minStock || 5) ? 'low' : ''}">
                            ${product.stock || 0} ${product.unit || 'حبة'} متوفر
                        </div>
                        ${product.stock > 0 ? `
                            <div class="product-actions">
                                <button class="btn btn-primary btn-sm add-to-cart" data-product-id="${product.id}">
                                    <i class="fas fa-cart-plus"></i> إضافة
                                </button>
                            </div>
                        ` : '<div class="product-out-of-stock">غير متوفر</div>'}
                    </div>
                `;
                
                // إضافة حدث لإضافة المنتج للسلة
                const addToCartBtn = productCard.querySelector('.add-to-cart');
                if (addToCartBtn) {
                    addToCartBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.addToCart(product);
                    });
                }
                
                // إضافة حدث لعرض تفاصيل المنتج
                productCard.addEventListener('click', () => {
                    this.viewProductDetails(product.id);
                });
                
                productsGrid.appendChild(productCard);
            }
            
        } catch (error) {
            console.error('خطأ في تحميل المنتجات:', error);
        }
    }

    async searchProducts(searchTerm) {
        await this.loadProducts(searchTerm);
    }

    async getCategoryProductsCount(categoryId) {
        try {
            const products = await this.db.getProductsByCategory(categoryId);
            return products.length;
        } catch (error) {
            return 0;
        }
    }

    async getTotalProductsCount() {
        try {
            const products = await this.db.getAll('products');
            return products.length;
        } catch (error) {
            return 0;
        }
    }

    // ============= إدارة السلة =============
    addToCart(product, quantity = 1) {
        const existingItem = this.cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
            if (existingItem.quantity + quantity > product.stock) {
                this.showToast('الكمية المطلوبة غير متوفرة في المخزون', 'warning');
                return;
            }
            existingItem.quantity += quantity;
        } else {
            if (quantity > product.stock) {
                this.showToast('الكمية المطلوبة غير متوفرة في المخزون', 'warning');
                return;
            }
            this.cart.push({
                product,
                quantity,
                price: product.salePrice,
                total: product.salePrice * quantity
            });
        }
        
        this.updateCart();
        this.showToast(`تم إضافة ${product.name} إلى السلة`, 'success');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.product.id !== productId);
        this.updateCart();
    }

    updateCartItemQuantity(productId, quantity) {
        const item = this.cart.find(item => item.product.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else if (quantity > item.product.stock) {
                this.showToast('الكمية المطلوبة غير متوفرة في المخزون', 'warning');
                return;
            } else {
                item.quantity = quantity;
                item.total = item.price * quantity;
            }
            this.updateCart();
        }
    }

    updateCart() {
        // تحديث واجهة السلة
        const cartItemsContainer = document.getElementById('cart-items');
        const cartCount = document.querySelector('.cart-count');
        const subtotalEl = document.getElementById('subtotal');
        const taxAmountEl = document.getElementById('tax-amount');
        const totalAmountEl = document.getElementById('total-amount');
        
        // تحديث عدد المنتجات
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        // تحديث قائمة المنتجات
        cartItemsContainer.innerHTML = '';
        
        let subtotal = 0;
        
        this.cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <i class="fas fa-box"></i>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.product.name}</div>
                    <div class="cart-item-price">${this.formatCurrency(item.price)} × ${item.quantity}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn decrease" data-product-id="${item.product.id}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn increase" data-product-id="${item.product.id}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn btn-danger btn-sm remove-item" data-product-id="${item.product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            cartItemsContainer.appendChild(cartItem);
            
            subtotal += item.total;
        });
        
        // إضافة أحداث لأزرار الكمية
        cartItemsContainer.querySelectorAll('.decrease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.closest('button').dataset.productId);
                const item = this.cart.find(item => item.product.id === productId);
                if (item) {
                    this.updateCartItemQuantity(productId, item.quantity - 1);
                }
            });
        });
        
        cartItemsContainer.querySelectorAll('.increase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.closest('button').dataset.productId);
                const item = this.cart.find(item => item.product.id === productId);
                if (item) {
                    this.updateCartItemQuantity(productId, item.quantity + 1);
                }
            });
        });
        
        cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.closest('button').dataset.productId);
                this.removeFromCart(productId);
            });
        });
        
        // حساب الضريبة
        const taxRate = COMPANY_INFO?.FINANCIAL?.defaultTaxRate || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        
        // تحديث الإجماليات
        subtotalEl.textContent = this.formatCurrency(subtotal);
        taxAmountEl.textContent = this.formatCurrency(taxAmount);
        totalAmountEl.textContent = this.formatCurrency(total);
    }

    clearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('هل أنت متأكد من إفراغ السلة؟')) {
            this.cart = [];
            this.updateCart();
            this.showToast('تم إفراغ السلة', 'success');
        }
    }

    async checkout() {
        if (this.cart.length === 0) {
            this.showToast('السلة فارغة', 'warning');
            return;
        }
        
        // فتح نموذج إنهاء البيع
        this.openCheckoutModal();
    }

    async processCheckout(paymentData) {
        try {
            // توليد رقم فاتورة
            const invoiceNumber = `INV-${Date.now()}`;
            
            // حساب الإجماليات
            const subtotal = this.cart.reduce((sum, item) => sum + item.total, 0);
            const taxRate = COMPANY_INFO?.FINANCIAL?.defaultTaxRate || 0;
            const taxAmount = subtotal * (taxRate / 100);
            const total = subtotal + taxAmount;
            
            // إنشاء فاتورة البيع
            const saleData = {
                invoiceNumber,
                date: new Date().toISOString(),
                subtotal,
                taxAmount,
                total,
                paymentMethod: paymentData.method,
                customerId: paymentData.customerId || null,
                notes: paymentData.notes || '',
                createdAt: new Date().toISOString()
            };
            
            // إنشاء تفاصيل البيع
            const saleItems = this.cart.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                unitPrice: item.price,
                total: item.total
            }));
            
            // حفظ الفاتورة
            await this.db.createSale(saleData, saleItems);
            
            // إفراغ السلة
            this.cart = [];
            this.updateCart();
            
            // إغلاق لوحة السلة
            document.getElementById('cart-panel').classList.remove('open');
            
            // طباعة الفاتورة
            this.printInvoice(invoiceNumber, saleData, saleItems);
            
            // تحديث الإحصائيات
            await this.updateDashboardStats();
            
            this.showToast('تم إنهاء البيع بنجاح', 'success');
            
        } catch (error) {
            console.error('خطأ في إنهاء البيع:', error);
            this.showToast('حدث خطأ في إنهاء البيع', 'error');
        }
    }

    // ============= إدارة المنتجات =============
    async loadProductsTable() {
        try {
            const products = await this.db.getAll('products');
            const tableBody = document.querySelector('#products-table tbody');
            tableBody.innerHTML = '';
            
            for (const product of products) {
                const category = await this.db.get('categories', product.categoryId);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div class="product-table-image">
                            <i class="fas fa-box"></i>
                        </div>
                    </td>
                    <td>${product.name}</td>
                    <td>${this.formatCurrency(product.salePrice)}</td>
                    <td>
                        <span class="stock-badge ${(product.stock || 0) <= (product.minStock || 5) ? 'low' : ''}">
                            ${product.stock || 0}
                        </span>
                    </td>
                    <td>${category?.name || 'غير مصنف'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-product" data-id="${product.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-product" data-id="${product.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            }
            
            // إضافة الأحداث
            tableBody.querySelectorAll('.edit-product').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const productId = parseInt(e.target.closest('button').dataset.id);
                    this.openProductModal(productId);
                });
            });
            
            tableBody.querySelectorAll('.delete-product').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const productId = parseInt(e.target.closest('button').dataset.id);
                    this.deleteProduct(productId);
                });
            });
            
        } catch (error) {
            console.error('خطأ في تحميل جدول المنتجات:', error);
        }
    }

    openProductModal(productId = null) {
        // إنشاء وتعبئة النموذج
        const modal = this.createModal(
            productId ? 'تعديل منتج' : 'إضافة منتج جديد',
            this.createProductForm(productId)
        );
        
        // عرض النموذج
        document.body.appendChild(modal);
        modal.classList.add('active');
        
        // إذا كان تعديل منتج موجود، تعبئة البيانات
        if (productId) {
            this.populateProductForm(productId);
        }
        
        // إغلاق النموذج عند النقر خارج المحتوى
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    createProductForm(productId = null) {
        return `
            <form id="product-form">
                <div class="form-group">
                    <label for="product-name">اسم المنتج *</label>
                    <input type="text" id="product-name" class="form-control" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="product-barcode">الباركود</label>
                        <input type="text" id="product-barcode" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="product-code">كود المنتج</label>
                        <input type="text" id="product-code" class="form-control">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="product-sale-price">سعر البيع *</label>
                        <input type="number" id="product-sale-price" class="form-control" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="product-cost-price">سعر التكلفة</label>
                        <input type="number" id="product-cost-price" class="form-control" step="0.01">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="product-stock">المخزون الحالي</label>
                        <input type="number" id="product-stock" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="product-min-stock">الحد الأدنى</label>
                        <input type="number" id="product-min-stock" class="form-control" value="5">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="product-category">التصنيف</label>
                        <select id="product-category" class="form-control">
                            <option value="">اختر التصنيف</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="product-unit">الوحدة</label>
                        <input type="text" id="product-unit" class="form-control" value="حبة">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="product-description">الوصف</label>
                    <textarea id="product-description" class="form-control" rows="3"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary cancel-btn">إلغاء</button>
                    <button type="submit" class="btn btn-primary">${productId ? 'تحديث' : 'حفظ'}</button>
                </div>
            </form>
        `;
    }

    async populateProductForm(productId) {
        try {
            const product = await this.db.get('products', productId);
            if (!product) return;
            
            document.getElementById('product-name').value = product.name || '';
            document.getElementById('product-barcode').value = product.barcode || '';
            document.getElementById('product-code').value = product.code || '';
            document.getElementById('product-sale-price').value = product.salePrice || '';
            document.getElementById('product-cost-price').value = product.costPrice || '';
            document.getElementById('product-stock').value = product.stock || '';
            document.getElementById('product-min-stock').value = product.minStock || 5;
            document.getElementById('product-unit').value = product.unit || 'حبة';
            document.getElementById('product-description').value = product.description || '';
            
            // تعبئة الفئات
            await this.populateCategorySelect('product-category', product.categoryId);
            
        } catch (error) {
            console.error('خطأ في تعبئة نموذج المنتج:', error);
        }
    }

    async populateCategorySelect(selectId, selectedId = null) {
        try {
            const categories = await this.db.getAll('categories');
            const select = document.getElementById(selectId);
            select.innerHTML = '<option value="">اختر التصنيف</option>';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                if (category.id === selectedId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            
        } catch (error) {
            console.error('خطأ في تعبئة قائمة الفئات:', error);
        }
    }

    async saveProduct(formData) {
        try {
            const productData = {
                name: formData.get('name'),
                barcode: formData.get('barcode'),
                code: formData.get('code'),
                salePrice: parseFloat(formData.get('salePrice')),
                costPrice: parseFloat(formData.get('costPrice')) || null,
                stock: parseInt(formData.get('stock')) || 0,
                minStock: parseInt(formData.get('minStock')) || 5,
                unit: formData.get('unit') || 'حبة',
                categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId')) : null,
                description: formData.get('description') || '',
                updatedAt: new Date().toISOString()
            };
            
            const productId = formData.get('id');
            if (productId) {
                // تحديث منتج موجود
                const existingProduct = await this.db.get('products', parseInt(productId));
                productData.id = parseInt(productId);
                productData.createdAt = existingProduct.createdAt;
                await this.db.update('products', productData);
                this.showToast('تم تحديث المنتج بنجاح', 'success');
            } else {
                // إضافة منتج جديد
                productData.createdAt = new Date().toISOString();
                await this.db.add('products', productData);
                this.showToast('تم إضافة المنتج بنجاح', 'success');
            }
            
            // تحديث الواجهة
            this.loadProducts();
            this.loadProductsTable();
            
            return true;
            
        } catch (error) {
            console.error('خطأ في حفظ المنتج:', error);
            this.showToast('حدث خطأ في حفظ المنتج', 'error');
            return false;
        }
    }

    async deleteProduct(productId) {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
        
        try {
            await this.db.delete('products', productId);
            this.showToast('تم حذف المنتج بنجاح', 'success');
            
            // تحديث الواجهة
            this.loadProducts();
            this.loadProductsTable();
            
        } catch (error) {
            console.error('خطأ في حذف المنتج:', error);
            this.showToast('حدث خطأ في حذف المنتج', 'error');
        }
    }

    // ============= إدارة الفئات =============
    async loadCategoriesAdmin() {
        try {
            const categories = await this.db.getAll('categories');
            const grid = document.querySelector('.categories-grid-admin');
            grid.innerHTML = '';
            
            for (const category of categories) {
                const productCount = await this.getCategoryProductsCount(category.id);
                const categoryCard = document.createElement('div');
                categoryCard.className = 'category-card-admin';
                categoryCard.innerHTML = `
                    <div class="category-icon" style="background: ${category.color || '#4CAF50'}">
                        <i class="${category.icon || 'fas fa-tag'}"></i>
                    </div>
                    <h3>${category.name}</h3>
                    <div class="category-count">${productCount} منتج</div>
                    <div class="category-actions">
                        <button class="btn btn-sm btn-primary edit-category" data-id="${category.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-category" data-id="${category.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                grid.appendChild(categoryCard);
            }
            
            // إضافة الأحداث
            grid.querySelectorAll('.edit-category').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const categoryId = parseInt(e.target.closest('button').dataset.id);
                    this.openCategoryModal(categoryId);
                });
            });
            
            grid.querySelectorAll('.delete-category').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const categoryId = parseInt(e.target.closest('button').dataset.id);
                    this.deleteCategory(categoryId);
                });
            });
            
        } catch (error) {
            console.error('خطأ في تحميل الفئات للإدارة:', error);
        }
    }

    openCategoryModal(categoryId = null) {
        const modal = this.createModal(
            categoryId ? 'تعديل فئة' : 'إضافة فئة جديدة',
            this.createCategoryForm()
        );
        
        document.body.appendChild(modal);
        modal.classList.add('active');
        
        if (categoryId) {
            this.populateCategoryForm(categoryId);
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    createCategoryForm() {
        return `
            <form id="category-form">
                <div class="form-group">
                    <label for="category-name">اسم الفئة *</label>
                    <input type="text" id="category-name" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label for="category-icon">الأيقونة</label>
                    <select id="category-icon" class="form-control">
                        <option value="fas fa-tag">علامة</option>
                        <option value="fas fa-wine-bottle">زجاجة</option>
                        <option value="fas fa-can-food">معلبة</option>
                        <option value="fas fa-seedling">بذرة</option>
                        <option value="fas fa-candy">حلوى</option>
                        <option value="fas fa-ice-cream">آيس كريم</option>
                        <option value="fas fa-carrot">جزر</option>
                        <option value="fas fa-apple-alt">تفاحة</option>
                        <option value="fas fa-drumstick-bite">دجاج</option>
                        <option value="fas fa-cheese">جبن</option>
                        <option value="fas fa-pump-soap">صابون</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="category-color">اللون</label>
                    <input type="color" id="category-color" class="form-control" value="#4CAF50">
                </div>
                
                <div class="form-group">
                    <label for="category-description">الوصف</label>
                    <textarea id="category-description" class="form-control" rows="3"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary cancel-btn">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ</button>
                </div>
            </form>
        `;
    }

    async populateCategoryForm(categoryId) {
        try {
            const category = await this.db.get('categories', categoryId);
            if (!category) return;
            
            document.getElementById('category-name').value = category.name || '';
            document.getElementById('category-icon').value = category.icon || 'fas fa-tag';
            document.getElementById('category-color').value = category.color || '#4CAF50';
            document.getElementById('category-description').value = category.description || '';
            
        } catch (error) {
            console.error('خطأ في تعبئة نموذج الفئة:', error);
        }
    }

    async saveCategory(formData) {
        try {
            const categoryData = {
                name: formData.get('name'),
                icon: formData.get('icon'),
                color: formData.get('color'),
                description: formData.get('description') || '',
                updatedAt: new Date().toISOString()
            };
            
            const categoryId = formData.get('id');
            if (categoryId) {
                const existingCategory = await this.db.get('categories', parseInt(categoryId));
                categoryData.id = parseInt(categoryId);
                categoryData.createdAt = existingCategory.createdAt;
                await this.db.update('categories', categoryData);
                this.showToast('تم تحديث الفئة بنجاح', 'success');
            } else {
                categoryData.createdAt = new Date().toISOString();
                await this.db.add('categories', categoryData);
                this.showToast('تم إضافة الفئة بنجاح', 'success');
            }
            
            // تحديث الواجهة
            this.loadCategories();
            this.loadCategoriesAdmin();
            
            return true;
            
        } catch (error) {
            console.error('خطأ في حفظ الفئة:', error);
            this.showToast('حدث خطأ في حفظ الفئة', 'error');
            return false;
        }
    }

    async deleteCategory(categoryId) {
        // التحقق من وجود منتجات في الفئة
        const products = await this.db.getProductsByCategory(categoryId);
        if (products.length > 0) {
            this.showToast('لا يمكن حذف الفئة لأنها تحتوي على منتجات', 'error');
            return;
        }
        
        if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) return;
        
        try {
            await this.db.delete('categories', categoryId);
            this.showToast('تم حذف الفئة بنجاح', 'success');
            
            // تحديث الواجهة
            this.loadCategories();
            this.loadCategoriesAdmin();
            
        } catch (error) {
            console.error('خطأ في حذف الفئة:', error);
            this.showToast('حدث خطأ في حذف الفئة', 'error');
        }
    }

    // ============= المحاسبة والإحصائيات =============
    async updateDashboardStats() {
        try {
            const stats = await this.db.getDashboardStats();
            
            document.getElementById('daily-sales').textContent = this.formatCurrency(stats.dailySales);
            document.getElementById('monthly-sales').textContent = this.formatCurrency(stats.monthlySales);
            document.getElementById('inventory-value').textContent = this.formatCurrency(stats.inventoryValue);
            document.getElementById('customers-balance').textContent = this.formatCurrency(stats.customersBalance);
            
        } catch (error) {
            console.error('خطأ في تحديث الإحصائيات:', error);
        }
    }

    // ============= دوال مساعدة =============
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="btn-icon close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        // إضافة حدث الإغلاق
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // إضافة حدث الإلغاء
        const cancelBtn = modal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // إضافة حدث حفظ النموذج
        const form = modal.querySelector('form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                formData.append('id', modal.dataset.id || '');
                
                let success = false;
                if (form.id === 'product-form') {
                    success = await this.saveProduct(formData);
                } else if (form.id === 'category-form') {
                    success = await this.saveCategory(formData);
                }
                
                if (success) {
                    modal.remove();
                }
            });
        }
        
        return modal;
    }

    openCheckoutModal() {
        const modal = this.createModal('إنهاء عملية البيع', this.createCheckoutForm());
        document.body.appendChild(modal);
        modal.classList.add('active');
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    createCheckoutForm() {
        const subtotal = this.cart.reduce((sum, item) => sum + item.total, 0);
        const taxRate = COMPANY_INFO?.FINANCIAL?.defaultTaxRate || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        
        return `
            <div class="checkout-summary">
                <div class="summary-row">
                    <span>المجموع الفرعي:</span>
                    <span>${this.formatCurrency(subtotal)}</span>
                </div>
                <div class="summary-row">
                    <span>الضريبة (${taxRate}%):</span>
                    <span>${this.formatCurrency(taxAmount)}</span>
                </div>
                <div class="summary-row total">
                    <span>الإجمالي:</span>
                    <span>${this.formatCurrency(total)}</span>
                </div>
            </div>
            
            <form id="checkout-form">
                <div class="form-group">
                    <label for="payment-method">طريقة الدفع *</label>
                    <select id="payment-method" class="form-control" required>
                        <option value="cash">نقدي</option>
                        <option value="card">بطاقة</option>
                        <option value="credit">آجل</option>
                        <option value="transfer">تحويل</option>
                    </select>
                </div>
                
                <div id="customer-section" style="display: none;">
                    <div class="form-group">
                        <label for="customer-select">العميل</label>
                        <select id="customer-select" class="form-control">
                            <option value="">اختر عميل</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="checkout-notes">ملاحظات</label>
                    <textarea id="checkout-notes" class="form-control" rows="3"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary cancel-btn">إلغاء</button>
                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-check"></i> تأكيد البيع
                    </button>
                </div>
            </form>
        `;
    }

    formatCurrency(amount, currency = 'YER') {
        const symbol = CURRENCY_CONFIG?.SYMBOLS?.[currency] || 'ر.ي';
        return new Intl.NumberFormat('ar-SA').format(amount) + ` ${symbol}`;
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // إزالة الـ Toast بعد 5 ثواني
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }

    printInvoice(invoiceNumber, saleData, items) {
        const printContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>فاتورة ${invoiceNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .invoice { max-width: 300px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { margin: 0; color: #333; }
                    .info { margin-bottom: 20px; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .table th, .table td { padding: 8px; text-align: right; border-bottom: 1px solid #ddd; }
                    .total { font-weight: bold; font-size: 1.2em; }
                    .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
                    @media print {
                        body { font-size: 12px; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice">
                    <div class="header">
                        <h1>فاتورة بيع</h1>
                        <h2>${invoiceNumber}</h2>
                    </div>
                    
                    <div class="info">
                        <p><strong>التاريخ:</strong> ${new Date(saleData.date).toLocaleDateString('ar-SA')}</p>
                        <p><strong>الوقت:</strong> ${new Date(saleData.date).toLocaleTimeString('ar-SA')}</p>
                        <p><strong>طريقة الدفع:</strong> ${saleData.paymentMethod}</p>
                    </div>
                    
                    <table class="table">
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th>الكمية</th>
                                <th>السعر</th>
                                <th>المجموع</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.productName}</td>
                                    <td>${item.quantity}</td>
                                    <td>${this.formatCurrency(item.unitPrice)}</td>
                                    <td>${this.formatCurrency(item.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3"><strong>المجموع الفرعي:</strong></td>
                                <td>${this.formatCurrency(saleData.subtotal)}</td>
                            </tr>
                            <tr>
                                <td colspan="3"><strong>الضريبة:</strong></td>
                                <td>${this.formatCurrency(saleData.taxAmount)}</td>
                            </tr>
                            <tr class="total">
                                <td colspan="3"><strong>الإجمالي:</strong></td>
                                <td>${this.formatCurrency(saleData.total)}</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div class="footer">
                        <p>شكراً لتعاملكم معنا</p>
                        <p>${COMPANY_INFO?.BASIC?.name || 'بقالتي'}</p>
                        <p>${COMPANY_INFO?.CONTACT?.address?.street || ''}</p>
                        <p>${COMPANY_INFO?.CONTACT?.phone?.primary || ''}</p>
                    </div>
                </div>
                
                <script>
                    window.onload = () => {
                        window.print();
                        setTimeout(() => { window.close(); }, 1000);
                    };
                </script>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showToast('تم استعادة الاتصال بالإنترنت', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('أنت تعمل حالياً بدون اتصال بالإنترنت', 'warning');
        });
    }

    async syncData() {
        // هذه الدالة لربط النظام مع خادم خارجي
        this.showToast('المزامنة غير متوفرة في الوضع المحلي', 'info');
    }

    async openSettings() {
        const modal = this.createModal('إعدادات النظام', this.createSettingsForm());
        document.body.appendChild(modal);
        modal.classList.add('active');
        
        await this.loadSettingsForm();
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    createSettingsForm() {
        return `
            <form id="settings-form">
                <div class="form-group">
                    <label for="company-name">اسم المحل</label>
                    <input type="text" id="company-name" class="form-control">
                </div>
                
                <div class="form-group">
                    <label for="tax-rate">نسبة الضريبة (%)</label>
                    <input type="number" id="tax-rate" class="form-control" step="0.01">
                </div>
                
                <div class="form-group">
                    <label for="currency">العملة</label>
                    <select id="currency" class="form-control">
                        <option value="YER">الريال اليمني (ر.ي)</option>
                        <option value="SAR">الريال السعودي (ر.س)</option>
                        <option value="USD">الدولار الأمريكي ($)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="low-stock-threshold">الحد الأدنى للمخزون</label>
                    <input type="number" id="low-stock-threshold" class="form-control" value="5">
                </div>
                
                <h3>النسخ الاحتياطي</h3>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="export-btn">تصدير البيانات</button>
                    <button type="button" class="btn btn-warning" id="import-btn">استيراد البيانات</button>
                </div>
                
                <h3>الصيانة</h3>
                <div class="form-actions">
                    <button type="button" class="btn btn-danger" id="reset-btn">إعادة تعيين النظام</button>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary cancel-btn">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ الإعدادات</button>
                </div>
            </form>
        `;
    }

    async loadSettingsForm() {
        try {
            const companyName = await this.db.getSetting('companyName', COMPANY_INFO?.BASIC?.name || 'بقالتي');
            const taxRate = await this.db.getSetting('taxRate', COMPANY_INFO?.FINANCIAL?.defaultTaxRate || 0);
            const currency = await this.db.getSetting('currency', CURRENCY_CONFIG?.BASE || 'YER');
            const lowStockThreshold = await this.db.getSetting('lowStockThreshold', 5);
            
            document.getElementById('company-name').value = companyName;
            document.getElementById('tax-rate').value = taxRate;
            document.getElementById('currency').value = currency;
            document.getElementById('low-stock-threshold').value = lowStockThreshold;
            
            // إضافة الأحداث للأزرار
            document.getElementById('export-btn').addEventListener('click', () => {
                this.exportData();
            });
            
            document.getElementById('import-btn').addEventListener('click', () => {
                this.importData();
            });
            
            document.getElementById('reset-btn').addEventListener('click', () => {
                this.resetSystem();
            });
            
        } catch (error) {
            console.error('خطأ في تحميل الإعدادات:', error);
        }
    }

    async saveSettings(formData) {
        try {
            await this.db.setSetting('companyName', formData.get('companyName'));
            await this.db.setSetting('taxRate', parseFloat(formData.get('taxRate')));
            await this.db.setSetting('currency', formData.get('currency'));
            await this.db.setSetting('lowStockThreshold', parseInt(formData.get('lowStockThreshold')));
            
            // تحديث عرض اسم الشركة
            document.getElementById('company-name').textContent = formData.get('companyName');
            
            this.showToast('تم حفظ الإعدادات بنجاح', 'success');
            return true;
            
        } catch (error) {
            console.error('خطأ في حفظ الإعدادات:', error);
            this.showToast('حدث خطأ في حفظ الإعدادات', 'error');
            return false;
        }
    }

    async exportData() {
        try {
            const backupData = await this.db.exportData();
            const dataStr = JSON.stringify(backupData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `grocery-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            this.showToast('تم تصدير البيانات بنجاح', 'success');
            
        } catch (error) {
            console.error('خطأ في تصدير البيانات:', error);
            this.showToast('حدث خطأ في تصدير البيانات', 'error');
        }
    }

    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const backupData = JSON.parse(event.target.result);
                    
                    if (!confirm('هل أنت متأكد من استيراد البيانات؟ سيتم استبدال جميع البيانات الحالية.')) {
                        return;
                    }
                    
                    await this.db.importData(backupData);
                    this.showToast('تم استيراد البيانات بنجاح', 'success');
                    
                    // إعادة تحميل التطبيق
                    location.reload();
                    
                } catch (error) {
                    console.error('خطأ في استيراد البيانات:', error);
                    this.showToast('ملف غير صالح أو تالف', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    async resetSystem() {
        if (!confirm('هل أنت متأكد من إعادة تعيين النظام؟ سيتم حذف جميع البيانات ولا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }
        
        try {
            // إعادة إنشاء قاعدة البيانات
            indexedDB.deleteDatabase(this.db.dbName);
            
            this.showToast('تم إعادة تعيين النظام، سيتم إعادة تحميل الصفحة', 'success');
            
            setTimeout(() => {
                location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('خطأ في إعادة تعيين النظام:', error);
            this.showToast('حدث خطأ في إعادة تعيين النظام', 'error');
        }
    }
    async loadSystemSettings() {
        try {
            console.log('⚙️ تحميل إعدادات النظام...');
            
            let companyName = 'بقالتي';
            if (window.COMPANY_INFO?.BASIC?.name) {
                companyName = window.COMPANY_INFO.BASIC.name;
            } else {
                const savedName = await this.db.getSetting('companyName');
                if (savedName) companyName = savedName;
            }
            
            const companyNameEl = document.getElementById('company-name');
            if (companyNameEl) {
                companyNameEl.textContent = companyName;
                console.log(`🏪 اسم المحل: ${companyName}`);
            }
            
        } catch (error) {
            console.warn('⚠️ خطأ في تحميل الإعدادات:', error);
        }
    }

    showToast(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        try {
            const toastContainer = document.getElementById('toast-container') || (() => {
                const container = document.createElement('div');
                container.id = 'toast-container';
                container.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    z-index: 9999;
                `;
                document.body.appendChild(container);
                return container;
            })();
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.style.cssText = `
                background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                margin-top: 10px;
                animation: slideIn 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 200px;
            `;
            
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                info: 'fas fa-info-circle',
                warning: 'fas fa-exclamation-triangle'
            };
            
            toast.innerHTML = `
                <i class="${icons[type] || 'fas fa-info-circle'}"></i>
                <span>${message}</span>
            `;
            
            toastContainer.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.animation = 'slideOut 0.3s ease forwards';
                    setTimeout(() => toast.remove(), 300);
                }
            }, 3000);
            
            // إضافة الأنيميشن إذا لم تكن موجودة
            if (!document.getElementById('toast-animations')) {
                const style = document.createElement('style');
                style.id = 'toast-animations';
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOut {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
            
        } catch (error) {
            console.warn('⚠️ فشل عرض الإشعار:', error);
        }
    }

    setupUI() {
        console.log('🎨 إعداد واجهة المستخدم...');
        
        try {
            // إعداد الأزرار الأساسية
            const cartBtn = document.getElementById('cart-btn');
            if (cartBtn) {
                cartBtn.addEventListener('click', () => {
                    const cartPanel = document.getElementById('cart-panel');
                    if (cartPanel) cartPanel.classList.add('open');
                });
            }
            
            // إعداد التبويبات
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabId = tab.dataset.tab;
                    console.log(`🔘 تغيير التبويب إلى: ${tabId}`);
                    
                    // تحديث التبويب النشط
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    // إظهار المحتوى المناسب
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    const targetTab = document.getElementById(`${tabId}-tab`);
                    if (targetTab) targetTab.classList.add('active');
                });
            });
            
            // إعداد زر الإغلاق في السلة
            const closeCartBtn = document.querySelector('.close-cart');
            if (closeCartBtn) {
                closeCartBtn.addEventListener('click', () => {
                    const cartPanel = document.getElementById('cart-panel');
                    if (cartPanel) cartPanel.classList.remove('open');
                });
            }
            
            console.log('✅ تم إعداد واجهة المستخدم');
        } catch (error) {
            console.error('❌ خطأ في إعداد واجهة المستخدم:', error);
        }
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showToast('تم استعادة الاتصال بالإنترنت', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('أنت تعمل حالياً بدون اتصال بالإنترنت', 'warning');
        });
    }

    async updateDashboardStats() {
        try {
            console.log('📈 تحديث الإحصائيات...');
            
            // هنا سيتم تحديث الإحصائيات
            // يمكنك إضافة الكود لاحقاً
            
            console.log('✅ تم تحديث الإحصائيات');
        } catch (error) {
            console.warn('⚠️ خطأ في تحديث الإحصائيات:', error);
        }
    }
}

// ==================== تصدير الكلاس للنطاق العالمي ====================
if (typeof window !== 'undefined') {
    window.GroceryPOSApp = GroceryPOSApp;
    console.log('✅ تم تصدير GroceryPOSApp للنطاق العالمي');
}