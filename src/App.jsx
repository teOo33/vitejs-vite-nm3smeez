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
  Menu,
  User,
  Sparkles,
  Loader2,
  Download,
  Phone,
  Instagram,
  Search,
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
// 📋 فرم اولیه داده‌ها
// =================================================================================
const INITIAL_FORM_DATA = {
  username: '',
  phone_number: '',
  instagram_username: '',
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
};

// =================================================================================
// 🎨 Tailwind از CDN
// =================================================================================
const useTailwind = () => {
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.height = '100vh';
    document.body.style.width = '100vw';
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
  const [isSidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  
  const [isConnected, setIsConnected] = useState(false);

  const [issues, setIssues] = useState([]);
  const [frozen, setFrozen] = useState([]);
  const [features, setFeatures] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [editingId, setEditingId] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ---------- login state ----------
  const [isAuthed, setIsAuthed] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!appPassword) return true;
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
      const { data: d1 } = await supabase.from('issues').select('*').order('id', { ascending: false });
      if (d1) setIssues(d1);

      const { data: d2 } = await supabase.from('frozen').select('*').order('id', { ascending: false });
      if (d2) setFrozen(d2);

      const { data: d3 } = await supabase.from('features').select('*').order('id', { ascending: false });
      if (d3) setFeatures(d3);

      const { data: d4 } = await supabase.from('refunds').select('*').order('id', { ascending: false });
      if (d4) setRefunds(d4);
    };
    fetchAll();

    const channel = supabase
      .channel('updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public' }, (payload) => {
          const newRow = payload.new;
          if (payload.table === 'issues') setIssues((prev) => [newRow, ...prev]);
          if (payload.table === 'frozen') setFrozen((prev) => [newRow, ...prev]);
          if (payload.table === 'features') setFeatures((prev) => [newRow, ...prev]);
          if (payload.table === 'refunds') setRefunds((prev) => [newRow, ...prev]);
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

  const COLORS = ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48'];

  // -------------------- AI Helpers --------------------
  const handleSmartAnalysis = async () => {
    if (!formData.desc_text) return alert('لطفاً شرح مشکل را وارد کنید.');
    setAiLoading(true);
    const prompt = `Analyze issue in Persian: "${formData.desc_text}". Return JSON: { "module": "...", "type": "...", "note": "..." }`;
    const res = await callGeminiAI(prompt, true);
    setAiLoading(false);
    if (res) {
      try {
        const parsed = JSON.parse(res);
        setFormData((prev) => ({ ...prev, module: parsed.module || prev.module || '', type: parsed.type || prev.type || '', technical_note: parsed.note || prev.technical_note || '' }));
      } catch (e) { alert('خطا در تحلیل هوشمند.'); }
    }
  };

  const handleRefundAI = async () => {
    if (!formData.username && !formData.reason) return alert('اطلاعات ناقص است.');
    setAiLoading(true);
    const res = await callGeminiAI(`پیام محترمانه فارسی برای "${formData.username}" جهت بازگشت وجه به دلیل: "${formData.reason}"`, false);
    setAiLoading(false);
    if (res) setFormData((prev) => ({ ...prev, suggestion: res.trim() }));
  };

  const handleFeatureAI = async () => {
    if (!formData.desc_text) return alert('شرح فیچر ناقص است.');
    setAiLoading(true);
    const res = await callGeminiAI(`عنوان کوتاه فارسی برای: "${formData.desc_text}"`, false);
    setAiLoading(false);
    if (res) setFormData((prev) => ({ ...prev, title: res.trim() }));
  };

  // -------------------- Save Form (Insert / Update) --------------------
  const handleSave = async (e) => {
    e.preventDefault();
    const today = new Date().toLocaleDateString('fa-IR');
    const isEdit = !!editingId;
    let table = '';
    const commonFields = {
      username: formData.username,
      phone_number: formData.phone_number,
      instagram_username: formData.instagram_username,
      flag: formData.flag || null,
    };
    let payload = {};

    if (modalType === 'issue') {
      table = 'issues';
      payload = {
        ...commonFields,
        desc_text: formData.desc_text,
        module: formData.module,
        type: formData.type,
        status: formData.status || 'باز', // پیش‌فرض: باز
        support: formData.support,
        subscription_status: formData.subscription_status,
        resolved_at: formData.resolved_at,
        technical_note: formData.technical_note,
      };
      if (!isEdit) payload.created_at = today;
    } else if (modalType === 'frozen') {
      table = 'frozen';
      payload = {
        ...commonFields,
        desc_text: formData.desc_text,
        module: formData.module,
        cause: formData.cause,
        status: formData.status || 'فریز', // پیش‌فرض: فریز
        subscription_status: formData.subscription_status,
        first_frozen_at: formData.first_frozen_at,
        freeze_count: formData.freeze_count ? Number(formData.freeze_count) : null,
        last_frozen_at: formData.last_frozen_at,
        resolve_status: formData.resolve_status,
        note: formData.note,
      };
      if (!isEdit) payload.frozen_at = today;
    } else if (modalType === 'feature') {
      table = 'features';
      payload = {
        ...commonFields,
        desc_text: formData.desc_text,
        title: formData.title,
        category: formData.category,
        status: formData.status || 'بررسی نشده', // پیش‌فرض: بررسی نشده
        repeat_count: formData.repeat_count ? Number(formData.repeat_count) : null,
        importance: formData.importance ? Number(formData.importance) : null,
        internal_note: formData.internal_note,
      };
      if (!isEdit) payload.created_at = today;
    } else if (modalType === 'refund') {
      table = 'refunds';
      payload = {
        ...commonFields,
        reason: formData.reason,
        duration: formData.duration,
        category: formData.category,
        action: formData.action || 'در حال بررسی', // پیش‌فرض: در حال بررسی
        suggestion: formData.suggestion,
        can_return: formData.can_return,
        sales_source: formData.sales_source,
        ops_note: formData.ops_note,
      };
      if (!isEdit) payload.requested_at = today;
    }

    if (!supabase) return alert('دیتابیس متصل نیست.');
    let error = null;

    if (isEdit) {
      const res = await supabase.from(table).update(payload).eq('id', editingId);
      error = res.error;
      if (!error) {
        const updater = (prev) => prev.map((r) => (r.id === editingId ? { ...r, ...payload } : r));
        if (table === 'issues') setIssues(updater);
        if (table === 'frozen') setFrozen(updater);
        if (table === 'features') setFeatures(updater);
        if (table === 'refunds') setRefunds(updater);
      }
    } else {
      const res = await supabase.from(table).insert([payload]);
      error = res.error;
    }
    if (error) alert('خطا: ' + error.message);
    else { setIsModalOpen(false); setEditingId(null); setFormData({ ...INITIAL_FORM_DATA }); }
  };

  const openModal = (t, record = null) => {
    setModalType(t);
    if (record) {
      setEditingId(record.id);
      setFormData({ ...INITIAL_FORM_DATA, ...record });
    } else {
      setEditingId(null);
      setFormData({ ...INITIAL_FORM_DATA });
    }
    setIsModalOpen(true);
  };

  // -------------------- User Profile --------------------
  const UserProfile = () => {
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedUserStats, setSelectedUserStats] = useState(null);

    const userMap = useMemo(() => {
        const map = {};
        [...issues, ...frozen, ...features, ...refunds].forEach(r => {
            if (!r.username) return;
            if (!map[r.username]) {
                map[r.username] = { username: r.username, phone: r.phone_number || '', insta: r.instagram_username || '' };
            } else {
                if (r.phone_number) map[r.username].phone = r.phone_number;
                if (r.instagram_username) map[r.username].insta = r.instagram_username;
            }
        });
        return map;
    }, [issues, frozen, features, refunds]);

    const handleSearch = (val) => {
      setSearch(val);
      if (val) {
        const lowerVal = val.toLowerCase();
        setSuggestions(Object.values(userMap).filter(u => u.username.toLowerCase().includes(lowerVal) || (u.phone && u.phone.includes(lowerVal)) || (u.insta && u.insta.toLowerCase().includes(lowerVal))));
      } else { setSuggestions([]); }
    };

    useEffect(() => {
        if(userMap[search]) setSelectedUserStats(userMap[search]);
        else setSelectedUserStats(null);
    }, [search, userMap]);

    const allRecords = [...issues.map(x=>({...x,src:'issue',date:x.created_at})),...frozen.map(x=>({...x,src:'frozen',date:x.frozen_at})),...features.map(x=>({...x,src:'feature',date:x.created_at})),...refunds.map(x=>({...x,src:'refund',date:x.requested_at}))].filter(r=>r.username===search);
    allRecords.sort((a,b) => (b.date||'').localeCompare(a.date||''));

    return (
      <div className="w-full max-w-5xl ml-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 relative z-20">
          <h2 className="font-semibold text-gray-800 mb-2">پروفایل کاربر</h2>
          <div className="relative">
            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden"><div className="pl-3 pr-4 text-gray-400"><Search size={18}/></div><input placeholder="جستجو (نام، تلفن، اینستاگرام)..." value={search} className="w-full p-3 bg-transparent outline-none text-sm" onChange={(e) => handleSearch(e.target.value)} /></div>
            {suggestions.length > 0 && (
              <div className="absolute top-full right-0 left-0 bg-white shadow-xl rounded-xl mt-1 max-h-60 overflow-auto border border-gray-100 z-50 text-right">
                {suggestions.map((u) => (
                  <div key={u.username} onClick={() => { setSearch(u.username); setSuggestions([]); }} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 text-sm flex flex-col"><span className="font-semibold text-gray-700">{u.username}</span><div className="flex gap-3 text-xs text-gray-400 mt-1">{u.phone && <span>📞 {u.phone}</span>}{u.insta && <span>📸 {u.insta}</span>}</div></div>
                ))}
              </div>
            )}
          </div>
        </div>
        {selectedUserStats && (
            <div className="bg-gradient-to-l from-blue-50 to-white p-6 rounded-2xl shadow-sm border border-blue-100 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner"><User size={32} /></div>
                <div className="flex-1 text-center sm:text-right">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedUserStats.username}</h2>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                        {selectedUserStats.phone && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm text-gray-600 shadow-sm"><Phone size={14} className="text-emerald-500"/>{selectedUserStats.phone}</span>}
                        {selectedUserStats.insta && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm text-gray-600 shadow-sm dir-ltr"><Instagram size={14} className="text-rose-500"/>{selectedUserStats.insta}@</span>}
                    </div>
                </div>
            </div>
        )}
        {search && allRecords.length > 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-sm text-slate-800 mb-4">تاریخچه فعالیت‌ها</h3>
            <div className="relative pr-6">
              <div className="absolute top-2 bottom-2 right-2 w-px bg-slate-200" />
              <div className="space-y-5">
                {allRecords.map((r, i) => (
                  <div key={i} className="relative flex gap-4 items-start">
                    <div className="absolute right-0 top-3 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
                    <div className="mr-6 flex-1 bg-slate-50/60 border border-slate-100 rounded-2xl p-4 hover:bg-white hover:shadow-sm transition">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span>{r.date}</span>
                          <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px]">{r.src === 'issue' ? 'مشکل فنی' : r.src === 'frozen' ? 'اکانت فریز' : r.src === 'feature' ? 'درخواست فیچر' : 'بازگشت وجه'}</span>
                          {r.flag && <span className={`px-2 py-0.5 rounded-full text-[10px] border ${r.flag === 'پیگیری فوری' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{r.flag}</span>}
                        </div>
                        <button type="button" onClick={() => openModal(r.src === 'issue' ? 'issue' : r.src === 'frozen' ? 'frozen' : r.src === 'feature' ? 'feature' : 'refund', r)} className="text-[11px] px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100 bg-white text-slate-700">ویرایش</button>
                      </div>
                      <div className="font-semibold text-sm text-slate-800 mb-1">{r.desc_text || r.reason || r.title}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500"><span className="px-2 py-0.5 rounded-full bg-white border border-slate-200">وضعیت: {r.status || r.action || 'نامشخص'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : search && <div className="text-center text-gray-400 text-sm mt-4">سابقه‌ای یافت نشد.</div>}
      </div>
    );
  };

  if (appPassword && !isAuthed) return <div className="fixed inset-0 w-full h-full grid place-items-center bg-gradient-to-l from-slate-100 via-slate-50 to-white" dir="rtl"><div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md border border-slate-100 relative overflow-hidden mx-4"><h1 className="text-xl font-extrabold mb-3 text-center text-slate-800">ورود به داشبورد پشتیبانی</h1><form onSubmit={handleLogin} className="space-y-4"><input type="password" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-slate-50/60" placeholder="رمز عبور" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />{loginError && <div className="text-xs text-red-500 text-center">{loginError}</div>}<button type="submit" className="w-full bg-gradient-to-l from-blue-600 to-sky-500 text-white rounded-xl py-2.5 text-sm font-bold shadow-md">ورود</button></form></div></div>;

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-l from-slate-100 via-slate-50 to-white text-right font-sans flex overflow-hidden" dir="rtl">
      {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm transition-opacity" />}
      <aside className={`fixed inset-y-0 right-0 z-40 h-full bg-white/95 border-l border-slate-100 flex flex-col transition-transform duration-300 shadow-lg backdrop-blur md:relative ${isSidebarOpen ? 'translate-x-0 w-64' : 'translate-x-full md:translate-x-0 md:w-20'}`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
           <div className={`${isSidebarOpen ? 'block' : 'hidden md:hidden'} flex flex-col`}><span className="font-extrabold text-blue-700 text-lg leading-none">وردست</span><span className="text-[10px] text-slate-400 mt-1">داشبورد تیم پشتیبانی</span></div>
           <div className={`hidden md:flex flex-col ${!isSidebarOpen && 'md:hidden'}`}><span className="font-extrabold text-blue-700 text-lg leading-none">وردست</span></div>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 mr-auto">{isSidebarOpen ? <X size={20} className="md:hidden"/> : <Menu size={20} />}<Menu size={20} className="hidden md:block"/></button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">{[{ id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard }, { id: 'issues', label: 'مشکلات فنی', icon: AlertTriangle }, { id: 'frozen', label: 'اکانت فریز', icon: Snowflake }, { id: 'features', label: 'درخواست فیچر', icon: Lightbulb }, { id: 'refunds', label: 'بازگشت وجه', icon: CreditCard }, { id: 'profile', label: 'پروفایل کاربر', icon: User }].map((i) => (<button key={i.id} onClick={() => { setActiveTab(i.id); if(window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap overflow-hidden ${activeTab === i.id ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}><i.icon size={18} className="shrink-0" /><span className={`${!isSidebarOpen && 'md:hidden'} transition-opacity duration-200`}>{i.label}</span></button>))}</nav>
        <div className="p-4 text-xs text-center text-gray-400 border-t bg-slate-50/80">{isConnected ? <span className="text-emerald-600 flex justify-center gap-1 font-bold items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className={`${!isSidebarOpen && 'md:hidden'}`}>متصل</span></span> : 'Off'}</div>
      </aside>

      <main className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden px-4 sm:px-8 lg:px-10 py-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-600"><Menu size={20} /></button><div className="flex flex-col gap-1"><h1 className="text-lg sm:text-2xl font-extrabold text-slate-800">داشبورد پشتیبانی</h1></div></div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400"><span className="px-2 py-1 rounded-full bg-white border border-slate-100 shadow-sm">امروز {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}</span></div>
        </header>

        {activeTab === 'dashboard' && (
          <section className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1 hover:shadow-md transition"><span className="text-xs text-gray-500">نرخ حل مشکلات</span><div className="flex items-end gap-2"><h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600">%{analytics.solvedRatio}</h3><span className="text-[10px] sm:text-[11px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">بسته شده</span></div></div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1 hover:shadow-md transition"><span className="text-xs text-gray-500">اکانت‌های فریز</span><h3 className="text-2xl sm:text-3xl font-extrabold text-blue-600">{analytics.activeFrozen}</h3></div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1 hover:shadow-md transition"><span className="text-xs text-gray-500">بازگشت وجه</span><h3 className="text-2xl sm:text-3xl font-extrabold text-rose-500">{analytics.refundCount}</h3></div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1 hover:shadow-md transition"><span className="text-xs text-gray-500">کل تیکت‌ها</span><h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{issues.length}</h3></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 min-h-[280px]">
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[300px]"><h4 className="font-bold text-gray-700 text-sm mb-4">روند ثبت مشکلات</h4><div className="flex-1 w-full h-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div></div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[300px]"><h4 className="font-bold text-gray-700 text-sm mb-4">دلایل بازگشت وجه</h4><div className="flex-1 w-full h-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieChartData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>{pieChartData.map((e, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: '11px' }} /></PieChart></ResponsiveContainer></div></div>
            </div>
          </section>
        )}

        {activeTab === 'profile' && <UserProfile />}

        {['issues', 'frozen', 'features', 'refunds'].includes(activeTab) && (
          <section className="mt-4">
            <div className="bg-white/95 rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 min-h-[60vh]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                <div className="flex flex-col gap-1"><h2 className="font-bold text-lg text-gray-800">{activeTab === 'issues' ? 'مشکلات فنی' : activeTab === 'frozen' ? 'اکانت فریز' : activeTab === 'features' ? 'درخواست فیچر' : 'بازگشت وجه'}</h2><p className="text-[10px] sm:text-[11px] text-slate-500">مدیریت ردیف‌ها</p></div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => downloadCSV(activeTab === 'issues' ? issues : activeTab === 'frozen' ? frozen : activeTab === 'features' ? features : refunds, activeTab)} className="flex-1 md:flex-none justify-center border border-gray-200 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm flex gap-2 items-center hover:bg-gray-50 transition bg-white"><Download size={16} /><span className="hidden sm:inline">خروجی</span></button>
                  <button onClick={() => openModal(activeTab === 'issues' ? 'issue' : activeTab === 'frozen' ? 'frozen' : activeTab === 'features' ? 'feature' : 'refund')} className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm flex gap-2 items-center hover:bg-blue-700 shadow-md shadow-blue-200 transition"><Plus size={16} /> ثبت جدید</button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-sm text-right min-w-[600px]">
                  <thead className="bg-slate-50 text-gray-600 border-b"><tr><th className="p-3">تاریخ</th><th className="p-3">کاربر</th><th className="p-3">توضیحات</th><th className="p-3">وضعیت</th><th className="p-3">اقدام</th></tr></thead>
                  <tbody className="bg-white">
                    {(activeTab === 'issues' ? issues : activeTab === 'frozen' ? frozen : activeTab === 'features' ? features : refunds).map((row) => (
                      <tr key={row.id} className={`border-b last:border-0 transition ${row.flag === 'پیگیری فوری' ? 'bg-red-100' : row.flag === 'پیگیری مهم' ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                        <td className="p-3 text-gray-500 text-xs whitespace-nowrap">{row.created_at || row.frozen_at || row.requested_at}</td>
                        <td className="p-3 font-semibold text-gray-800 text-xs sm:text-sm whitespace-nowrap">{row.username}</td>
                        <td className="p-3 max-w-[150px] sm:max-w-md truncate text-gray-600 text-xs sm:text-sm" title={row.desc_text || row.reason || row.title}>{row.desc_text || row.reason || row.title}</td>
                        <td className="p-3 text-xs sm:text-sm"><span className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-medium whitespace-nowrap ${row.status === 'حل‌شده' || row.status === 'انجام شد' || row.action === 'بازپرداخت شد' || row.status === 'رفع شد' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>{row.status || row.action}</span></td>
                        <td className="p-3 text-left text-xs sm:text-sm"><button type="button" onClick={() => openModal(activeTab === 'issues' ? 'issue' : activeTab === 'frozen' ? 'frozen' : activeTab === 'features' ? 'feature' : 'refund', row)} className="text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100 transition bg-white whitespace-nowrap">ویرایش</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm sm:text-base text-gray-800">{editingId ? 'ویرایش گزارش' : 'ثبت مورد جدید'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto grow">
              <div className="space-y-1"><label className="text-xs text-gray-500">نام کاربری</label><input required value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition bg-slate-50/60 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1"><label className="text-xs text-gray-500">شماره تماس</label><input placeholder="0912..." value={formData.phone_number || ''} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-white text-sm" /></div>
                 <div className="space-y-1"><label className="text-xs text-gray-500">یوزرنیم اینستاگرام</label><input placeholder="bedoon @" value={formData.instagram_username || ''} onChange={(e) => setFormData({ ...formData, instagram_username: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-white text-sm" /></div>
              </div>
              <div className="border-b border-gray-100 my-2"></div>

              {modalType === 'issue' && (
                <>
                  <div className="space-y-1"><label className="text-xs text-gray-500">وضعیت</label>
                  <select value={formData.status || 'باز'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none">
                      <option value="باز">باز</option><option value="در حال بررسی">در حال بررسی</option><option value="حل‌شده">حل‌شده</option>
                  </select></div>
                  <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-xs text-gray-500">وضعیت اشتراک</label><select value={formData.subscription_status || ''} onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none"><option value="">انتخاب...</option><option value="Active">Active</option><option value="Paused">Paused</option><option value="Expired">Expired</option></select></div><div className="space-y-1"><label className="text-xs text-gray-500">پشتیبان مسئول</label><input value={formData.support || ''} onChange={(e) => setFormData({ ...formData, support: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" /></div></div>
                  <div className="relative space-y-1"><label className="text-xs text-gray-500">شرح مشکل</label><textarea rows="3" value={formData.desc_text || ''} onChange={(e) => setFormData({ ...formData, desc_text: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-white text-sm"></textarea><button type="button" onClick={handleSmartAnalysis} className="absolute bottom-3 left-3 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] px-3 py-1.5 rounded-lg flex gap-1 items-center border border-purple-100 transition">{aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}تحلیل</button></div>
                  <div className="space-y-1"><label className="text-xs text-gray-500">یادداشت فنی</label><textarea rows="2" value={formData.technical_note || ''} onChange={(e) => setFormData({ ...formData, technical_note: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none"></textarea></div>
                </>
              )}
              {modalType === 'frozen' && (
                <div className="space-y-3">
                  <div className="space-y-1"><label className="text-xs text-gray-500">وضعیت</label>
                  <select value={formData.status || 'فریز'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none">
                      <option value="فریز">فریز</option><option value="در حال رفع">در حال رفع</option><option value="رفع شد">رفع شد</option>
                  </select></div>
                  <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-xs text-gray-500">ماژول</label><input value={formData.module || ''} onChange={(e) => setFormData({ ...formData, module: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" /></div><div className="space-y-1"><label className="text-xs text-gray-500">علت</label><input value={formData.cause || ''} onChange={(e) => setFormData({ ...formData, cause: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" /></div></div>
                  <textarea placeholder="توضیحات تکمیلی..." value={formData.desc_text || ''} onChange={(e) => setFormData({...formData, desc_text: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" />
                </div>
              )}
               {modalType === 'feature' && (
                <div className="space-y-3">
                  <div className="space-y-1"><label className="text-xs text-gray-500">وضعیت</label>
                  <select value={formData.status || 'بررسی نشده'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none">
                      <option value="بررسی نشده">بررسی نشده</option><option value="در تحلیل">در تحلیل</option><option value="در توسعه">در توسعه</option><option value="انجام شد">انجام شد</option>
                  </select></div>
                  <input placeholder="عنوان فیچر" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" />
                  <textarea placeholder="شرح..." value={formData.desc_text || ''} onChange={(e) => setFormData({...formData, desc_text: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" />
                </div>
              )}
               {modalType === 'refund' && (
                <div className="space-y-3">
                  <div className="space-y-1"><label className="text-xs text-gray-500">وضعیت</label>
                  <select value={formData.action || 'در حال بررسی'} onChange={(e) => setFormData({...formData, action: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none">
                      <option value="در حال بررسی">در حال بررسی</option><option value="بازپرداخت شد">بازپرداخت شد</option><option value="رد شد">رد شد</option>
                  </select></div>
                  <textarea placeholder="دلیل..." rows="3" value={formData.reason || ''} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" />
                   <button type="button" onClick={handleRefundAI} className="bg-purple-50 text-purple-600 text-[11px] w-full py-2 rounded-xl flex justify-center gap-1 items-center border border-purple-100"><Sparkles size={14} /> پیشنهاد متن</button>
                   {formData.suggestion && <div className="text-[11px] bg-purple-50 p-3 rounded-xl border border-purple-100 text-purple-800">{formData.suggestion}</div>}
                </div>
              )}
              <div className="space-y-1 mt-4"><label className="text-xs text-gray-500">فلگ گزارش</label><select value={formData.flag || ''} onChange={(e) => setFormData({ ...formData, flag: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none"><option value="">بدون فلگ</option><option value="پیگیری مهم">پیگیری مهم</option><option value="پیگیری فوری">پیگیری فوری</option></select></div>
              <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200 mt-2 text-sm">ذخیره اطلاعات</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}