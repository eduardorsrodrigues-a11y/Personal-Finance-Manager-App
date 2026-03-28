export type LanguageCode = 'en' | 'zh' | 'es' | 'hi' | 'ar' | 'de' | 'fr' | 'ja' | 'pt' | 'ko' | 'id' | 'ru' | 'it' | 'tr' | 'vi';

export type TranslationSchema = {
  nav: {
    dashboard: string; transactions: string; budgets: string;
    signIn: string; signOut: string; currency: string; language: string;
    syncToCloud: string; dataMigrate: string; loading: string;
  };
  dashboard: {
    title: string; subtitle: string; addTransaction: string;
    totalIncome: string; totalExpenses: string; currentBalance: string;
    expensesByCategory: string; noExpenseData: string;
    totalByCategory: string; noCategoryTotals: string;
    recentTransactions: string; noTransactions: string; of: string;
  };
  transactions: {
    title: string; subtitle: string; addTransaction: string;
    searchPlaceholder: string; noTransactions: string;
    adjustFilters: string; startAdding: string;
    filterByType: string; allTime: string; allCategories: string;
    timePeriod: string; category: string; all: string; income: string; expense: string;
  };
  budgets: {
    title: string; subtitle: string; loading: string;
    noLimit: string; save: string; saved: string; hint: string;
  };
  modal: {
    addTitle: string; editTitle: string; expense: string; income: string;
    amount: string; description: string; date: string; category: string;
    selectCategory: string; confirm: string; addTransaction: string;
    enterDescription: string;
  };
  login: {
    title: string; subtitle: string; googleTitle: string; googleDesc: string;
    googleButton: string; or: string; guestTitle: string; guestDesc: string;
    guestButton: string;
  };
  delete: {
    title: string; message: string; cancel: string; confirm: string; toast: string;
  };
  toasts: {
    added: string; updated: string;
  };
  loading: { fetching: string };
  categories: {
    Food: string; Groceries: string; Housing: string; Utilities: string; Transportation: string;
    Shopping: string; Health: string; Entertainment: string; Travel: string;
    'Family & Personal': string; Gifts: string; 'Gym & Sports': string;
    Salary: string; Freelance: string; Investment: string; Business: string;
    Cashback: string; RSUs: string; 'Holiday Allowance': string; 'Meal Allowance': string;
    Other: string;
  };
};

const en: TranslationSchema = {
  nav: {
    dashboard: 'Dashboard', transactions: 'Transactions', budgets: 'Budgets',
    signIn: 'Sign in with Google', signOut: 'Sign out', currency: 'Currency', language: 'Language',
    syncToCloud: 'Your data will sync to cloud', dataMigrate: 'Your data will migrate automatically',
    loading: 'Loading...',
  },
  dashboard: {
    title: 'Dashboard', subtitle: "Welcome back! Here's your financial overview.",
    addTransaction: 'Add Transaction', totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses', currentBalance: 'Current Balance',
    expensesByCategory: 'Expenses by Category', noExpenseData: 'No expense data available',
    totalByCategory: 'Total by Category', noCategoryTotals: 'No category totals for this time period.',
    recentTransactions: 'Recent Transactions', noTransactions: 'No transactions yet', of: 'of',
  },
  transactions: {
    title: 'Transaction History', subtitle: 'View and manage all your transactions',
    addTransaction: 'Add Transaction', searchPlaceholder: 'Search transactions...',
    noTransactions: 'No transactions found', adjustFilters: 'Try adjusting your search or filters',
    startAdding: 'Start by adding your first transaction',
    filterByType: 'Filter by Type', allTime: 'All time', allCategories: 'All Categories',
    timePeriod: 'Time Period', category: 'Category', all: 'All', income: 'Income', expense: 'Expense',
  },
  budgets: {
    title: 'Budgets', subtitle: 'Set a monthly spending allowance per category.',
    loading: 'Loading budgets…', noLimit: 'No limit', save: 'Save', saved: 'Saved',
    hint: 'Leave a field empty or set it to 0 to remove the budget limit for that category.',
  },
  modal: {
    addTitle: 'Add Transaction', editTitle: 'Edit Transaction',
    expense: 'Expense', income: 'Income', amount: 'Amount', description: 'Description',
    date: 'Date', category: 'Category', selectCategory: 'Select category',
    confirm: 'Confirm', addTransaction: 'Add Transaction', enterDescription: 'Enter description',
  },
  login: {
    title: 'Expense Manager', subtitle: 'Track your income and expenses',
    googleTitle: 'Sign in with Google',
    googleDesc: 'Data is safely backed up to the cloud and synced across all your devices.',
    googleButton: 'Continue with Google', or: 'or',
    guestTitle: 'Continue as Guest',
    guestDesc: 'Data is stored only on this device and will be lost if browser storage is cleared. You can sign in with Google later — your data will migrate automatically.',
    guestButton: 'Continue as Guest',
  },
  delete: {
    title: 'Delete Transaction', message: 'Are you sure you want to delete this transaction?',
    cancel: 'Cancel', confirm: 'Delete', toast: 'Transaction deleted',
  },
  toasts: { added: 'Transaction added', updated: 'Transaction updated' },
  loading: { fetching: 'Fetching your data...' },
  categories: {
    Food: 'Food', Groceries: 'Groceries', Housing: 'Housing', Utilities: 'Utilities',
    Transportation: 'Transportation', Shopping: 'Shopping', Health: 'Health',
    Entertainment: 'Entertainment', Travel: 'Travel', 'Family & Personal': 'Family & Personal',
    Gifts: 'Gifts', 'Gym & Sports': 'Gym & Sports', Salary: 'Salary', Freelance: 'Freelance', Investment: 'Investment',
    Business: 'Business', Cashback: 'Cashback', RSUs: 'RSUs',
    'Holiday Allowance': 'Holiday Allowance', 'Meal Allowance': 'Meal Allowance', Other: 'Other',
  },
};

const zh: TranslationSchema = {
  nav: {
    dashboard: '仪表板', transactions: '交易记录', budgets: '预算',
    signIn: '使用 Google 登录', signOut: '退出登录', currency: '货币', language: '语言',
    syncToCloud: '您的数据将同步到云端', dataMigrate: '您的数据将自动迁移',
    loading: '加载中...',
  },
  dashboard: {
    title: '仪表板', subtitle: '欢迎回来！这是您的财务概览。',
    addTransaction: '添加交易', totalIncome: '总收入', totalExpenses: '总支出',
    currentBalance: '当前余额', expensesByCategory: '按类别的支出',
    noExpenseData: '暂无支出数据', totalByCategory: '各类别合计',
    noCategoryTotals: '此时间段没有类别数据。', recentTransactions: '最近交易',
    noTransactions: '暂无交易', of: '/',
  },
  transactions: {
    title: '交易历史', subtitle: '查看和管理所有交易',
    addTransaction: '添加交易', searchPlaceholder: '搜索交易...',
    noTransactions: '未找到交易', adjustFilters: '请尝试调整搜索或筛选条件',
    startAdding: '开始添加您的第一笔交易',
    filterByType: '按类型筛选', allTime: '全部时间', allCategories: '所有类别',
    timePeriod: '时间段', category: '类别', all: '全部', income: '收入', expense: '支出',
  },
  budgets: {
    title: '预算', subtitle: '为每个类别设置每月支出限额。',
    loading: '正在加载预算…', noLimit: '无限制', save: '保存', saved: '已保存',
    hint: '将字段留空或设置为 0 可取消该类别的预算限制。',
  },
  modal: {
    addTitle: '添加交易', editTitle: '编辑交易',
    expense: '支出', income: '收入', amount: '金额', description: '描述',
    date: '日期', category: '类别', selectCategory: '选择类别',
    confirm: '确认', addTransaction: '添加交易', enterDescription: '输入描述',
  },
  login: {
    title: '费用管理器', subtitle: '追踪您的收入和支出',
    googleTitle: '使用 Google 登录',
    googleDesc: '数据安全备份到云端并在所有设备上同步。',
    googleButton: '使用 Google 继续', or: '或',
    guestTitle: '以访客身份继续',
    guestDesc: '数据仅存储在此设备上，清除浏览器存储时将丢失。您可以稍后使用 Google 登录 — 您的数据将自动迁移。',
    guestButton: '以访客身份继续',
  },
  delete: {
    title: '删除交易', message: '您确定要删除此交易吗？',
    cancel: '取消', confirm: '删除', toast: '交易已删除',
  },
  toasts: { added: '交易已添加', updated: '交易已更新' },
  loading: { fetching: '正在获取数据...' },
  categories: {
    Food: '餐饮', Groceries: '杂货', Housing: '住房', Utilities: '水电',
    Transportation: '交通', Shopping: '购物', Health: '健康',
    Entertainment: '娱乐', Travel: '旅行', 'Family & Personal': '家庭与个人',
    Gifts: '礼物', 'Gym & Sports': '健身与运动', Salary: '薪资', Freelance: '自由职业', Investment: '投资',
    Business: '商业', Cashback: '返现', RSUs: '限制性股票',
    'Holiday Allowance': '节假日补贴', 'Meal Allowance': '餐饮补贴', Other: '其他',
  },
};

