import React, { useState, useMemo, useEffect } from 'react';

// =================================================================================
// 📦 ایمپورت‌ها
// =================================================================================
import { createClient } from '@supabase/supabase-js';

import {
  LayoutDashboard,
  AlertTriangle,
  Snowflake,
  Lightbulb,
  CreditCard,
  Plus,
  X,
  CheckCircle,
  Menu,
  User,
  Sparkles,
  Loader2,
  Download,
} from 'lucide-react';

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// =================================================================================
// 🔧 تنظیمات اتصال (env vars)
// =================================================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const appPassword = import.meta.env.VITE_APP_PASSWORD || '';

// =================================================================================
// 🎨 Tailwind از CDN
// =================================================================================
const useTailwind = () => {
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.height = '100vh';
    document.body.style.overflow = 'hidden';

    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);
};

// =================================================================================
// 📡 Supabase Client
// =================================================================================
let supabase;
try {
  if (supabaseUrl && supabaseUrl.startsWith('http')) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (e) {
  console.error('Supabase init error:', e);
}

// =================================================================================
// 🤖 Gemini Helper
// =================================================================================
const callGeminiAI = async (prompt, isJson = false) => {
  if (!geminiApiKey) return alert('کلید هوش مصنوعی وارد نشده است.');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: isJson ? 'application/json' : 'text/plain',
          },
        }),
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) {
    console.error('AI Error:', error);
    return null;
  }
};

