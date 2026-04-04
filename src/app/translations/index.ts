export type LanguageCode = 'en' | 'pt' | 'es' | 'fr' | 'de';

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
    'Family & Personal': string; Gifts: string; 'Gym & Sports': string; 'Debt Payments': string;
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
    Gifts: 'Gifts', 'Gym & Sports': 'Gym & Sports', 'Debt Payments': 'Debt Payments',
    Salary: 'Salary', Freelance: 'Freelance', Investment: 'Investment',
    Business: 'Business', Cashback: 'Cashback', RSUs: 'RSUs',
    'Holiday Allowance': 'Holiday Allowance', 'Meal Allowance': 'Meal Allowance', Other: 'Other',
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
    title: 'Gestor de despesas', subtitle: 'Controle suas receitas e despesas',
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
    Gifts: 'Presentes', 'Gym & Sports': 'Academia e esportes', 'Debt Payments': 'Dívidas',
    Salary: 'Salário', Freelance: 'Freelance', Investment: 'Investimento',
    Business: 'Negócios', Cashback: 'Cashback', RSUs: 'RSUs',
    'Holiday Allowance': 'Subsídio de Férias', 'Meal Allowance': 'Subsídio de Refeição', Other: 'Outros',
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
    Gifts: 'Regalos', 'Gym & Sports': 'Gimnasio y deportes', 'Debt Payments': 'Deudas',
    Salary: 'Salario', Freelance: 'Freelance', Investment: 'Inversión',
    Business: 'Negocio', Cashback: 'Devolución', RSUs: 'Acciones RSU',
    'Holiday Allowance': 'Subsidio vacacional', 'Meal Allowance': 'Subsidio de comida', Other: 'Otros',
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
    guestTitle: "Continuer en tant qu'invité",
    guestDesc: "Les données sont stockées uniquement sur cet appareil. Vous pouvez vous connecter avec Google plus tard — vos données seront migrées automatiquement.",
    guestButton: "Continuer en tant qu'invité",
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
    Gifts: 'Cadeaux', 'Gym & Sports': 'Gym & Sport', 'Debt Payments': 'Dettes',
    Salary: 'Salaire', Freelance: 'Freelance', Investment: 'Investissement',
    Business: 'Entreprise', Cashback: 'Remboursement', RSUs: 'Actions gratuites',
    'Holiday Allowance': 'Prime de vacances', 'Meal Allowance': 'Ticket restaurant', Other: 'Autre',
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
    Gifts: 'Geschenke', 'Gym & Sports': 'Fitnessstudio & Sport', 'Debt Payments': 'Schulden',
    Salary: 'Gehalt', Freelance: 'Freelance', Investment: 'Investition',
    Business: 'Geschäft', Cashback: 'Cashback', RSUs: 'Aktienoptionen',
    'Holiday Allowance': 'Urlaubsgeld', 'Meal Allowance': 'Essensgeld', Other: 'Sonstiges',
  },
};

export const translations: Record<LanguageCode, TranslationSchema> = {
  en, pt, es, fr, de,
};

export type Language = {
  code: LanguageCode;
  name: string;
  nativeName: string;
};

export const languages: Language[] = [
  { code: 'en', name: 'English',    nativeName: 'English'   },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'es', name: 'Spanish',    nativeName: 'Español'   },
  { code: 'fr', name: 'French',     nativeName: 'Français'  },
  { code: 'de', name: 'German',     nativeName: 'Deutsch'   },
];