const es: TranslationSchema = {
  nav: {
    dashboard: 'Panel', transactions: 'Transacciones', budgets: 'Presupuestos',
    signIn: 'Iniciar sesión con Google', signOut: 'Cerrar sesión', currency: 'Moneda', language: 'Idioma',
    syncToCloud: 'Tus datos se sincronizarán en la nube', dataMigrate: 'Tus datos se migrarán automáticamente',
    loading: 'Cargando...',
  },
  dashboard: {
    title: 'Panel', subtitle: '¡Bienvenido de nuevo! Aquí está tu resumen financiero.',
    addTransaction: 'Añadir transacción', totalIncome: 'Ingresos totales',
    totalExpenses: 'Gastos totales', currentBalance: 'Saldo actual',
    expensesByCategory: 'Gastos por categoría', noExpenseData: 'No hay datos de gastos disponibles',
    totalByCategory: 'Total por categoría', noCategoryTotals: 'Sin datos para este período.',
    recentTransactions: 'Transacciones recientes', noTransactions: 'Sin transacciones aún', of: 'de',
  },
  transactions: {
    title: 'Historial de transacciones', subtitle: 'Ver y gestionar todas tus transacciones',
    addTransaction: 'Añadir transacción', searchPlaceholder: 'Buscar transacciones...',
    noTransactions: 'No se encontraron transacciones', adjustFilters: 'Intenta ajustar tu búsqueda o filtros',
    startAdding: 'Comienza añadiendo tu primera transacción',
    filterByType: 'Filtrar por tipo', allTime: 'Todo el tiempo', allCategories: 'Todas las categorías',
    timePeriod: 'Período de tiempo', category: 'Categoría', all: 'Todos', income: 'Ingreso', expense: 'Gasto',
  },
  budgets: {
    title: 'Presupuestos', subtitle: 'Establece un límite de gasto mensual por categoría.',
    loading: 'Cargando presupuestos…', noLimit: 'Sin límite', save: 'Guardar', saved: 'Guardado',
    hint: 'Deja el campo vacío o ponlo en 0 para eliminar el límite de presupuesto de esa categoría.',
  },
  modal: {
    addTitle: 'Añadir transacción', editTitle: 'Editar transacción',
    expense: 'Gasto', income: 'Ingreso', amount: 'Cantidad', description: 'Descripción',
    date: 'Fecha', category: 'Categoría', selectCategory: 'Seleccionar categoría',
    confirm: 'Confirmar', addTransaction: 'Añadir transacción', enterDescription: 'Introduce una descripción',
  },
  login: {
    title: 'Gestor de gastos', subtitle: 'Controla tus ingresos y gastos',
    googleTitle: 'Iniciar sesión con Google',
    googleDesc: 'Los datos se guardan de forma segura en la nube y se sincronizan en todos tus dispositivos.',
    googleButton: 'Continuar con Google', or: 'o',
    guestTitle: 'Continuar como invitado',
    guestDesc: 'Los datos se almacenan solo en este dispositivo. Puedes iniciar sesión con Google más tarde — tus datos se migrarán automáticamente.',
    guestButton: 'Continuar como invitado',
  },
  delete: {
    title: 'Eliminar transacción', message: '¿Estás seguro de que quieres eliminar esta transacción?',
    cancel: 'Cancelar', confirm: 'Eliminar', toast: 'Transacción eliminada',
  },
  toasts: { added: 'Transacción añadida', updated: 'Transacción actualizada' },
  loading: { fetching: 'Obteniendo tus datos...' },
  categories: {
    Food: 'Comida', Groceries: 'Supermercado', Housing: 'Vivienda', Utilities: 'Servicios',
    Transportation: 'Transporte', Shopping: 'Compras', Health: 'Salud',
    Entertainment: 'Entretenimiento', Travel: 'Viajes', 'Family & Personal': 'Familia y personal',
    Gifts: 'Regalos', 'Gym & Sports': 'Gimnasio y deportes', Salary: 'Salario', Freelance: 'Freelance', Investment: 'Inversión',
    Business: 'Negocio', Cashback: 'Devolución', RSUs: 'Acciones RSU',
    'Holiday Allowance': 'Subsidio vacacional', 'Meal Allowance': 'Subsidio de comida', Other: 'Otros',
  },
};

const hi: TranslationSchema = {
  nav: {
    dashboard: 'डैशबोर्ड', transactions: 'लेन-देन', budgets: 'बजट',
    signIn: 'Google से साइन इन करें', signOut: 'साइन आउट', currency: 'मुद्रा', language: 'भाषा',
    syncToCloud: 'आपका डेटा क्लाउड में सिंक होगा', dataMigrate: 'आपका डेटा स्वचालित रूप से माइग्रेट होगा',
    loading: 'लोड हो रहा है...',
  },
  dashboard: {
    title: 'डैशबोर्ड', subtitle: 'वापस स्वागत है! यहाँ आपका वित्तीय सारांश है।',
    addTransaction: 'लेन-देन जोड़ें', totalIncome: 'कुल आय', totalExpenses: 'कुल खर्च',
    currentBalance: 'वर्तमान शेष', expensesByCategory: 'श्रेणी के अनुसार खर्च',
    noExpenseData: 'कोई खर्च डेटा उपलब्ध नहीं', totalByCategory: 'श्रेणी के अनुसार कुल',
    noCategoryTotals: 'इस अवधि के लिए कोई श्रेणी डेटा नहीं।',
    recentTransactions: 'हाल के लेन-देन', noTransactions: 'अभी तक कोई लेन-देन नहीं', of: 'में से',
  },
  transactions: {
    title: 'लेन-देन इतिहास', subtitle: 'सभी लेन-देन देखें और प्रबंधित करें',
    addTransaction: 'लेन-देन जोड़ें', searchPlaceholder: 'लेन-देन खोजें...',
    noTransactions: 'कोई लेन-देन नहीं मिला', adjustFilters: 'खोज या फ़िल्टर बदलने का प्रयास करें',
    startAdding: 'अपना पहला लेन-देन जोड़कर शुरुआत करें',
    filterByType: 'प्रकार से फ़िल्टर करें', allTime: 'सभी समय', allCategories: 'सभी श्रेणियाँ',
    timePeriod: 'समय अवधि', category: 'श्रेणी', all: 'सभी', income: 'आय', expense: 'खर्च',
  },
  budgets: {
    title: 'बजट', subtitle: 'प्रत्येक श्रेणी के लिए मासिक खर्च सीमा निर्धारित करें।',
    loading: 'बजट लोड हो रहा है…', noLimit: 'कोई सीमा नहीं', save: 'सहेजें', saved: 'सहेजा गया',
    hint: 'उस श्रेणी की बजट सीमा हटाने के लिए फ़ील्ड खाली छोड़ें या 0 दर्ज करें।',
  },
  modal: {
    addTitle: 'लेन-देन जोड़ें', editTitle: 'लेन-देन संपादित करें',
    expense: 'खर्च', income: 'आय', amount: 'राशि', description: 'विवरण',
    date: 'तारीख', category: 'श्रेणी', selectCategory: 'श्रेणी चुनें',
    confirm: 'पुष्टि करें', addTransaction: 'लेन-देन जोड़ें', enterDescription: 'विवरण दर्ज करें',
  },
  login: {
    title: 'व्यय प्रबंधक', subtitle: 'अपनी आय और खर्च ट्रैक करें',
    googleTitle: 'Google से साइन इन करें',
    googleDesc: 'डेटा सुरक्षित रूप से क्लाउड में बैकअप होता है और सभी डिवाइस पर सिंक होता है।',
    googleButton: 'Google से जारी रखें', or: 'या',
    guestTitle: 'अतिथि के रूप में जारी रखें',
    guestDesc: 'डेटा केवल इस डिवाइस पर संग्रहीत है। आप बाद में Google से साइन इन कर सकते हैं — आपका डेटा स्वचालित रूप से माइग्रेट होगा।',
    guestButton: 'अतिथि के रूप में जारी रखें',
  },
  delete: {
    title: 'लेन-देन हटाएं', message: 'क्या आप वाकई इस लेन-देन को हटाना चाहते हैं?',
    cancel: 'रद्द करें', confirm: 'हटाएं', toast: 'लेन-देन हटा दिया गया',
  },
  toasts: { added: 'लेन-देन जोड़ा गया', updated: 'लेन-देन अपडेट किया गया' },
  loading: { fetching: 'डेटा प्राप्त हो रहा है...' },
  categories: {
    Food: 'खाना', Groceries: 'किराना', Housing: 'आवास', Utilities: 'उपयोगिताएँ',
    Transportation: 'परिवहन', Shopping: 'खरीदारी', Health: 'स्वास्थ्य',
    Entertainment: 'मनोरंजन', Travel: 'यात्रा', 'Family & Personal': 'परिवार और व्यक्तिगत',
    Gifts: 'उपहार', 'Gym & Sports': 'जिम और खेल', Salary: 'वेतन', Freelance: 'फ्रीलांस', Investment: 'निवेश',
    Business: 'व्यवसाय', Cashback: 'कैशबैक', RSUs: 'आरएसयू',
    'Holiday Allowance': 'छुट्टी भत्ता', 'Meal Allowance': 'भोजन भत्ता', Other: 'अन्य',
  },
};