// =================================================================================
// ⬇️ CSV Export
// =================================================================================
const downloadCSV = (data, fileName) => {
  if (!data || !data.length) return alert('داده‌ای وجود ندارد.');
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map(
          (fieldName) =>
            `"${(row[fieldName] || '').toString().replace(/"/g, '""')}"`
        )
        .join(',')
    ),
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.csv`;
  link.click();
};

// =================================================================================
// 🧠 کامپوننت اصلی
// =================================================================================
export default function App() {
  useTailwind();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const [issues, setIssues] = useState([]);
  const [frozen, setFrozen] = useState([]);
  const [features, setFeatures] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [formData, setFormData] = useState({});
  const [aiLoading, setAiLoading] = useState(false);

  // ---------- login state ----------
  const [isAuthed, setIsAuthed] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!appPassword) return true; // اگر پسورد تعریف نشده، لاگین لازم نیست
    return localStorage.getItem('vardast_ops_authed') === '1';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!appPassword) {
      setIsAuthed(true);
      return;
    }
    if (passwordInput === appPassword) {
      setIsAuthed(true);
      localStorage.setItem('vardast_ops_authed', '1');
      setLoginError('');
    } else {
      setLoginError('رمز عبور اشتباه است.');
    }
  };

  // -------------------- Load data from Supabase --------------------
  useEffect(() => {
    if (!supabase) return;
    setIsConnected(true);

    const fetchAll = async () => {
      const { data: d1 } = await supabase
        .from('issues')
        .select('*')
        .order('id', { ascending: false });
      if (d1) setIssues(d1);

      const { data: d2 } = await supabase
        .from('frozen')
        .select('*')
        .order('id', { ascending: false });
      if (d2) setFrozen(d2);

      const { data: d3 } = await supabase
        .from('features')
        .select('*')
        .order('id', { ascending: false });
      if (d3) setFeatures(d3);

      const { data: d4 } = await supabase
        .from('refunds')
        .select('*')
        .order('id', { ascending: false });
      if (d4) setRefunds(d4);
    };
    fetchAll();

    const channel = supabase
      .channel('updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public' },
        (payload) => {
          const newRow = payload.new;
          if (payload.table === 'issues')
            setIssues((prev) => [newRow, ...prev]);
          if (payload.table === 'frozen')
            setFrozen((prev) => [newRow, ...prev]);
          if (payload.table === 'features')
            setFeatures((prev) => [newRow, ...prev]);
          if (payload.table === 'refunds')
            setRefunds((prev) => [newRow, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // -------------------- Analytics --------------------
  const analytics = useMemo(() => {
    const resolved = issues.filter((i) => i.status === 'حل‌شده').length;
    const total = issues.length;
    const ratio = total ? Math.round((resolved / total) * 100) : 0;
    return {
      solvedRatio: ratio,
      activeFrozen: frozen.filter((f) => f.status === 'فریز').length,
      refundCount: refunds.length,
    };
  }, [issues, frozen, refunds]);

  const chartData = useMemo(() => {
    const acc = {};
    issues.forEach((i) => {
      const d = i.created_at ? i.created_at.split(' ')[0] : 'نامشخص';
      acc[d] = (acc[d] || 0) + 1;
    });
    return Object.keys(acc).map((d) => ({ date: d, count: acc[d] }));
  }, [issues]);

  const pieChartData = useMemo(() => {
    const acc = {};
    refunds.forEach((r) => {
      const cat = r.category || 'سایر';
      acc[cat] = (acc[cat] || 0) + 1;
    });
    return Object.keys(acc).map((name) => ({ name, value: acc[name] }));
  }, [refunds]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // -------------------- AI Helpers --------------------
  const handleSmartAnalysis = async () => {
    if (!formData.desc_text) return alert('لطفاً شرح مشکل را وارد کنید.');
    setAiLoading(true);

    const prompt = `
      Analyze this technical support issue in Persian: "${formData.desc_text}"
      Return a JSON object with 3 keys:
      "module": (Choose one best fit: "پرامپت", "ویزارد", "دایرکت هوشمند", "کامنت هوشمند", "اتصال تلگرام", "اتصال اینستاگرام", "اتصال وبسایت", "ویجت", "سایر")
      "type": (Choose one best fit: "باگ فنی", "خطای کاربر", "کندی سیستم", "API", "طراحی UX", "سایر")
      "note": (A very short 1-sentence technical solution in Persian)
    `;

    const res = await callGeminiAI(prompt, true);
    setAiLoading(false);

    if (res) {
      try {
        const parsed = JSON.parse(res);
        setFormData((prev) => ({
          ...prev,
          module: parsed.module || prev.module || '',
          type: parsed.type || prev.type || '',
          technical_note: parsed.note || prev.technical_note || '',
        }));
      } catch (e) {
        console.error('AI Parse Error', e);
        alert('خطا در تحلیل هوشمند.');
      }
    }
  };

  const handleRefundAI = async () => {
    if (!formData.username && !formData.reason) {
      alert('نام کاربری و دلیل بازگشت وجه را وارد کنید.');
      return;
    }
    setAiLoading(true);
    const res = await callGeminiAI(
      `یک پیام کوتاه، رسمی و همدلانه به فارسی بنویس برای کاربر "${formData.username}" که درخواست بازگشت وجه داده به دلیل: "${formData.reason}". هدف: منصرف کردن محترمانه یا پذیرش درخواست.`,
      false
    );
    setAiLoading(false);
    if (res)
      setFormData((prev) => ({
        ...prev,
        suggestion: res.trim(),
      }));
  };

  const handleFeatureAI = async () => {
    if (!formData.desc_text) {
      alert('شرح فیچر را وارد کنید.');
      return;
    }
    setAiLoading(true);
    const res = await callGeminiAI(
      `برای متن زیر یک عنوان بسیار کوتاه (حداکثر ۴ کلمه) به فارسی بساز: "${formData.desc_text}"`,
      false
    );
    setAiLoading(false);
    if (res)
      setFormData((prev) => ({
        ...prev,
        title: res.trim(),
      }));
  };

  // -------------------- Save Form --------------------
  const handleSave = async (e) => {
    e.preventDefault();
    const today = new Date().toLocaleDateString('fa-IR');
    let table = '';
    let payload = {};

    if (modalType === 'issue') {
      // جدول issues:
      // username, created_at, desc_text, module, type, status, support,
      // subscription_status, resolved_at, technical_note, flag
      table = 'issues';
      payload = {
        username: formData.username,
        created_at: today,
        desc_text: formData.desc_text,
        module: formData.module,
        type: formData.type,
        status: formData.status || 'باز',
        support: formData.support,
        subscription_status: formData.subscription_status,
        resolved_at: formData.resolved_at,
        technical_note: formData.technical_note,
        flag: formData.flag || null,
      };
    } else if (modalType === 'frozen') {
      // جدول frozen:
      // username, frozen_at, desc_text, module, cause, status,
      // subscription_status, first_frozen_at, freeze_count, last_frozen_at,
      // resolve_status, note, flag
      table = 'frozen';
      payload = {
        username: formData.username,
        frozen_at: today,
        desc_text: formData.desc_text,
        module: formData.module,
        cause: formData.cause,
        status: formData.status || 'فریز',
        subscription_status: formData.subscription_status,
        first_frozen_at: formData.first_frozen_at,
        freeze_count: formData.freeze_count
          ? Number(formData.freeze_count)
          : null,
        last_frozen_at: formData.last_frozen_at,
        resolve_status: formData.resolve_status,
        note: formData.note,
        flag: formData.flag || null,
      };
    } else if (modalType === 'feature') {
      // جدول features:
      // username, created_at, desc_text, title, category, status,
      // repeat_count, importance, internal_note, flag
      table = 'features';
      payload = {
        username: formData.username,
        created_at: today,
        desc_text: formData.desc_text,
        title: formData.title,
        category: formData.category,
        status: formData.status || 'بررسی نشده',
        repeat_count: formData.repeat_count
          ? Number(formData.repeat_count)
          : null,
        importance: formData.importance
          ? Number(formData.importance)
          : null,
        internal_note: formData.internal_note,
        flag: formData.flag || null,
      };
    } else if (modalType === 'refund') {
      // جدول refunds:
      // username, requested_at, reason, duration, category, action,
      // suggestion, can_return, sales_source, ops_note, flag
      table = 'refunds';
      payload = {
        username: formData.username,
        requested_at: today,
        reason: formData.reason,
        duration: formData.duration,
        category: formData.category,
        action: formData.action || 'در بررسی',
        suggestion: formData.suggestion,
        can_return: formData.can_return,
        sales_source: formData.sales_source,
        ops_note: formData.ops_note,
        flag: formData.flag || null,
      };
    }

    if (supabase) {
      const { error } = await supabase.from(table).insert([payload]);
      if (error) {
        alert('خطا در ذخیره دیتابیس: ' + error.message);
      } else {
        setIsModalOpen(false);
      }
    } else {
      alert('دیتابیس متصل نیست.');
    }
  };

  const openModal = (t) => {
    setModalType(t);
    setFormData({
      username: '',
      subscription_status: '',
      desc_text: '',
      module: '',
      type: '',
      status: '',
      support: '',
      resolved_at: '',
      technical_note: '',
      cause: '',
      first_frozen_at: '',
      freeze_count: '',
      last_frozen_at: '',
      resolve_status: '',
      note: '',
      title: '',
      category: '',
      repeat_count: '',
      importance: '',
      internal_note: '',
      reason: '',
      duration: '',
      action: '',
      suggestion: '',
      can_return: '',
      sales_source: '',
      ops_note: '',
      flag: '',
    });
    setIsModalOpen(true);
  };

  // -------------------- User Profile Component --------------------
  const UserProfile = () => {
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    const allUsers = useMemo(() => {
      const u = new Set(
        [...issues, ...frozen, ...features, ...refunds].map((x) => x.username)
      );
      return Array.from(u);
    }, [issues, frozen, features, refunds]);

    const handleSearch = (val) => {
      setSearch(val);
      if (val) {
        setSuggestions(
          allUsers.filter(
            (u) => u && u.toLowerCase().includes(val.toLowerCase())
          )
        );
      } else {
        setSuggestions([]);
      }
    };

    const allRecords = [
      ...issues.map((x) => ({ ...x, src: 'issue', date: x.created_at })),
      ...frozen.map((x) => ({ ...x, src: 'frozen', date: x.frozen_at })),
      ...features.map((x) => ({ ...x, src: 'feature', date: x.created_at })),
      ...refunds.map((x) => ({ ...x, src: 'refund', date: x.requested_at })),
    ].filter((r) => r.username === search);

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 text-center relative">
          <input
            placeholder="جستجوی نام کاربری..."
            value={search}
            className="border p-3 rounded-xl w-1/2 text-center outline-none focus:border-blue-500"
            onChange={(e) => handleSearch(e.target.value)}
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-1/4 right-1/4 bg-white shadow-xl rounded-xl mt-1 max-h-48 overflow-auto border border-gray-100 z-50 text-right">
              {suggestions.map((u) => (
                <div
                  key={u}
                  onClick={() => {
                    setSearch(u);
                    setSuggestions([]);
                  }}
                  className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                >
                  {u}
                </div>
              ))}
            </div>
          )}
        </div>
        {search && allRecords.length > 0 ? (
          <div className="space-y-4">
            {allRecords.map((r, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-lg shadow-sm border-r-4 border-blue-500 text-right relative"
              >
                <div className="flex justify-between text-xs text-gray-500.mb-1">
                  <span>{r.date}</span>
                  <span>
                    {r.src === 'issue'
                      ? 'مشکل فنی'
                      : r.src === 'frozen'
                      ? 'فریز'
                      : r.src === 'feature'
                      ? 'فیچر'
                      : 'بازگشت وجه'}
                  </span>
                </div>
                <div className="font-bold mb-2">
                  {r.desc_text || r.reason || r.title}
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {r.status || r.action}
                </span>
              </div>
            ))}
          </div>
        ) : (
          search && (
            <div className="text-center text-gray-400">سابقه‌ای یافت نشد</div>
          )
        )}
      </div>
    );
  };

  // =================================================================================
  // 🔐 Login Gate
  // =================================================================================
  if (appPassword && !isAuthed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-100"
        dir="rtl"
      >
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-sm border border-slate-200">
          <h1 className="text-xl font-bold mb-4 text-center text-slate-800">
            ورود به داشبورد پشتیبانی وردست
          </h1>
          <p className="text-xs text-slate-500 mb-4 text-center">
            لطفاً رمز عبور داخلی تیم را وارد کنید.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="رمز عبور"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            {loginError && (
              <div className="text-xs text-red-500 text-center">
                {loginError}
              </div>
            )}
            <button
              type="submit"
              className="w-full.bg-blue-600 text-white rounded-xl py-2 text-sm font-bold hover:bg-blue-700 transition"
            >
              ورود
            </button>
          </form>
          <div className="mt-4 text-[10px] text-center text-slate-400">
            اگر رمز را ندارید، از مدیر تیم بخواهید آن را در اختیار شما قرار
            دهد.
          </div>
        </div>
      </div>
    );
  }

  // =================================================================================
  // 🖥️ Render Layout اصلی
  // =================================================================================
  return (
    <div
      className="w-full h-screen bg-gray-50 text-right font-sans flex overflow-hidden"
      dir="rtl"
    >
      {/* سایدبار */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } h-full bg-white border-l flex flex-col transition-all duration-300 shadow-lg z-20 shrink-0`}
      >
        <div className="p-5 flex justify-between.items-center border-b">
          {isSidebarOpen && (
            <span className="font-bold text-blue-700 text-lg">وردست</span>
          )}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Menu size={24} />
          </button>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
            { id: 'issues', label: 'مشکلات فنی', icon: AlertTriangle },
            { id: 'frozen', label: 'اکانت فریز', icon: Snowflake },
            { id: 'features', label: 'درخواست فیچر', icon: Lightbulb },
            { id: 'refunds', label: 'بازگشت وجه', icon: CreditCard },
            { id: 'profile', label: 'پروفایل کاربر', icon: User },
          ].map((i) => (
            <button
              key={i.id}
              onClick={() => setActiveTab(i.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeTab === i.id
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <i.icon size={20} /> {isSidebarOpen && i.label}
            </button>
          ))}
        </div>
        <div className="p-4 text-xs text-center text-gray-400 border-t bg-gray-50">
          {isConnected ? (
            <span className="text-green-600 flex justify-center gap-1 font-bold">
              <CheckCircle size={14} /> متصل
            </span>
          ) : (
            'آفلاین'
          )}
        </div>
      </div>

      {/* محتوای اصلی */}
      <div className="flex-1 h-full overflow-y-auto p-8 relative bg-gray-50">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between.items-center">
              <h2 className="text-2xl.font-bold text-gray-800">
                داشبورد مدیریتی
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <span className="text-sm text-gray-500 block mb-2">
                  نرخ حل مشکلات
                </span>
                <h3 className="text-3xl font-bold text-green-600">
                  %{analytics.solvedRatio}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <span className="text-sm text-gray-500 block mb-2">
                  اکانت‌های فریز فعال
                </span>
                <h3 className="text-3xl font-bold text-blue-600">
                  {analytics.activeFrozen}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <span className="text-sm text-gray-500 block mb-2">
                  تعداد بازگشت وجه
                </span>
                <h3 className="text-3xl font-bold text-red-500">
                  {analytics.refundCount}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border.border-gray-100">
                <span className="text-sm text-gray-500 block mb-2">
                  کل تیکت‌ها
                </span>
                <h3 className="text-3xl font-bold text-gray-700">
                  {issues.length}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-80">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <h4 className="font-bold mb-4 text-gray-700">
                  روند ثبت مشکلات
                </h4>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <h4 className="font-bold mb-4 text-gray-700">
                  دلایل بازگشت وجه
                </h4>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                      >
                        {pieChartData.map((e, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && <UserProfile />}

        {['issues', 'frozen', 'features', 'refunds'].includes(activeTab) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[70vh] max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-xl text-gray-800">لیست داده‌ها</h2>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    downloadCSV(
                      activeTab === 'issues'
                        ? issues
                        : activeTab === 'frozen'
                        ? frozen
                        : activeTab === 'features'
                        ? features
                        : refunds,
                      activeTab
                    )
                  }
                  className="border border-gray-200 px-4 py-2 rounded-xl text-sm flex gap-2 items-center hover:bg-gray-50 transition"
                >
                  <Download size={18} /> خروجی اکسل
                </button>
                <button
                  onClick={() =>
                    openModal(
                      activeTab === 'issues'
                        ? 'issue'
                        : activeTab === 'frozen'
                        ? 'frozen'
                        : activeTab === 'features'
                        ? 'feature'
                        : 'refund'
                    )
                  }
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm flex gap-2 items-center hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
                >
                  <Plus size={18} /> ثبت جدید
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="p-4">تاریخ</th>
                    <th className="p-4">کاربر</th>
                    <th className="p-4">توضیحات</th>
                    <th className="p-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'issues'
                    ? issues
                    : activeTab === 'frozen'
                    ? frozen
                    : activeTab === 'features'
                    ? features
                    : refunds
                  ).map((row) => (
                    <tr
                      key={row.id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="p-4 text-gray-500">
                        {row.created_at || row.frozen_at || row.requested_at}
                      </td>
                      <td className="p-4 font-bold text-gray-800">
                        {row.username}
                      </td>
                      <td
                        className="p-4 max-w-md truncate text-gray-600"
                        title={row.desc_text || row.reason || row.title}
                      >
                        {row.desc_text || row.reason || row.title}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            row.status === 'حل‌شده' ||
                            row.status === 'انجام شد'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {row.status || row.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* مودال */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all">
            <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">ثبت مورد جدید</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              {/* فیلد مشترک: نام کاربری */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">نام کاربری</label>
                <input
                  required
                  value={formData.username || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full border p-3 rounded-xl outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* =========================
                  تب: مشکلات فنی (issues)
                 ========================= */}
              {modalType === 'issue' && (
                <>
                  {/* وضعیت اشتراک + پشتیبان */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        وضعیت اشتراک
                      </label>
                      <select
                        value={formData.subscription_status || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subscription_status: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      >
                        <option value="">انتخاب...</option>
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Expired">Expired</option>
                        <option value="Trial">Trial</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        پشتیبان مسئول
                      </label>
                      <input
                        value={formData.support || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            support: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      />
                    </div>
                  </div>

                  {/* شرح مشکل + دکمه AI */}
                  <div className="relative space-y-1">
                    <label className="text-xs text-gray-500">شرح مشکل</label>
                    <textarea
                      rows="3"
                      value={formData.desc_text || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          desc_text: e.target.value,
                        })
                      }
                      className="w-full border p-3 rounded-xl outline-none focus:border-blue-500 transition"
                    ></textarea>
                    <button
                      type="button"
                      onClick={handleSmartAnalysis}
                      className="absolute bottom-3 left-3 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs px-3 py-1.5 rounded-lg flex gap-1 items-center transition"
                    >
                      {aiLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Sparkles size={14} />
                      )}{' '}
                      تحلیل هوشمند
                    </button>
                  </div>

                  {/* ماژول + نوع مشکل */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">ماژول</label>
                      <select
                        value={formData.module || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            module: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      >
                        <option value="">انتخاب...</option>
                        <option value="پرامپت">پرامپت</option>
                        <option value="ویزارد">ویزارد</option>
                        <option value="دایرکت هوشمند">دایرکت هوشمند</option>
                        <option value="کامنت هوشمند">کامنت هوشمند</option>
                        <option value="اتصال تلگرام">اتصال تلگرام</option>
                        <option value="اتصال اینستاگرام">اتصال اینستاگرام</option>
                        <option value="اتصال وبسایت">اتصال وبسایت</option>
                        <option value="ویجت">ویجت</option>
                        <option value="سایر">سایر</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">نوع مشکل</label>
                      <select
                        value={formData.type || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      >
                        <option value="">انتخاب...</option>
                        <option value="باگ فنی">باگ فنی</option>
                        <option value="خطای کاربر">خطای کاربر</option>
                        <option value="کندی سیستم">کندی سیستم</option>
                        <option value="API">API</option>
                        <option value="طراحی UX">طراحی UX</option>
                        <option value="سایر">سایر</option>
                      </select>
                    </div>
                  </div>

                  {/* وضعیت حل + تاریخ حل */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        وضعیت حل
                      </label>
                      <select
                        value={formData.status || 'باز'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      >
                        <option value="باز">باز</option>
                        <option value="در حال بررسی">در حال بررسی</option>
                        <option value="حل‌شده">حل‌شده</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        تاریخ حل (در صورت وجود)
                      </label>
                      <input
                        placeholder="مثلاً 1404/08/25"
                        value={formData.resolved_at || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            resolved_at: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      />
                    </div>
                  </div>

                  {/* یادداشت فنی */}
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      یادداشت فنی / علت نهایی
                    </label>
                    <textarea
                      rows="2"
                      value={formData.technical_note || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          technical_note: e.target.value,
                        })
                      }
                      className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                    ></textarea>
                  </div>
                </>
              )}

              {/* =========================
                  تب: اکانت فریز (frozen)
                 ========================= */}
              {modalType === 'frozen' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        وضعیت اشتراک
                      </label>
                      <select
                        value={formData.subscription_status || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subscription_status: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      >
                        <option value="">انتخاب...</option>
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        ماژول / بخش
                      </label>
                      <input
                        value={formData.module || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            module: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      علت اصلی فریز
                    </label>
                    <input
                      value={formData.cause || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, cause: e.target.value })
                      }
                      className="w-full border p-3 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      توضیحات تکمیلی
                    </label>
                    <textarea
                      value={formData.desc_text || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          desc_text: e.target.value,
                        })
                      }
                      className="w-full border p-3 rounded-xl"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        تاریخ اولین فریز
                      </label>
                      <input
                        placeholder="مثلاً 1404/08/10"
                        value={formData.first_frozen_at || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            first_frozen_at: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl.text-sm bg-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        تعداد فریز
                      </label>
                      <input
                        type="number"
                        value={formData.freeze_count || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            freeze_count: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        آخرین تاریخ فریز
                      </label>
                      <input
                        placeholder="مثلاً 1404/08/21"
                        value={formData.last_frozen_at || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            last_frozen_at: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        وضعیت فعلی
                      </label>
                      <select
                        value={formData.status || 'فریز'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      >
                        <option value="فریز">فریز</option>
                        <option value="رفع شده">رفع شده</option>
                        <option value="در حال بررسی">در حال بررسی</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        وضعیت رفع مشکل
                      </label>
                      <input
                        value={formData.resolve_status || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            resolve_status: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      یادداشت / نتیجه نهایی
                    </label>
                    <textarea
                      rows="2"
                      value={formData.note || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          note: e.target.value,
                        })
                      }
                      className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* =========================
                  تب: فیچر ریکوئست (features)
                 ========================= */}
              {modalType === 'feature' && (
                <div className="space-y-3">
                  <textarea
                    placeholder="شرح فیچر..."
                    value={formData.desc_text || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        desc_text: e.target.value,
                      })
                    }
                    className="w-full border p-3 rounded-xl"
                  ></textarea>

                  <button
                    type="button"
                    onClick={handleFeatureAI}
                    className="bg-purple-50 text-purple-600 text-xs w-full py-2 rounded-xl flex justify-center gap-1"
                  >
                    <Sparkles size={14} /> پیشنهاد عنوان
                  </button>

                  <input
                    placeholder="عنوان فیچر"
                    value={formData.title || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        title: e.target.value,
                      })
                    }
                    className="w-full border p-3 rounded-xl"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        دسته‌بندی درخواست
                      </label>
                      <input
                        value={formData.category || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            category: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        وضعیت بررسی
                      </label>
                      <select
                        value={formData.status || 'بررسی نشده'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      >
                        <option value="بررسی نشده">بررسی نشده</option>
                        <option value="در تحلیل">در تحلیل</option>
                        <option value="در توسعه">در توسعه</option>
                        <option value="انجام شد">انجام شد</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        تکرار (Auto)
                      </label>
                      <input
                        type="number"
                        value={formData.repeat_count || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            repeat_count: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        اهمیت (Auto)
                      </label>
                      <input
                        type="number"
                        value={formData.importance || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            importance: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      یادداشت داخلی
                    </label>
                    <textarea
                      rows="2"
                      value={formData.internal_note || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          internal_note: e.target.value,
                        })
                      }
                      className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* =========================
                  تب: بازگشت وجه (refunds)
                 ========================= */}
              {modalType === 'refund' && (
                <div className="space-y-3">
                  <textarea
                    placeholder="دلیل درخواست بازگشت وجه..."
                    rows="3"
                    value={formData.reason || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    className="w-full border p-3 rounded-xl"
                  ></textarea>

                  <button
                    type="button"
                    onClick={handleRefundAI}
                    className="bg-purple-50 text-purple-600 text-xs w-full py-2 rounded-xl flex.justify-center gap-1"
                  >
                    <Sparkles size={14} /> پیشنهاد متن پاسخ به کاربر
                  </button>

                  {formData.suggestion && (
                    <div className="text-xs bg-purple-50 p-3 rounded-xl border border-purple-100 text-purple-800.leading-relaxed">
                      {formData.suggestion}
                    </div>
                  )}

                  <input
                    placeholder="مدت استفاده قبل از درخواست (مثلاً ۷ روز)"
                    value={formData.duration || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: e.target.value,
                      })
                    }
                    className="w-full border p-3 rounded-xl"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        دسته‌بندی دلیل
                      </label>
                      <input
                        value={formData.category || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            category: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl.text-sm bg-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        اقدام انجام‌شده
                      </label>
                      <select
                        value={formData.action || 'در بررسی'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            action: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      >
                        <option value="در بررسی">در بررسی</option>
                        <option value="بازپرداخت شد">بازپرداخت شد</option>
                        <option value="رد شد">رد شد</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        منبع فروش
                      </label>
                      <input
                        placeholder="مثلاً پیج، سایت، تماس تلفنی..."
                        value={formData.sales_source || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sales_source: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        قابلیت بازگشت در آینده
                      </label>
                      <select
                        value={formData.can_return || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            can_return: e.target.value,
                          })
                        }
                        className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                      >
                        <option value="">نامشخص</option>
                        <option value="بله">بله</option>
                        <option value="خیر">خیر</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      پیشنهاد اصلاحی از دید ساپورت
                    </label>
                    <textarea
                      rows="2"
                      value={formData.ops_note || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ops_note: e.target.value,
                        })
                      }
                      className="w-full border p-3 rounded-xl.text-sm bg-white outline-none"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* =========================
                  فیلد مشترک فلگ برای همه تب‌ها
                 ========================= */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">فلگ گزارش</label>
                <select
                  value={formData.flag || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, flag: e.target.value })
                  }
                  className="w-full border p-3 rounded-xl text-sm bg-white outline-none"
                >
                  <option value="">بدون فلگ</option>
                  <option value="پیگیری مهم">پیگیری مهم</option>
                  <option value="پیگیری فوری">پیگیری فوری</option>
                </select>
                <p className="text-[10px] text-gray-400">
                  از فلگ برای علامت‌گذاری تیکت‌های حساس یا نیازمند پیگیری
                  مجدد استفاده کنید.
                </p>
              </div>

              {/* دکمه ذخیره */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 mt-2"
              >
                ذخیره اطلاعات
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
