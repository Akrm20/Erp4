
// قاعدة البيانات الرئيسية
class GroceryPOSDB {
    constructor() {
        this.db = null;
        this.dbName = 'GroceryPOS';
        this.dbVersion = 2; // زيادة رقم الإصدار
        this.initPromise = this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('فشل فتح قاعدة البيانات:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('تم فتح قاعدة البيانات بنجاح');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    }

    createStores(db) {
        // جدول المنتجات
        if (!db.objectStoreNames.contains('products')) {
            const productStore = db.createObjectStore('products', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            productStore.createIndex('categoryId', 'categoryId', { unique: false });
            productStore.createIndex('barcode', 'barcode', { unique: false });
            productStore.createIndex('name', 'name', { unique: false });
            productStore.createIndex('stock', 'stock', { unique: false });
        }

        // جدول الفئات
        if (!db.objectStoreNames.contains('categories')) {
            const categoryStore = db.createObjectStore('categories', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            categoryStore.createIndex('name', 'name', { unique: true });
        }

        // جدول العملاء
        if (!db.objectStoreNames.contains('customers')) {
            const customerStore = db.createObjectStore('customers', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            customerStore.createIndex('phone', 'phone', { unique: false });
            customerStore.createIndex('name', 'name', { unique: false });
        }

        // جدول الموردين
        if (!db.objectStoreNames.contains('suppliers')) {
            const supplierStore = db.createObjectStore('suppliers', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            supplierStore.createIndex('name', 'name', { unique: false });
            supplierStore.createIndex('phone', 'phone', { unique: false });
        }

        // جدول المشتريات
        if (!db.objectStoreNames.contains('purchases')) {
            const purchaseStore = db.createObjectStore('purchases', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            purchaseStore.createIndex('supplierId', 'supplierId', { unique: false });
            purchaseStore.createIndex('date', 'date', { unique: false });
            purchaseStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
        }

        // جدول المشتريات التفصيلي
        if (!db.objectStoreNames.contains('purchaseItems')) {
            const purchaseItemStore = db.createObjectStore('purchaseItems', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            purchaseItemStore.createIndex('purchaseId', 'purchaseId', { unique: false });
            purchaseItemStore.createIndex('productId', 'productId', { unique: false });
        }

        // جدول المبيعات
        if (!db.objectStoreNames.contains('sales')) {
            const saleStore = db.createObjectStore('sales', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            saleStore.createIndex('customerId', 'customerId', { unique: false });
            saleStore.createIndex('date', 'date', { unique: false });
            saleStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
        }

        // جدول المبيعات التفصيلي
        if (!db.objectStoreNames.contains('saleItems')) {
            const saleItemStore = db.createObjectStore('saleItems', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            saleItemStore.createIndex('saleId', 'saleId', { unique: false });
            saleItemStore.createIndex('productId', 'productId', { unique: false });
        }

        // جدول المعاملات المحاسبية
        if (!db.objectStoreNames.contains('transactions')) {
            const transactionStore = db.createObjectStore('transactions', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            transactionStore.createIndex('date', 'date', { unique: false });
            transactionStore.createIndex('type', 'type', { unique: false });
            transactionStore.createIndex('referenceId', 'referenceId', { unique: false });
        }

        // جدول الجرد
        if (!db.objectStoreNames.contains('inventory')) {
            const inventoryStore = db.createObjectStore('inventory', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            inventoryStore.createIndex('productId', 'productId', { unique: true });
            inventoryStore.createIndex('warehouse', 'warehouse', { unique: false });
        }

        // جدول حركات المخزون
        if (!db.objectStoreNames.contains('inventoryMovements')) {
            const movementStore = db.createObjectStore('inventoryMovements', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            movementStore.createIndex('productId', 'productId', { unique: false });
            movementStore.createIndex('date', 'date', { unique: false });
            movementStore.createIndex('type', 'type', { unique: false });
        }

        // جدول المستخدمين
        if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            userStore.createIndex('username', 'username', { unique: true });
            userStore.createIndex('role', 'role', { unique: false });
        }

        // جدول الإعدادات
        if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', { 
                keyPath: 'key' 
            });
        }

        console.log('تم إنشاء جميع الجداول بنجاح');
    }

    // ============= دوال عامة =============
    async add(storeName, data) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async get(storeName, id) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            if (id === undefined || id === null || id === '') {
                reject(new Error('معرف غير صالح للبحث'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getAll(storeName, indexName = null, query = null) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            let request;
            
            if (indexName) {
                const index = store.index(indexName);
                request = query ? index.getAll(query) : index.getAll();
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async update(storeName, data) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async delete(storeName, id) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // ============= دوال خاصة بالمنتجات =============
    async getProductsByCategory(categoryId) {
        return this.getAll('products', 'categoryId', Number(categoryId));
    }

    async searchProducts(searchTerm) {
        const allProducts = await this.getAll('products');
        return allProducts.filter(product => 
            product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode === searchTerm ||
            product.code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    async updateProductStock(productId, quantityChange, type = 'sale') {
        const product = await this.get('products', productId);
        if (!product) throw new Error('المنتج غير موجود');

        const oldStock = product.stock || 0;
        const newStock = type === 'sale' ? oldStock - quantityChange : oldStock + quantityChange;
        
        product.stock = newStock;
        await this.update('products', product);

        // تسجيل حركة المخزون
        const movement = {
            productId,
            date: new Date().toISOString(),
            type,
            quantity: quantityChange,
            oldStock,
            newStock,
            reference: `تحديث تلقائي ${type === 'sale' ? 'بيع' : 'شراء'}`
        };
        
        await this.add('inventoryMovements', movement);
        
        return newStock;
    }

    // ============= دوال خاصة بالمبيعات =============
    async createSale(saleData, items) {
        const saleId = await this.add('sales', saleData);
        
        for (const item of items) {
            item.saleId = saleId;
            await this.add('saleItems', item);
            
            // تحديث المخزون
            await this.updateProductStock(item.productId, item.quantity, 'sale');
        }

        // تسجيل المعاملة المحاسبية
        await this.recordTransaction({
            date: saleData.date,
            type: 'sale',
            referenceId: saleId,
            description: `بيع رقم ${saleData.invoiceNumber}`,
            amount: saleData.total,
            accountCode: '4010', // إيرادات المبيعات
            debitCredit: 'credit'
        });

        return saleId;
    }

    // ============= دوال خاصة بالمشتريات =============
    async createPurchase(purchaseData, items) {
        const purchaseId = await this.add('purchases', purchaseData);
        
        for (const item of items) {
            item.purchaseId = purchaseId;
            await this.add('purchaseItems', item);
            
            // تحديث المخزون
            await this.updateProductStock(item.productId, item.quantity, 'purchase');
        }

        // تسجيل المعاملة المحاسبية
        await this.recordTransaction({
            date: purchaseData.date,
            type: 'purchase',
            referenceId: purchaseId,
            description: `شراء رقم ${purchaseData.invoiceNumber}`,
            amount: purchaseData.total,
            accountCode: '5010', // تكلفة البضاعة المباعة
            debitCredit: 'debit'
        });

        return purchaseId;
    }

    // ============= دوال المحاسبة =============
    async recordTransaction(transaction) {
        return this.add('transactions', {
            ...transaction,
            timestamp: new Date().toISOString()
        });
    }

    async getAccountBalance(accountCode) {
        const transactions = await this.getAll('transactions');
        let balance = 0;
        
        transactions.filter(t => t.accountCode === accountCode).forEach(t => {
            if (t.debitCredit === 'debit') {
                balance += t.amount;
            } else {
                balance -= t.amount;
            }
        });
        
        return balance;
    }

    async getDailySales(date = new Date().toISOString().split('T')[0]) {
        const sales = await this.getAll('sales', 'date', date);
        return sales.reduce((total, sale) => total + (sale.total || 0), 0);
    }

    async getMonthlySales(year, month) {
        const allSales = await this.getAll('sales');
        return allSales
            .filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate.getFullYear() === year && saleDate.getMonth() === month;
            })
            .reduce((total, sale) => total + (sale.total || 0), 0);
    }

    // ============= دوال الإحصائيات =============
    async getDashboardStats() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const dailySales = await this.getDailySales(today);
        const monthlySales = await this.getMonthlySales(year, month);
        
        // حساب قيمة المخزون
        const products = await this.getAll('products');
        const inventoryValue = products.reduce((total, product) => {
            const stock = product.stock || 0;
            const cost = product.costPrice || product.salePrice || 0;
            return total + (stock * cost);
        }, 0);

        // حساب ذمم العملاء
        const customers = await this.getAll('customers');
        const customersBalance = customers.reduce((total, customer) => {
            return total + (customer.balance || 0);
        }, 0);

        return {
            dailySales,
            monthlySales,
            inventoryValue,
            customersBalance,
            totalProducts: products.length,
            totalCustomers: customers.length,
            lowStockProducts: products.filter(p => (p.stock || 0) <= (p.minStock || 5)).length
        };
    }

    // ============= دوال النسخ الاحتياطي والاستعادة =============
    async exportData() {
        const stores = [
            'products', 'categories', 'customers', 'suppliers',
            'sales', 'saleItems', 'purchases', 'purchaseItems',
            'transactions', 'inventory', 'inventoryMovements', 'settings'
        ];

        const data = {};
        
        for (const store of stores) {
            try {
                data[store] = await this.getAll(store);
            } catch (error) {
                console.warn(`تعذر تصدير ${store}:`, error);
                data[store] = [];
            }
        }

        return {
            version: this.dbVersion,
            exportDate: new Date().toISOString(),
            data
        };
    }

    async importData(backupData) {
        const { data, version } = backupData;
        
        // التحقق من التوافق
        if (version > this.dbVersion) {
            throw new Error('النسخة الاحتياطية أحدث من النظام الحالي');
        }

        // حذف البيانات القديمة
        const stores = Object.keys(data);
        for (const store of stores) {
            try {
                const allItems = await this.getAll(store);
                for (const item of allItems) {
                    await this.delete(store, item.id);
                }
            } catch (error) {
                console.warn(`تعذر تنظيف ${store}:`, error);
            }
        }

        // استيراد البيانات الجديدة
        for (const store of stores) {
            const items = data[store];
            for (const item of items) {
                try {
                    await this.add(store, item);
                } catch (error) {
                    console.warn(`تعذر استيراد عنصر في ${store}:`, error);
                }
            }
        }

        return true;
    }

    // ============= دوال الإعدادات =============
    async getSetting(key, defaultValue = null) {
        try {
            const setting = await this.get('settings', key);
            return setting ? setting.value : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }

    async setSetting(key, value) {
        return this.update('settings', { key, value, updatedAt: new Date().toISOString() });
    }
}

// إنشاء نسخة واحدة من قاعدة البيانات
const db = new GroceryPOSDB();

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.db = db;
    console.log('تم تهيئة قاعدة البيانات للاستخدام العام');
}