const ar: TranslationSchema = {
  nav: {
    dashboard: 'لوحة التحكم', transactions: 'المعاملات', budgets: 'الميزانيات',
    signIn: 'تسجيل الدخول بـ Google', signOut: 'تسجيل الخروج', currency: 'العملة', language: 'اللغة',
    syncToCloud: 'ستتم مزامنة بياناتك على السحابة', dataMigrate: 'ستنتقل بياناتك تلقائياً',
    loading: 'جارٍ التحميل...',
  },
  dashboard: {
    title: 'لوحة التحكم', subtitle: 'مرحباً بعودتك! إليك نظرة عامة على وضعك المالي.',
    addTransaction: 'إضافة معاملة', totalIncome: 'إجمالي الدخل', totalExpenses: 'إجمالي المصروفات',
    currentBalance: 'الرصيد الحالي', expensesByCategory: 'المصروفات حسب الفئة',
    noExpenseData: 'لا توجد بيانات مصروفات', totalByCategory: 'الإجمالي حسب الفئة',
    noCategoryTotals: 'لا توجد بيانات للفئات في هذه الفترة.',
    recentTransactions: 'المعاملات الأخيرة', noTransactions: 'لا توجد معاملات بعد', of: 'من',
  },
  transactions: {
    title: 'سجل المعاملات', subtitle: 'عرض وإدارة جميع معاملاتك',
    addTransaction: 'إضافة معاملة', searchPlaceholder: 'البحث في المعاملات...',
    noTransactions: 'لم يتم العثور على معاملات', adjustFilters: 'حاول تعديل البحث أو الفلاتر',
    startAdding: 'ابدأ بإضافة معاملتك الأولى',
    filterByType: 'تصفية حسب النوع', allTime: 'كل الوقت', allCategories: 'جميع الفئات',
    timePeriod: 'الفترة الزمنية', category: 'الفئة', all: 'الكل', income: 'دخل', expense: 'مصروف',
  },
  budgets: {
    title: 'الميزانيات', subtitle: 'حدد حداً شهرياً للإنفاق لكل فئة.',
    loading: 'جارٍ تحميل الميزانيات…', noLimit: 'بلا حد', save: 'حفظ', saved: 'تم الحفظ',
    hint: 'اترك الحقل فارغاً أو اضبطه على 0 لإزالة حد الميزانية لتلك الفئة.',
  },
  modal: {
    addTitle: 'إضافة معاملة', editTitle: 'تعديل المعاملة',
    expense: 'مصروف', income: 'دخل', amount: 'المبلغ', description: 'الوصف',
    date: 'التاريخ', category: 'الفئة', selectCategory: 'اختر فئة',
    confirm: 'تأكيد', addTransaction: 'إضافة معاملة', enterDescription: 'أدخل الوصف',
  },
  login: {
    title: 'مدير المصروفات', subtitle: 'تتبع دخلك ومصروفاتك',
    googleTitle: 'تسجيل الدخول بـ Google',
    googleDesc: 'يتم نسخ البيانات احتياطياً على السحابة ومزامنتها على جميع أجهزتك.',
    googleButton: 'المتابعة بـ Google', or: 'أو',
    guestTitle: 'المتابعة كضيف',
    guestDesc: 'البيانات مخزنة على هذا الجهاز فقط. يمكنك تسجيل الدخول بـ Google لاحقاً — ستنتقل بياناتك تلقائياً.',
    guestButton: 'المتابعة كضيف',
  },
  delete: {
    title: 'حذف المعاملة', message: 'هل أنت متأكد أنك تريد حذف هذه المعاملة؟',
    cancel: 'إلغاء', confirm: 'حذف', toast: 'تم حذف المعاملة',
  },
  toasts: { added: 'تمت إضافة المعاملة', updated: 'تم تحديث المعاملة' },
  loading: { fetching: 'جارٍ جلب بياناتك...' },
  categories: {
    Food: 'طعام', Groceries: 'بقالة', Housing: 'سكن', Utilities: 'مرافق',
    Transportation: 'مواصلات', Shopping: 'تسوق', Health: 'صحة',
    Entertainment: 'ترفيه', Travel: 'سفر', 'Family & Personal': 'عائلة وشخصي',
    Gifts: 'هدايا', 'Gym & Sports': 'الصالة الرياضية والرياضة', Salary: 'راتب', Freelance: 'عمل حر', Investment: 'استثمار',
    Business: 'أعمال', Cashback: 'استرداد نقدي', RSUs: 'أسهم مقيدة',
    'Holiday Allowance': 'بدل الإجازة', 'Meal Allowance': 'بدل الوجبات', Other: 'أخرى',
  },
};

const de: TranslationSchema = {
  nav: {
    dashboard: 'Dashboard', transactions: 'Transaktionen', budgets: 'Budgets',
    signIn: 'Mit Google anmelden', signOut: 'Abmelden', currency: 'Währung', language: 'Sprache',
    syncToCloud: 'Deine Daten werden mit der Cloud synchronisiert', dataMigrate: 'Deine Daten werden automatisch migriert',
    loading: 'Lädt...',
  },
  dashboard: {
    title: 'Dashboard', subtitle: 'Willkommen zurück! Hier ist deine Finanzübersicht.',
    addTransaction: 'Transaktion hinzufügen', totalIncome: 'Gesamteinnahmen', totalExpenses: 'Gesamtausgaben',
    currentBalance: 'Aktueller Kontostand', expensesByCategory: 'Ausgaben nach Kategorie',
    noExpenseData: 'Keine Ausgabendaten verfügbar', totalByCategory: 'Gesamt nach Kategorie',
    noCategoryTotals: 'Keine Kategoriedaten für diesen Zeitraum.',
    recentTransactions: 'Letzte Transaktionen', noTransactions: 'Noch keine Transaktionen', of: 'von',
  },
  transactions: {
    title: 'Transaktionsverlauf', subtitle: 'Alle Transaktionen ansehen und verwalten',
    addTransaction: 'Transaktion hinzufügen', searchPlaceholder: 'Transaktionen suchen...',
    noTransactions: 'Keine Transaktionen gefunden', adjustFilters: 'Suche oder Filter anpassen',
    startAdding: 'Füge deine erste Transaktion hinzu',
    filterByType: 'Nach Typ filtern', allTime: 'Gesamte Zeit', allCategories: 'Alle Kategorien',
    timePeriod: 'Zeitraum', category: 'Kategorie', all: 'Alle', income: 'Einnahme', expense: 'Ausgabe',
  },
  budgets: {
    title: 'Budgets', subtitle: 'Lege ein monatliches Ausgabenlimit pro Kategorie fest.',
    loading: 'Budgets werden geladen…', noLimit: 'Kein Limit', save: 'Speichern', saved: 'Gespeichert',
    hint: 'Lass das Feld leer oder setze es auf 0, um das Budget-Limit für diese Kategorie zu entfernen.',
  },
  modal: {
    addTitle: 'Transaktion hinzufügen', editTitle: 'Transaktion bearbeiten',
    expense: 'Ausgabe', income: 'Einnahme', amount: 'Betrag', description: 'Beschreibung',
    date: 'Datum', category: 'Kategorie', selectCategory: 'Kategorie wählen',
    confirm: 'Bestätigen', addTransaction: 'Transaktion hinzufügen', enterDescription: 'Beschreibung eingeben',
  },
  login: {
    title: 'Ausgaben-Manager', subtitle: 'Verfolge deine Einnahmen und Ausgaben',
    googleTitle: 'Mit Google anmelden',
    googleDesc: 'Daten werden sicher in der Cloud gesichert und auf allen deinen Geräten synchronisiert.',
    googleButton: 'Mit Google fortfahren', or: 'oder',
    guestTitle: 'Als Gast fortfahren',
    guestDesc: 'Daten werden nur auf diesem Gerät gespeichert. Du kannst dich später mit Google anmelden — deine Daten werden automatisch migriert.',
    guestButton: 'Als Gast fortfahren',
  },
  delete: {
    title: 'Transaktion löschen', message: 'Bist du sicher, dass du diese Transaktion löschen möchtest?',
    cancel: 'Abbrechen', confirm: 'Löschen', toast: 'Transaktion gelöscht',
  },
  toasts: { added: 'Transaktion hinzugefügt', updated: 'Transaktion aktualisiert' },
  loading: { fetching: 'Daten werden geladen...' },
  categories: {
    Food: 'Essen', Groceries: 'Lebensmittel', Housing: 'Wohnen', Utilities: 'Nebenkosten',
    Transportation: 'Transport', Shopping: 'Einkaufen', Health: 'Gesundheit',
    Entertainment: 'Unterhaltung', Travel: 'Reisen', 'Family & Personal': 'Familie & Persönliches',
    Gifts: 'Geschenke', 'Gym & Sports': 'Fitnessstudio & Sport', Salary: 'Gehalt', Freelance: 'Freelance', Investment: 'Investition',
    Business: 'Geschäft', Cashback: 'Cashback', RSUs: 'Aktienoptionen',
    'Holiday Allowance': 'Urlaubsgeld', 'Meal Allowance': 'Essensgeld', Other: 'Sonstiges',
  },
};

const fr: TranslationSchema = {
  nav: {
    dashboard: 'Tableau de bord', transactions: 'Transactions', budgets: 'Budgets',
    signIn: 'Se connecter avec Google', signOut: 'Se déconnecter', currency: 'Devise', language: 'Langue',
    syncToCloud: 'Vos données seront synchronisées dans le cloud', dataMigrate: 'Vos données seront migrées automatiquement',
    loading: 'Chargement...',
  },
  dashboard: {
    title: 'Tableau de bord', subtitle: 'Bienvenue ! Voici votre aperçu financier.',
    addTransaction: 'Ajouter une transaction', totalIncome: 'Revenus totaux', totalExpenses: 'Dépenses totales',
    currentBalance: 'Solde actuel', expensesByCategory: 'Dépenses par catégorie',
    noExpenseData: 'Aucune donnée de dépenses disponible', totalByCategory: 'Total par catégorie',
    noCategoryTotals: 'Aucune donnée de catégorie pour cette période.',
    recentTransactions: 'Transactions récentes', noTransactions: 'Aucune transaction pour le moment', of: 'sur',
  },
  transactions: {
    title: 'Historique des transactions', subtitle: 'Voir et gérer toutes vos transactions',
    addTransaction: 'Ajouter une transaction', searchPlaceholder: 'Rechercher des transactions...',
    noTransactions: 'Aucune transaction trouvée', adjustFilters: 'Essayez de modifier votre recherche ou vos filtres',
    startAdding: 'Commencez par ajouter votre première transaction',
    filterByType: 'Filtrer par type', allTime: 'Tout le temps', allCategories: 'Toutes les catégories',
    timePeriod: 'Période', category: 'Catégorie', all: 'Tout', income: 'Revenu', expense: 'Dépense',
  },
  budgets: {
    title: 'Budgets', subtitle: 'Définissez une limite de dépenses mensuelle par catégorie.',
    loading: 'Chargement des budgets…', noLimit: 'Sans limite', save: 'Enregistrer', saved: 'Enregistré',
    hint: 'Laissez le champ vide ou mettez-le à 0 pour supprimer la limite budgétaire de cette catégorie.',
  },
  modal: {
    addTitle: 'Ajouter une transaction', editTitle: 'Modifier la transaction',
    expense: 'Dépense', income: 'Revenu', amount: 'Montant', description: 'Description',
    date: 'Date', category: 'Catégorie', selectCategory: 'Sélectionner une catégorie',
    confirm: 'Confirmer', addTransaction: 'Ajouter une transaction', enterDescription: 'Entrez une description',
  },
  login: {
    title: 'Gestionnaire de dépenses', subtitle: 'Suivez vos revenus et dépenses',
    googleTitle: 'Se connecter avec Google',
    googleDesc: 'Les données sont sauvegardées en toute sécurité dans le cloud et synchronisées sur tous vos appareils.',
    googleButton: 'Continuer avec Google', or: 'ou',
    guestTitle: 'Continuer en tant qu\'invité',
    guestDesc: 'Les données sont stockées uniquement sur cet appareil. Vous pouvez vous connecter avec Google plus tard — vos données seront migrées automatiquement.',
    guestButton: 'Continuer en tant qu\'invité',
  },
  delete: {
    title: 'Supprimer la transaction', message: 'Êtes-vous sûr de vouloir supprimer cette transaction ?',
    cancel: 'Annuler', confirm: 'Supprimer', toast: 'Transaction supprimée',
  },
  toasts: { added: 'Transaction ajoutée', updated: 'Transaction mise à jour' },
  loading: { fetching: 'Récupération des données...' },
  categories: {
    Food: 'Alimentation', Groceries: 'Courses', Housing: 'Logement', Utilities: 'Services',
    Transportation: 'Transport', Shopping: 'Shopping', Health: 'Santé',
    Entertainment: 'Divertissement', Travel: 'Voyages', 'Family & Personal': 'Famille et personnel',
    Gifts: 'Cadeaux', 'Gym & Sports': 'Gym & Sport', Salary: 'Salaire', Freelance: 'Freelance', Investment: 'Investissement',
    Business: 'Entreprise', Cashback: 'Remboursement', RSUs: 'Actions gratuites',
    'Holiday Allowance': 'Prime de vacances', 'Meal Allowance': 'Ticket restaurant', Other: 'Autre',
  },
};

const ja: TranslationSchema = {
  nav: {
    dashboard: 'ダッシュボード', transactions: '取引履歴', budgets: '予算',
    signIn: 'Googleでサインイン', signOut: 'サインアウト', currency: '通貨', language: '言語',
    syncToCloud: 'データはクラウドに同期されます', dataMigrate: 'データは自動的に移行されます',
    loading: '読み込み中...',
  },
  dashboard: {
    title: 'ダッシュボード', subtitle: 'おかえりなさい！財務の概要です。',
    addTransaction: '取引を追加', totalIncome: '総収入', totalExpenses: '総支出',
    currentBalance: '現在の残高', expensesByCategory: 'カテゴリ別支出',
    noExpenseData: '支出データがありません', totalByCategory: 'カテゴリ別合計',
    noCategoryTotals: 'この期間のカテゴリデータはありません。',
    recentTransactions: '最近の取引', noTransactions: 'まだ取引がありません', of: '/',
  },
  transactions: {
    title: '取引履歴', subtitle: 'すべての取引を表示・管理',
    addTransaction: '取引を追加', searchPlaceholder: '取引を検索...',
    noTransactions: '取引が見つかりません', adjustFilters: '検索やフィルターを調整してください',
    startAdding: '最初の取引を追加してみましょう',
    filterByType: 'タイプで絞り込む', allTime: 'すべての期間', allCategories: 'すべてのカテゴリ',
    timePeriod: '期間', category: 'カテゴリ', all: 'すべて', income: '収入', expense: '支出',
  },
  budgets: {
    title: '予算', subtitle: 'カテゴリごとに月次支出上限を設定します。',
    loading: '予算を読み込み中…', noLimit: '上限なし', save: '保存', saved: '保存済み',
    hint: 'フィールドを空欄にするか0に設定すると、そのカテゴリの予算上限が解除されます。',
  },
  modal: {
    addTitle: '取引を追加', editTitle: '取引を編集',
    expense: '支出', income: '収入', amount: '金額', description: '説明',
    date: '日付', category: 'カテゴリ', selectCategory: 'カテゴリを選択',
    confirm: '確認', addTransaction: '取引を追加', enterDescription: '説明を入力',
  },
  login: {
    title: '支出管理アプリ', subtitle: '収入と支出を管理しましょう',
    googleTitle: 'Googleでサインイン',
    googleDesc: 'データはクラウドに安全にバックアップされ、すべてのデバイスで同期されます。',
    googleButton: 'Googleで続ける', or: 'または',
    guestTitle: 'ゲストとして続ける',
    guestDesc: 'データはこのデバイスにのみ保存されます。後でGoogleでサインインできます — データは自動的に移行されます。',
    guestButton: 'ゲストとして続ける',
  },
  delete: {
    title: '取引を削除', message: 'この取引を削除してもよろしいですか？',
    cancel: 'キャンセル', confirm: '削除', toast: '取引を削除しました',
  },
  toasts: { added: '取引を追加しました', updated: '取引を更新しました' },
  loading: { fetching: 'データを読み込んでいます...' },
  categories: {
    Food: '食費', Groceries: '食料品', Housing: '住居', Utilities: '光熱費',
    Transportation: '交通', Shopping: 'ショッピング', Health: '健康',
    Entertainment: 'エンタメ', Travel: '旅行', 'Family & Personal': '家族・個人',
    Gifts: 'ギフト', 'Gym & Sports': 'ジム・スポーツ', Salary: '給与', Freelance: 'フリーランス', Investment: '投資',
    Business: 'ビジネス', Cashback: 'キャッシュバック', RSUs: '株式報酬',
    'Holiday Allowance': '休暇手当', 'Meal Allowance': '食事手当', Other: 'その他',
  },
};

const pt: TranslationSchema = {
  nav: {
    dashboard: 'Painel', transactions: 'Transações', budgets: 'Orçamentos',
    signIn: 'Entrar com Google', signOut: 'Sair', currency: 'Moeda', language: 'Idioma',
    syncToCloud: 'Seus dados serão sincronizados na nuvem', dataMigrate: 'Seus dados serão migrados automaticamente',
    loading: 'Carregando...',
  },
  dashboard: {
    title: 'Painel', subtitle: 'Bem-vindo de volta! Aqui está seu resumo financeiro.',
    addTransaction: 'Adicionar transação', totalIncome: 'Receita total', totalExpenses: 'Despesas totais',
    currentBalance: 'Saldo atual', expensesByCategory: 'Despesas por categoria',
    noExpenseData: 'Nenhum dado de despesa disponível', totalByCategory: 'Total por categoria',
    noCategoryTotals: 'Nenhum dado de categoria para este período.',
    recentTransactions: 'Transações recentes', noTransactions: 'Nenhuma transação ainda', of: 'de',
  },
  transactions: {
    title: 'Histórico de transações', subtitle: 'Ver e gerenciar todas as suas transações',
    addTransaction: 'Adicionar transação', searchPlaceholder: 'Buscar transações...',
    noTransactions: 'Nenhuma transação encontrada', adjustFilters: 'Tente ajustar sua busca ou filtros',
    startAdding: 'Comece adicionando sua primeira transação',
    filterByType: 'Filtrar por tipo', allTime: 'Todo o período', allCategories: 'Todas as categorias',
    timePeriod: 'Período', category: 'Categoria', all: 'Todos', income: 'Receita', expense: 'Despesa',
  },
  budgets: {
    title: 'Orçamentos', subtitle: 'Defina um limite de gastos mensal por categoria.',
    loading: 'Carregando orçamentos…', noLimit: 'Sem limite', save: 'Salvar', saved: 'Salvo',
    hint: 'Deixe o campo vazio ou defina como 0 para remover o limite de orçamento dessa categoria.',
  },
  modal: {
    addTitle: 'Adicionar transação', editTitle: 'Editar transação',
    expense: 'Despesa', income: 'Receita', amount: 'Valor', description: 'Descrição',
    date: 'Data', category: 'Categoria', selectCategory: 'Selecionar categoria',
    confirm: 'Confirmar', addTransaction: 'Adicionar transação', enterDescription: 'Digite uma descrição',
  },
  login: {
    title: 'Gerenciador de despesas', subtitle: 'Controle suas receitas e despesas',
    googleTitle: 'Entrar com Google',
    googleDesc: 'Os dados são salvos com segurança na nuvem e sincronizados em todos os seus dispositivos.',
    googleButton: 'Continuar com Google', or: 'ou',
    guestTitle: 'Continuar como visitante',
    guestDesc: 'Os dados são armazenados apenas neste dispositivo. Você pode entrar com Google depois — seus dados serão migrados automaticamente.',
    guestButton: 'Continuar como visitante',
  },
  delete: {
    title: 'Excluir transação', message: 'Tem certeza que deseja excluir esta transação?',
    cancel: 'Cancelar', confirm: 'Excluir', toast: 'Transação excluída',
  },
  toasts: { added: 'Transação adicionada', updated: 'Transação atualizada' },
  loading: { fetching: 'Carregando seus dados...' },
  categories: {
    Food: 'Alimentação', Groceries: 'Mercearia', Housing: 'Habitação', Utilities: 'Utilidades',
    Transportation: 'Transporte', Shopping: 'Compras', Health: 'Saúde',
    Entertainment: 'Entretenimento', Travel: 'Viagem', 'Family & Personal': 'Família e Pessoal',
    Gifts: 'Presentes', 'Gym & Sports': 'Academia e esportes', Salary: 'Salário', Freelance: 'Freelance', Investment: 'Investimento',
    Business: 'Negócios', Cashback: 'Cashback', RSUs: 'RSUs',
    'Holiday Allowance': 'Subsídio de Férias', 'Meal Allowance': 'Subsídio de Refeição', Other: 'Outros',
  },
};

const ko: TranslationSchema = {
  nav: {
    dashboard: '대시보드', transactions: '거래 내역', budgets: '예산',
    signIn: 'Google로 로그인', signOut: '로그아웃', currency: '통화', language: '언어',
    syncToCloud: '데이터가 클라우드에 동기화됩니다', dataMigrate: '데이터가 자동으로 마이그레이션됩니다',
    loading: '로딩 중...',
  },
  dashboard: {
    title: '대시보드', subtitle: '다시 오셨군요! 재정 현황을 확인하세요.',
    addTransaction: '거래 추가', totalIncome: '총 수입', totalExpenses: '총 지출',
    currentBalance: '현재 잔액', expensesByCategory: '카테고리별 지출',
    noExpenseData: '지출 데이터가 없습니다', totalByCategory: '카테고리별 합계',
    noCategoryTotals: '이 기간에 대한 카테고리 데이터가 없습니다.',
    recentTransactions: '최근 거래', noTransactions: '아직 거래가 없습니다', of: '/',
  },
  transactions: {
    title: '거래 내역', subtitle: '모든 거래 보기 및 관리',
    addTransaction: '거래 추가', searchPlaceholder: '거래 검색...',
    noTransactions: '거래를 찾을 수 없습니다', adjustFilters: '검색이나 필터를 조정해 보세요',
    startAdding: '첫 번째 거래를 추가하여 시작하세요',
    filterByType: '유형별 필터', allTime: '전체 기간', allCategories: '전체 카테고리',
    timePeriod: '기간', category: '카테고리', all: '전체', income: '수입', expense: '지출',
  },
  budgets: {
    title: '예산', subtitle: '카테고리별 월간 지출 한도를 설정하세요.',
    loading: '예산 로딩 중…', noLimit: '한도 없음', save: '저장', saved: '저장됨',
    hint: '예산 한도를 삭제하려면 필드를 비우거나 0으로 설정하세요.',
  },
  modal: {
    addTitle: '거래 추가', editTitle: '거래 편집',
    expense: '지출', income: '수입', amount: '금액', description: '설명',
    date: '날짜', category: '카테고리', selectCategory: '카테고리 선택',
    confirm: '확인', addTransaction: '거래 추가', enterDescription: '설명 입력',
  },
  login: {
    title: '지출 관리자', subtitle: '수입과 지출을 관리하세요',
    googleTitle: 'Google로 로그인',
    googleDesc: '데이터는 클라우드에 안전하게 백업되어 모든 기기에서 동기화됩니다.',
    googleButton: 'Google로 계속', or: '또는',
    guestTitle: '게스트로 계속',
    guestDesc: '데이터는 이 기기에만 저장됩니다. 나중에 Google로 로그인할 수 있습니다 — 데이터가 자동으로 마이그레이션됩니다.',
    guestButton: '게스트로 계속',
  },
  delete: {
    title: '거래 삭제', message: '이 거래를 삭제하시겠습니까?',
    cancel: '취소', confirm: '삭제', toast: '거래가 삭제되었습니다',
  },
  toasts: { added: '거래가 추가되었습니다', updated: '거래가 수정되었습니다' },
  loading: { fetching: '데이터를 불러오는 중...' },
  categories: {
    Food: '식비', Groceries: '식료품', Housing: '주거', Utilities: '공과금',
    Transportation: '교통', Shopping: '쇼핑', Health: '건강',
    Entertainment: '엔터테인먼트', Travel: '여행', 'Family & Personal': '가족 및 개인',
    Gifts: '선물', 'Gym & Sports': '헬스장 & 스포츠', Salary: '급여', Freelance: '프리랜서', Investment: '투자',
    Business: '사업', Cashback: '캐시백', RSUs: '주식 보상',
    'Holiday Allowance': '휴가 수당', 'Meal Allowance': '식대', Other: '기타',
  },
};

const id: TranslationSchema = {
  nav: {
    dashboard: 'Dasbor', transactions: 'Transaksi', budgets: 'Anggaran',
    signIn: 'Masuk dengan Google', signOut: 'Keluar', currency: 'Mata uang', language: 'Bahasa',
    syncToCloud: 'Data Anda akan disinkronkan ke cloud', dataMigrate: 'Data Anda akan dimigrasikan secara otomatis',
    loading: 'Memuat...',
  },
  dashboard: {
    title: 'Dasbor', subtitle: 'Selamat datang kembali! Berikut ikhtisar keuangan Anda.',
    addTransaction: 'Tambah transaksi', totalIncome: 'Total pemasukan', totalExpenses: 'Total pengeluaran',
    currentBalance: 'Saldo saat ini', expensesByCategory: 'Pengeluaran per kategori',
    noExpenseData: 'Tidak ada data pengeluaran', totalByCategory: 'Total per kategori',
    noCategoryTotals: 'Tidak ada data kategori untuk periode ini.',
    recentTransactions: 'Transaksi terbaru', noTransactions: 'Belum ada transaksi', of: 'dari',
  },
  transactions: {
    title: 'Riwayat transaksi', subtitle: 'Lihat dan kelola semua transaksi Anda',
    addTransaction: 'Tambah transaksi', searchPlaceholder: 'Cari transaksi...',
    noTransactions: 'Tidak ada transaksi ditemukan', adjustFilters: 'Coba sesuaikan pencarian atau filter',
    startAdding: 'Mulai dengan menambahkan transaksi pertama Anda',
    filterByType: 'Filter berdasarkan jenis', allTime: 'Semua waktu', allCategories: 'Semua kategori',
    timePeriod: 'Periode waktu', category: 'Kategori', all: 'Semua', income: 'Pemasukan', expense: 'Pengeluaran',
  },
  budgets: {
    title: 'Anggaran', subtitle: 'Tetapkan batas pengeluaran bulanan per kategori.',
    loading: 'Memuat anggaran…', noLimit: 'Tanpa batas', save: 'Simpan', saved: 'Tersimpan',
    hint: 'Biarkan kolom kosong atau atur ke 0 untuk menghapus batas anggaran kategori tersebut.',
  },
  modal: {
    addTitle: 'Tambah transaksi', editTitle: 'Edit transaksi',
    expense: 'Pengeluaran', income: 'Pemasukan', amount: 'Jumlah', description: 'Deskripsi',
    date: 'Tanggal', category: 'Kategori', selectCategory: 'Pilih kategori',
    confirm: 'Konfirmasi', addTransaction: 'Tambah transaksi', enterDescription: 'Masukkan deskripsi',
  },
  login: {
    title: 'Manajer Pengeluaran', subtitle: 'Lacak pemasukan dan pengeluaran Anda',
    googleTitle: 'Masuk dengan Google',
    googleDesc: 'Data dicadangkan dengan aman ke cloud dan disinkronkan di semua perangkat Anda.',
    googleButton: 'Lanjutkan dengan Google', or: 'atau',
    guestTitle: 'Lanjutkan sebagai Tamu',
    guestDesc: 'Data hanya disimpan di perangkat ini. Anda dapat masuk dengan Google nanti — data Anda akan dimigrasikan secara otomatis.',
    guestButton: 'Lanjutkan sebagai Tamu',
  },
  delete: {
    title: 'Hapus transaksi', message: 'Apakah Anda yakin ingin menghapus transaksi ini?',
    cancel: 'Batal', confirm: 'Hapus', toast: 'Transaksi dihapus',
  },
  toasts: { added: 'Transaksi ditambahkan', updated: 'Transaksi diperbarui' },
  loading: { fetching: 'Mengambil data Anda...' },
  categories: {
    Food: 'Makanan', Groceries: 'Belanjaan', Housing: 'Perumahan', Utilities: 'Utilitas',
    Transportation: 'Transportasi', Shopping: 'Belanja', Health: 'Kesehatan',
    Entertainment: 'Hiburan', Travel: 'Perjalanan', 'Family & Personal': 'Keluarga & Pribadi',
    Gifts: 'Hadiah', 'Gym & Sports': 'Gym & Olahraga', Salary: 'Gaji', Freelance: 'Freelance', Investment: 'Investasi',
    Business: 'Bisnis', Cashback: 'Cashback', RSUs: 'RSU Saham',
    'Holiday Allowance': 'Tunjangan Hari Raya', 'Meal Allowance': 'Uang Makan', Other: 'Lainnya',
  },
};

const ru: TranslationSchema = {
  nav: {
    dashboard: 'Дашборд', transactions: 'Транзакции', budgets: 'Бюджеты',
    signIn: 'Войти через Google', signOut: 'Выйти', currency: 'Валюта', language: 'Язык',
    syncToCloud: 'Данные будут синхронизированы с облаком', dataMigrate: 'Ваши данные будут перенесены автоматически',
    loading: 'Загрузка...',
  },
  dashboard: {
    title: 'Дашборд', subtitle: 'С возвращением! Вот обзор ваших финансов.',
    addTransaction: 'Добавить транзакцию', totalIncome: 'Общий доход', totalExpenses: 'Общие расходы',
    currentBalance: 'Текущий баланс', expensesByCategory: 'Расходы по категориям',
    noExpenseData: 'Нет данных о расходах', totalByCategory: 'Итого по категориям',
    noCategoryTotals: 'Нет данных по категориям за этот период.',
    recentTransactions: 'Последние транзакции', noTransactions: 'Транзакций пока нет', of: 'из',
  },
  transactions: {
    title: 'История транзакций', subtitle: 'Просмотр и управление всеми транзакциями',
    addTransaction: 'Добавить транзакцию', searchPlaceholder: 'Поиск транзакций...',
    noTransactions: 'Транзакции не найдены', adjustFilters: 'Попробуйте изменить поиск или фильтры',
    startAdding: 'Начните с добавления первой транзакции',
    filterByType: 'Фильтр по типу', allTime: 'Всё время', allCategories: 'Все категории',
    timePeriod: 'Период', category: 'Категория', all: 'Все', income: 'Доход', expense: 'Расход',
  },
  budgets: {
    title: 'Бюджеты', subtitle: 'Установите ежемесячный лимит расходов по категориям.',
    loading: 'Загрузка бюджетов…', noLimit: 'Без лимита', save: 'Сохранить', saved: 'Сохранено',
    hint: 'Оставьте поле пустым или установите 0, чтобы снять лимит бюджета для этой категории.',
  },
  modal: {
    addTitle: 'Добавить транзакцию', editTitle: 'Редактировать транзакцию',
    expense: 'Расход', income: 'Доход', amount: 'Сумма', description: 'Описание',
    date: 'Дата', category: 'Категория', selectCategory: 'Выберите категорию',
    confirm: 'Подтвердить', addTransaction: 'Добавить транзакцию', enterDescription: 'Введите описание',
  },
  login: {
    title: 'Менеджер расходов', subtitle: 'Отслеживайте доходы и расходы',
    googleTitle: 'Войти через Google',
    googleDesc: 'Данные надёжно сохраняются в облаке и синхронизируются на всех ваших устройствах.',
    googleButton: 'Продолжить через Google', or: 'или',
    guestTitle: 'Продолжить как гость',
    guestDesc: 'Данные хранятся только на этом устройстве. Вы можете войти через Google позже — данные перенесутся автоматически.',
    guestButton: 'Продолжить как гость',
  },
  delete: {
    title: 'Удалить транзакцию', message: 'Вы уверены, что хотите удалить эту транзакцию?',
    cancel: 'Отмена', confirm: 'Удалить', toast: 'Транзакция удалена',
  },
  toasts: { added: 'Транзакция добавлена', updated: 'Транзакция обновлена' },
  loading: { fetching: 'Загрузка данных...' },
  categories: {
    Food: 'Питание', Groceries: 'Продукты', Housing: 'Жильё', Utilities: 'Коммунальные',
    Transportation: 'Транспорт', Shopping: 'Покупки', Health: 'Здоровье',
    Entertainment: 'Развлечения', Travel: 'Путешествия', 'Family & Personal': 'Семья и личное',
    Gifts: 'Подарки', 'Gym & Sports': 'Спорт и фитнес', Salary: 'Зарплата', Freelance: 'Фриланс', Investment: 'Инвестиции',
    Business: 'Бизнес', Cashback: 'Кэшбэк', RSUs: 'Акции (RSU)',
    'Holiday Allowance': 'Отпускные', 'Meal Allowance': 'Обеденные', Other: 'Другое',
  },
};

const it: TranslationSchema = {
  nav: {
    dashboard: 'Dashboard', transactions: 'Transazioni', budgets: 'Budget',
    signIn: 'Accedi con Google', signOut: 'Esci', currency: 'Valuta', language: 'Lingua',
    syncToCloud: 'I tuoi dati verranno sincronizzati nel cloud', dataMigrate: 'I tuoi dati verranno migrati automaticamente',
    loading: 'Caricamento...',
  },
  dashboard: {
    title: 'Dashboard', subtitle: 'Bentornato! Ecco il tuo riepilogo finanziario.',
    addTransaction: 'Aggiungi transazione', totalIncome: 'Entrate totali', totalExpenses: 'Spese totali',
    currentBalance: 'Saldo attuale', expensesByCategory: 'Spese per categoria',
    noExpenseData: 'Nessun dato di spesa disponibile', totalByCategory: 'Totale per categoria',
    noCategoryTotals: 'Nessun dato di categoria per questo periodo.',
    recentTransactions: 'Transazioni recenti', noTransactions: 'Nessuna transazione ancora', of: 'di',
  },
  transactions: {
    title: 'Storico transazioni', subtitle: 'Visualizza e gestisci tutte le tue transazioni',
    addTransaction: 'Aggiungi transazione', searchPlaceholder: 'Cerca transazioni...',
    noTransactions: 'Nessuna transazione trovata', adjustFilters: 'Prova a modificare la ricerca o i filtri',
    startAdding: 'Inizia aggiungendo la tua prima transazione',
    filterByType: 'Filtra per tipo', allTime: 'Tutto il tempo', allCategories: 'Tutte le categorie',
    timePeriod: 'Periodo', category: 'Categoria', all: 'Tutti', income: 'Entrata', expense: 'Spesa',
  },
  budgets: {
    title: 'Budget', subtitle: 'Imposta un limite di spesa mensile per categoria.',
    loading: 'Caricamento budget…', noLimit: 'Nessun limite', save: 'Salva', saved: 'Salvato',
    hint: 'Lascia il campo vuoto o impostalo a 0 per rimuovere il limite di budget per quella categoria.',
  },
  modal: {
    addTitle: 'Aggiungi transazione', editTitle: 'Modifica transazione',
    expense: 'Spesa', income: 'Entrata', amount: 'Importo', description: 'Descrizione',
    date: 'Data', category: 'Categoria', selectCategory: 'Seleziona categoria',
    confirm: 'Conferma', addTransaction: 'Aggiungi transazione', enterDescription: 'Inserisci una descrizione',
  },
  login: {
    title: 'Gestore spese', subtitle: 'Tieni traccia di entrate e spese',
    googleTitle: 'Accedi con Google',
    googleDesc: 'I dati sono salvati in modo sicuro nel cloud e sincronizzati su tutti i tuoi dispositivi.',
    googleButton: 'Continua con Google', or: 'oppure',
    guestTitle: 'Continua come ospite',
    guestDesc: 'I dati sono archiviati solo su questo dispositivo. Puoi accedere con Google in seguito — i tuoi dati verranno migrati automaticamente.',
    guestButton: 'Continua come ospite',
  },
  delete: {
    title: 'Elimina transazione', message: 'Sei sicuro di voler eliminare questa transazione?',
    cancel: 'Annulla', confirm: 'Elimina', toast: 'Transazione eliminata',
  },
  toasts: { added: 'Transazione aggiunta', updated: 'Transazione aggiornata' },
  loading: { fetching: 'Recupero dati in corso...' },
  categories: {
    Food: 'Cibo', Groceries: 'Spesa', Housing: 'Alloggio', Utilities: 'Utenze',
    Transportation: 'Trasporti', Shopping: 'Shopping', Health: 'Salute',
    Entertainment: 'Intrattenimento', Travel: 'Viaggi', 'Family & Personal': 'Famiglia e personale',
    Gifts: 'Regali', 'Gym & Sports': 'Palestra e sport', Salary: 'Stipendio', Freelance: 'Freelance', Investment: 'Investimento',
    Business: 'Affari', Cashback: 'Cashback', RSUs: 'Azioni RSU',
    'Holiday Allowance': 'Indennità vacanze', 'Meal Allowance': 'Buono pasto', Other: 'Altro',
  },
};

const tr: TranslationSchema = {
  nav: {
    dashboard: 'Gösterge Paneli', transactions: 'İşlemler', budgets: 'Bütçeler',
    signIn: "Google ile Giriş Yap", signOut: 'Çıkış Yap', currency: 'Para Birimi', language: 'Dil',
    syncToCloud: 'Verileriniz buluta senkronize edilecek', dataMigrate: 'Verileriniz otomatik olarak taşınacak',
    loading: 'Yükleniyor...',
  },
  dashboard: {
    title: 'Gösterge Paneli', subtitle: 'Tekrar hoş geldiniz! İşte finansal özetiniz.',
    addTransaction: 'İşlem Ekle', totalIncome: 'Toplam Gelir', totalExpenses: 'Toplam Gider',
    currentBalance: 'Mevcut Bakiye', expensesByCategory: 'Kategoriye Göre Giderler',
    noExpenseData: 'Gider verisi bulunmuyor', totalByCategory: 'Kategoriye Göre Toplam',
    noCategoryTotals: 'Bu dönem için kategori verisi yok.',
    recentTransactions: 'Son İşlemler', noTransactions: 'Henüz işlem yok', of: '/',
  },
  transactions: {
    title: 'İşlem Geçmişi', subtitle: 'Tüm işlemlerinizi görüntüleyin ve yönetin',
    addTransaction: 'İşlem Ekle', searchPlaceholder: 'İşlem ara...',
    noTransactions: 'İşlem bulunamadı', adjustFilters: 'Arama veya filtreleri ayarlamayı deneyin',
    startAdding: 'İlk işleminizi ekleyerek başlayın',
    filterByType: 'Türe Göre Filtrele', allTime: 'Tüm Zamanlar', allCategories: 'Tüm Kategoriler',
    timePeriod: 'Zaman Dilimi', category: 'Kategori', all: 'Tümü', income: 'Gelir', expense: 'Gider',
  },
  budgets: {
    title: 'Bütçeler', subtitle: 'Kategori başına aylık harcama limiti belirleyin.',
    loading: 'Bütçeler yükleniyor…', noLimit: 'Limit yok', save: 'Kaydet', saved: 'Kaydedildi',
    hint: 'O kategori için bütçe limitini kaldırmak üzere alanı boş bırakın veya 0 girin.',
  },
  modal: {
    addTitle: 'İşlem Ekle', editTitle: 'İşlemi Düzenle',
    expense: 'Gider', income: 'Gelir', amount: 'Tutar', description: 'Açıklama',
    date: 'Tarih', category: 'Kategori', selectCategory: 'Kategori seçin',
    confirm: 'Onayla', addTransaction: 'İşlem Ekle', enterDescription: 'Açıklama girin',
  },
  login: {
    title: 'Gider Yöneticisi', subtitle: 'Gelir ve giderlerinizi takip edin',
    googleTitle: "Google ile Giriş Yap",
    googleDesc: 'Veriler güvenli bir şekilde buluta yedeklenir ve tüm cihazlarınızda senkronize edilir.',
    googleButton: "Google ile Devam Et", or: 'veya',
    guestTitle: 'Misafir Olarak Devam Et',
    guestDesc: 'Veriler yalnızca bu cihazda saklanır. Daha sonra Google ile giriş yapabilirsiniz — verileriniz otomatik olarak taşınacak.',
    guestButton: 'Misafir Olarak Devam Et',
  },
  delete: {
    title: 'İşlemi Sil', message: 'Bu işlemi silmek istediğinizden emin misiniz?',
    cancel: 'İptal', confirm: 'Sil', toast: 'İşlem silindi',
  },
  toasts: { added: 'İşlem eklendi', updated: 'İşlem güncellendi' },
  loading: { fetching: 'Verileriniz yükleniyor...' },
  categories: {
    Food: 'Yiyecek', Groceries: 'Market', Housing: 'Konut', Utilities: 'Faturalar',
    Transportation: 'Ulaşım', Shopping: 'Alışveriş', Health: 'Sağlık',
    Entertainment: 'Eğlence', Travel: 'Seyahat', 'Family & Personal': 'Aile ve Kişisel',
    Gifts: 'Hediyeler', 'Gym & Sports': 'Spor Salonu & Spor', Salary: 'Maaş', Freelance: 'Serbest Çalışma', Investment: 'Yatırım',
    Business: 'İş', Cashback: 'Nakit İadesi', RSUs: 'Hisse Senetleri',
    'Holiday Allowance': 'Tatil Ödeneği', 'Meal Allowance': 'Yemek Ödeneği', Other: 'Diğer',
  },
};

const vi: TranslationSchema = {
  nav: {
    dashboard: 'Bảng điều khiển', transactions: 'Giao dịch', budgets: 'Ngân sách',
    signIn: 'Đăng nhập bằng Google', signOut: 'Đăng xuất', currency: 'Tiền tệ', language: 'Ngôn ngữ',
    syncToCloud: 'Dữ liệu của bạn sẽ được đồng bộ lên cloud', dataMigrate: 'Dữ liệu của bạn sẽ được chuyển tự động',
    loading: 'Đang tải...',
  },
  dashboard: {
    title: 'Bảng điều khiển', subtitle: 'Chào mừng trở lại! Đây là tổng quan tài chính của bạn.',
    addTransaction: 'Thêm giao dịch', totalIncome: 'Tổng thu nhập', totalExpenses: 'Tổng chi tiêu',
    currentBalance: 'Số dư hiện tại', expensesByCategory: 'Chi tiêu theo danh mục',
    noExpenseData: 'Không có dữ liệu chi tiêu', totalByCategory: 'Tổng theo danh mục',
    noCategoryTotals: 'Không có dữ liệu danh mục cho kỳ này.',
    recentTransactions: 'Giao dịch gần đây', noTransactions: 'Chưa có giao dịch nào', of: '/',
  },
  transactions: {
    title: 'Lịch sử giao dịch', subtitle: 'Xem và quản lý tất cả giao dịch của bạn',
    addTransaction: 'Thêm giao dịch', searchPlaceholder: 'Tìm kiếm giao dịch...',
    noTransactions: 'Không tìm thấy giao dịch', adjustFilters: 'Thử điều chỉnh tìm kiếm hoặc bộ lọc',
    startAdding: 'Bắt đầu bằng cách thêm giao dịch đầu tiên',
    filterByType: 'Lọc theo loại', allTime: 'Tất cả thời gian', allCategories: 'Tất cả danh mục',
    timePeriod: 'Khoảng thời gian', category: 'Danh mục', all: 'Tất cả', income: 'Thu nhập', expense: 'Chi tiêu',
  },
  budgets: {
    title: 'Ngân sách', subtitle: 'Đặt hạn mức chi tiêu hàng tháng cho từng danh mục.',
    loading: 'Đang tải ngân sách…', noLimit: 'Không giới hạn', save: 'Lưu', saved: 'Đã lưu',
    hint: 'Để trống hoặc đặt thành 0 để xóa giới hạn ngân sách cho danh mục đó.',
  },
  modal: {
    addTitle: 'Thêm giao dịch', editTitle: 'Chỉnh sửa giao dịch',
    expense: 'Chi tiêu', income: 'Thu nhập', amount: 'Số tiền', description: 'Mô tả',
    date: 'Ngày', category: 'Danh mục', selectCategory: 'Chọn danh mục',
    confirm: 'Xác nhận', addTransaction: 'Thêm giao dịch', enterDescription: 'Nhập mô tả',
  },
  login: {
    title: 'Quản lý chi tiêu', subtitle: 'Theo dõi thu nhập và chi tiêu của bạn',
    googleTitle: 'Đăng nhập bằng Google',
    googleDesc: 'Dữ liệu được sao lưu an toàn lên cloud và đồng bộ trên tất cả thiết bị của bạn.',
    googleButton: 'Tiếp tục với Google', or: 'hoặc',
    guestTitle: 'Tiếp tục với tư cách Khách',
    guestDesc: 'Dữ liệu chỉ được lưu trên thiết bị này. Bạn có thể đăng nhập bằng Google sau — dữ liệu sẽ được chuyển tự động.',
    guestButton: 'Tiếp tục với tư cách Khách',
  },
  delete: {
    title: 'Xóa giao dịch', message: 'Bạn có chắc chắn muốn xóa giao dịch này không?',
    cancel: 'Hủy', confirm: 'Xóa', toast: 'Đã xóa giao dịch',
  },
  toasts: { added: 'Đã thêm giao dịch', updated: 'Đã cập nhật giao dịch' },
  loading: { fetching: 'Đang tải dữ liệu...' },
  categories: {
    Food: 'Thức ăn', Groceries: 'Hàng tạp hóa', Housing: 'Nhà ở', Utilities: 'Tiện ích',
    Transportation: 'Giao thông', Shopping: 'Mua sắm', Health: 'Sức khỏe',
    Entertainment: 'Giải trí', Travel: 'Du lịch', 'Family & Personal': 'Gia đình & Cá nhân',
    Gifts: 'Quà tặng', 'Gym & Sports': 'Phòng gym & Thể thao', Salary: 'Lương', Freelance: 'Tự do', Investment: 'Đầu tư',
    Business: 'Kinh doanh', Cashback: 'Hoàn tiền', RSUs: 'Cổ phiếu RSU',
    'Holiday Allowance': 'Phụ cấp nghỉ lễ', 'Meal Allowance': 'Phụ cấp ăn uống', Other: 'Khác',
  },
};

export const translations: Record<LanguageCode, TranslationSchema> = {
  en, zh, es, hi, ar, de, fr, ja, pt, ko, id, ru, it, tr, vi,
};

export type Language = {
  code: LanguageCode;
  name: string;
  nativeName: string;
  rtl?: boolean;
};

export const languages: Language[] = [
  { code: 'en', name: 'English',                    nativeName: 'English'            },
  { code: 'zh', name: 'Mandarin Chinese',            nativeName: '中文 (简体)'          },
  { code: 'es', name: 'Spanish',                    nativeName: 'Español'            },
  { code: 'hi', name: 'Hindi',                      nativeName: 'हिन्दी'               },
  { code: 'ar', name: 'Arabic',                     nativeName: 'العربية', rtl: true  },
  { code: 'de', name: 'German',                     nativeName: 'Deutsch'            },
  { code: 'fr', name: 'French',                     nativeName: 'Français'           },
  { code: 'ja', name: 'Japanese',                   nativeName: '日本語'               },
  { code: 'pt', name: 'Portuguese',                  nativeName: 'Português'          },
  { code: 'ko', name: 'Korean',                     nativeName: '한국어'               },
  { code: 'id', name: 'Indonesian',                 nativeName: 'Bahasa Indonesia'   },
  { code: 'ru', name: 'Russian',                    nativeName: 'Русский'            },
  { code: 'it', name: 'Italian',                    nativeName: 'Italiano'           },
  { code: 'tr', name: 'Turkish',                    nativeName: 'Türkçe'             },
  { code: 'vi', name: 'Vietnamese',                 nativeName: 'Tiếng Việt'         },
];
