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
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2
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
  AreaChart,
  Area
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
// 🎨 Tailwind & Custom Styles
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
      
      const style = document.createElement('style');
      style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;300;400;500;700;900&display=swap');
        body { font-family: 'Vazirmatn', sans-serif; }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `;
      document.head.appendChild(style);
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
// 👤 User Avatar Component
// =================================================================================
const UserAvatar = ({ name, size = 'md' }) => {
    const safeName = name || '?';
    const colors = ['from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-pink-400 to-pink-600', 'from-emerald-400 to-emerald-600', 'from-orange-400 to-orange-600'];
    const colorIndex = safeName.length % colors.length;
    
    const sizeClasses = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm';

    return (
        <div className={`${sizeClasses} rounded-full bg-gradient-to-br ${colors[colorIndex]} text-white flex items-center justify-center font-bold shadow-md ring-2 ring-white shrink-0`}>
            {safeName.charAt(0)}
        </div>
    );
};

// =================================================================================
// 🧠 Main Component
// =================================================================================
export default function App() {
  useTailwind();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
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

  // Resize Handler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Login State
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

  // Data Fetching
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

  // Analytics
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

  // Churn Prediction Logic
  const churnRisks = useMemo(() => {
      const recentIssues = issues.slice(0, 100); 
      const userCounts = {};
      
      recentIssues.forEach(i => {
          if (!userCounts[i.username]) {
              userCounts[i.username] = { count: 0, issues: [] };
          }
          userCounts[i.username].count += 1;
          userCounts[i.username].issues.push(i.desc_text);
      });

      return Object.entries(userCounts)
        .filter(([_, data]) => data.count >= 3)
        .map(([username, data]) => ({ username, count: data.count, issues: data.issues }));

  }, [issues]);

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

  // AI Functions
  const handleAiChurnAnalysis = async (user) => {
      setAiLoading(true);
      const prompt = `
        کاربری با نام ${user.username} اخیرا ${user.count} بار مشکل داشته است.
        شرح مشکلات او: ${JSON.stringify(user.issues)}
        
        لطفا تحلیل کن:
        1. سطح عصبانیت احتمالی (1 تا 10).
        2. ریشه اصلی مشکل (کوتاه).
        3. یک پیام کوتاه و همدلانه برای دلجویی که پشتیبان به او بگوید.
        
        خروجی فقط JSON باشد: {"anger_score": number, "root_cause": "string", "message": "string"}
      `;
      const res = await callGeminiAI(prompt, true);
      setAiLoading(false);
      
      if (res) {
          try {
            const data = JSON.parse(res);
            alert(`🔥 سطح خطر: ${data.anger_score}/10\n🔍 علت: ${data.root_cause}\n💬 پیشنهاد: ${data.message}`);
          } catch(e) { alert(res); }
      }
  };

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

  // Form Saving
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
        status: formData.status || 'باز',
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
        status: formData.status || 'فریز',
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
        status: formData.status || 'بررسی نشده',
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
        action: formData.action || 'در حال بررسی',
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

  // User Profile Component
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
      <div className="w-full max-w-6xl mx-auto animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white mb-6 relative z-20">
          <h2 className="font-bold text-gray-800 mb-2">جستجوی کاربر</h2>
          <div className="relative">
            <div className="flex items-center border border-gray-200 rounded-2xl bg-gray-50/50 overflow-hidden focus-within:ring-2 ring-blue-100 transition"><div className="pl-3 pr-4 text-gray-400"><Search size={18}/></div><input placeholder="نام، تلفن، اینستاگرام..." value={search} className="w-full p-3 bg-transparent outline-none text-sm" onChange={(e) => handleSearch(e.target.value)} /></div>
            {suggestions.length > 0 && (
              <div className="absolute top-full right-0 left-0 bg-white/95 backdrop-blur shadow-2xl rounded-2xl mt-2 max-h-60 overflow-auto border border-gray-100 z-50 text-right">
                {suggestions.map((u) => (
                  <div key={u.username} onClick={() => { setSearch(u.username); setSuggestions([]); }} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 text-sm flex gap-3 items-center">
                    <UserAvatar name={u.username} size="sm" />
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-700">{u.username}</span>
                        <div className="flex gap-3 text-xs text-gray-400 mt-0.5">{u.phone && <span>📞 {u.phone}</span>}{u.insta && <span>📸 {u.insta}</span>}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {selectedUserStats && (
            <div className="bg-gradient-to-l from-blue-50/50 to-white p-6 rounded-3xl shadow-sm border border-blue-100/50 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner"><UserAvatar name={selectedUserStats.username} size="lg"/></div>
                <div className="flex-1 text-center sm:text-right">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedUserStats.username}</h2>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                        {selectedUserStats.phone && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-xl border border-gray-200 text-sm text-gray-600 shadow-sm"><Phone size={14} className="text-emerald-500"/>{selectedUserStats.phone}</span>}
                        {selectedUserStats.insta && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-xl border border-gray-200 text-sm text-gray-600 shadow-sm dir-ltr"><Instagram size={14} className="text-rose-500"/>{selectedUserStats.insta}@</span>}
                    </div>
                </div>
            </div>
        )}
        {search && allRecords.length > 0 ? (
          <div className="bg-white/80 backdrop-blur p-6 rounded-3xl shadow-sm border border-white">
            <h3 className="font-semibold text-sm text-slate-800 mb-4">تاریخچه فعالیت‌ها</h3>
            <div className="relative pr-6">
              <div className="absolute top-2 bottom-2 right-2 w-px bg-slate-200" />
              <div className="space-y-5">
                {allRecords.map((r, i) => (
                  <div key={i} className="relative flex gap-4 items-start group">
                    <div className="absolute right-0 top-3 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow ring-2 ring-blue-100" />
                    <div className="mr-6 flex-1 bg-slate-50/60 border border-slate-100 rounded-2xl p-4 hover:bg-white hover:shadow-md transition duration-300">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-mono">{r.date}</span>
                          <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] shadow-sm">{r.src === 'issue' ? 'مشکل فنی' : r.src === 'frozen' ? 'اکانت فریز' : r.src === 'feature' ? 'درخواست فیچر' : 'بازگشت وجه'}</span>
                          {r.flag && <span className={`px-2 py-0.5 rounded-full text-[10px] border ${r.flag === 'پیگیری فوری' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{r.flag}</span>}
                        </div>
                        <button type="button" onClick={() => openModal(r.src === 'issue' ? 'issue' : r.src === 'frozen' ? 'frozen' : r.src === 'feature' ? 'feature' : 'refund', r)} className="text-[11px] px-3 py-1.5 rounded-full border border-gray-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition bg-white text-slate-700">ویرایش</button>
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

  if (appPassword && !isAuthed) return <div className="fixed inset-0 w-full h-full grid place-items-center bg-gray-50" dir="rtl"><div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md border border-slate-100 relative overflow-hidden mx-4"><h1 className="text-xl font-extrabold mb-3 text-center text-slate-800">ورود به داشبورد پشتیبانی</h1><form onSubmit={handleLogin} className="space-y-4"><input type="password" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-slate-50/60" placeholder="رمز عبور" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />{loginError && <div className="text-xs text-red-500 text-center">{loginError}</div>}<button type="submit" className="w-full bg-gradient-to-l from-blue-600 to-sky-500 text-white rounded-xl py-2.5 text-sm font-bold shadow-md">ورود</button></form></div></div>;

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] text-right font-sans overflow-hidden relative" dir="rtl">
      
      {/* 🔮 Background Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

      {/* 📱 Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity" 
        />
      )}
      
      {/* ---------------- Sidebar ---------------- */}
      <aside 
        className={`
          fixed lg:relative z-50 h-full bg-white/80 border-l border-white/50 
          flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none backdrop-blur-xl
          ${isSidebarOpen ? 'translate-x-0 w-64' : 'translate-x-full lg:translate-x-0 lg:w-20'}
          inset-y-0 right-0
        `}
      >
        <div className="p-5 flex items-center justify-between h-20 border-b border-gray-100/50">
           <div className={`flex flex-col overflow-hidden transition-all ${!isSidebarOpen && 'lg:opacity-0 lg:hidden'}`}>
             <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-blue-600 to-purple-600 text-xl leading-none">وردست</span>
             <span className="text-[10px] text-slate-400 mt-1">داشبورد هوشمند</span>
           </div>
           <div className={`hidden lg:flex ${isSidebarOpen && 'hidden'}`}>
              <span className="font-extrabold text-blue-700 text-xl">V</span>
           </div>
           
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600">
             {isSidebarOpen ? <X size={20} className="lg:hidden"/> : <Menu size={20}/>}
             <Menu size={20} className="hidden lg:block"/>
           </button>
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {[{ id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard }, { id: 'issues', label: 'مشکلات فنی', icon: AlertTriangle }, { id: 'frozen', label: 'اکانت فریز', icon: Snowflake }, { id: 'features', label: 'درخواست فیچر', icon: Lightbulb }, { id: 'refunds', label: 'بازگشت وجه', icon: CreditCard }, { id: 'profile', label: 'پروفایل کاربر', icon: User }].map((i) => (
                <button 
                  key={i.id} 
                  onClick={() => { setActiveTab(i.id); if(window.innerWidth < 1024) setSidebarOpen(false); }} 
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all whitespace-nowrap ${activeTab === i.id ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm' : 'text-slate-600 hover:bg-gray-50'}`}
                >
                    <i.icon size={20} className={`shrink-0 ${activeTab === i.id ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className={`${!isSidebarOpen && 'lg:opacity-0 lg:hidden'} transition-all duration-200`}>{i.label}</span>
                </button>
            ))}
        </nav>

        <div className="p-4 border-t border-gray-100 text-center">
            {isConnected ? (
              <div className={`flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 ${!isSidebarOpen && 'lg:hidden'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>سیستم آنلاین</span>
              </div>
            ) : (
               <span className="text-xs text-red-400">آفلاین</span>
            )}
        </div>
      </aside>

      {/* ---------------- Main Content ---------------- */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative z-0 custom-scrollbar">
        <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[1600px] mx-auto">
          
          <header className="flex items-center justify-between mb-8 sticky top-0 z-30 pt-2 pb-4 bg-[#F3F4F6]/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-600 active:scale-95 transition">
                <Menu size={20} />
              </button>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800">
                {activeTab === 'dashboard' ? 'داشبورد مدیریت' : 
                 activeTab === 'issues' ? 'لیست مشکلات فنی' :
                 activeTab === 'profile' ? 'جستجوی کاربر' : activeTab}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 bg-white/60 px-3 py-1.5 rounded-full border border-white shadow-sm">
               <span>امروز {new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </header>

          <div className="space-y-6">
            
            {activeTab === 'dashboard' && (
              <>
                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                  {[
                      { title: 'نرخ حل مشکلات', value: `%${analytics.solvedRatio}`, sub: 'بسته شده', color: 'from-emerald-500 to-teal-400', icon: CheckCircle2 },
                      { title: 'اکانت‌های فریز', value: analytics.activeFrozen, sub: 'کاربر فعال', color: 'from-blue-500 to-indigo-400', icon: Snowflake },
                      { title: 'بازگشت وجه', value: analytics.refundCount, sub: 'درخواست', color: 'from-rose-500 to-pink-400', icon: CreditCard },
                      { title: 'کل تیکت‌ها', value: issues.length, sub: 'ثبت شده', color: 'from-slate-700 to-slate-500', icon: Activity }
                  ].map((card, idx) => (
                      <div key={idx} className="bg-white/70 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-white hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                          <div className={`absolute -left-4 -top-4 p-6 rounded-full bg-gradient-to-br ${card.color} opacity-[0.08] group-hover:opacity-15 transition-all scale-150 rotate-12`}>
                              <card.icon size={60} />
                          </div>
                          <div className="relative z-10 flex flex-col h-full justify-between">
                             <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.title}</span>
                                <card.icon size={20} className="text-gray-400 opacity-50"/>
                             </div>
                             <div className="mt-4">
                                <h3 className="text-3xl font-black text-slate-800">{card.value}</h3>
                                <span className="text-[11px] font-medium text-gray-400 mt-1 block">{card.sub}</span>
                             </div>
                          </div>
                      </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    <div className="col-span-1 bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-red-100 flex flex-col h-auto min-h-[350px]">
                        <h4 className="font-bold text-gray-800 text-sm mb-5 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-500 shadow-inner"><AlertCircle size={16}/></span>
                            ریسک ریزش (هفته جاری)
                        </h4>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                            {churnRisks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 py-10">
                                    <CheckCircle2 size={48} className="mb-3 text-emerald-400" />
                                    <span className="text-sm">همه کاربران راضی هستند!</span>
                                </div>
                            ) : (
                                churnRisks.map((user, idx) => (
                                    <div key={idx} className="bg-white border border-red-50 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar name={user.username} size="sm"/>
                                                <div className="flex flex-col">
                                                   <span className="font-bold text-sm text-gray-800">{user.username}</span>
                                                   <span className="text-[10px] text-red-500 font-medium">وضعیت بحرانی</span>
                                                </div>
                                            </div>
                                            <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-red-100">{user.count} خطا</span>
                                        </div>
                                        <button 
                                            onClick={() => handleAiChurnAnalysis(user)}
                                            className="w-full flex items-center justify-center gap-2 text-[11px] text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white border border-purple-100 px-3 py-2 rounded-xl transition duration-300"
                                        >
                                            {aiLoading ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                                            تحلیل هوشمند علت
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="col-span-1 xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white flex flex-col h-[350px]">
                            <h4 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/>روند ثبت مشکلات</h4>
                            <div className="flex-1 w-full h-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'}} />
                                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                         <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white flex flex-col h-[350px]">
                            <h4 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2"><PieChart size={18} className="text-rose-500"/>دلایل بازگشت وجه</h4>
                            <div className="flex-1 w-full h-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieChartData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                            {pieChartData.map((e, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth={3} />))}
                                        </Pie>
                                        <Tooltip contentStyle={{borderRadius: '12px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}} />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
              </>
            )}

            {activeTab === 'profile' && <UserProfile />}
            
            {['issues', 'frozen', 'features', 'refunds'].includes(activeTab) && (
              <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-sm border border-white p-6 min-h-[60vh] animate-fade-in-up">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-bold text-xl text-gray-800">{activeTab === 'issues' ? 'مشکلات فنی' : activeTab === 'frozen' ? 'اکانت فریز' : activeTab === 'features' ? 'درخواست فیچر' : 'بازگشت وجه'}</h2>
                        <p className="text-xs text-slate-500">لیست کامل داده‌های ثبت شده در سیستم</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button onClick={() => downloadCSV(activeTab === 'issues' ? issues : activeTab === 'frozen' ? frozen : activeTab === 'features' ? features : refunds, activeTab)} className="flex-1 md:flex-none h-10 px-4 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 flex items-center justify-center gap-2 bg-white transition"><Download size={16}/> خروجی</button>
                      <button onClick={() => openModal(activeTab === 'issues' ? 'issue' : activeTab === 'frozen' ? 'frozen' : activeTab === 'features' ? 'feature' : 'refund')} className="flex-1 md:flex-none h-10 px-4 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition"><Plus size={18}/> ثبت جدید</button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right whitespace-nowrap">
                      <thead className="text-gray-500 border-b border-gray-100">
                        <tr><th className="pb-4 pr-2 font-medium">تاریخ</th><th className="pb-4 font-medium">کاربر</th><th className="pb-4 font-medium">توضیحات</th><th className="pb-4 font-medium">وضعیت</th><th className="pb-4 pl-2 font-medium">عملیات</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(activeTab === 'issues' ? issues : activeTab === 'frozen' ? frozen : activeTab === 'features' ? features : refunds).map((row) => (
                          <tr key={row.id} className="group hover:bg-blue-50/50 transition">
                            <td className="py-4 pr-2 text-gray-400 font-mono text-xs">{row.created_at || row.frozen_at || row.requested_at}</td>
                            <td className="py-4"><div className="flex items-center gap-2"><UserAvatar name={row.username} size="sm"/><span className="font-bold text-gray-700">{row.username}</span></div></td>
                            <td className="py-4 text-gray-500 max-w-[200px] truncate">{row.desc_text || row.reason || row.title}</td>
                            <td className="py-4"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${row.status === 'حل‌شده' || row.action === 'بازپرداخت شد' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{row.status || row.action}</span></td>
                            <td className="py-4 pl-2"><button onClick={() => openModal(activeTab === 'issues' ? 'issue' : activeTab === 'frozen' ? 'frozen' : activeTab === 'features' ? 'feature' : 'refund', row)} className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-600 transition">ویرایش</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-[60] p-4">
          <div className="bg-white/95 backdrop-blur w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transform transition-all border border-white max-h-[90vh] flex flex-col animate-fade-in-up">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm sm:text-base text-gray-800">{editingId ? 'ویرایش گزارش' : 'ثبت مورد جدید'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-gray-400 hover:text-red-500 transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto grow custom-scrollbar">
              <div className="space-y-1"><label className="text-xs text-gray-500 font-medium">نام کاربری</label><input required value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition bg-slate-50/50 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1"><label className="text-xs text-gray-500 font-medium">شماره تماس</label><input placeholder="0912..." value={formData.phone_number || ''} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-white text-sm" /></div>
                 <div className="space-y-1"><label className="text-xs text-gray-500 font-medium">اینستاگرام</label><input placeholder="username" value={formData.instagram_username || ''} onChange={(e) => setFormData({ ...formData, instagram_username: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-white text-sm" /></div>
              </div>
              <div className="border-b border-gray-100 my-2"></div>

              {modalType === 'issue' && (
                <>
                  <div className="space-y-1"><label className="text-xs text-gray-500 font-medium">وضعیت</label>
                  <select value={formData.status || 'باز'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none">
                      <option value="باز">باز</option><option value="در حال بررسی">در حال بررسی</option><option value="حل‌شده">حل‌شده</option>
                  </select></div>
                  <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-xs text-gray-500 font-medium">وضعیت اشتراک</label><select value={formData.subscription_status || ''} onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none"><option value="">انتخاب...</option><option value="Active">Active</option><option value="Paused">Paused</option><option value="Expired">Expired</option></select></div><div className="space-y-1"><label className="text-xs text-gray-500 font-medium">پشتیبان</label><input value={formData.support || ''} onChange={(e) => setFormData({ ...formData, support: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" /></div></div>
                  <div className="relative space-y-1"><label className="text-xs text-gray-500 font-medium">شرح مشکل</label><textarea rows="3" value={formData.desc_text || ''} onChange={(e) => setFormData({ ...formData, desc_text: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 bg-white text-sm"></textarea><button type="button" onClick={handleSmartAnalysis} className="absolute bottom-3 left-3 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] px-3 py-1.5 rounded-lg flex gap-1 items-center border border-purple-100 transition">{aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}تحلیل</button></div>
                  <div className="space-y-1"><label className="text-xs text-gray-500 font-medium">یادداشت فنی</label><textarea rows="2" value={formData.technical_note || ''} onChange={(e) => setFormData({ ...formData, technical_note: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none"></textarea></div>
                </>
              )}
              {modalType === 'frozen' && (
                <div className="space-y-3">
                  <div className="space-y-1"><label className="text-xs text-gray-500 font-medium">وضعیت</label>
                  <select value={formData.status || 'فریز'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none">
                      <option value="فریز">فریز</option><option value="در حال رفع">در حال رفع</option><option value="رفع شد">رفع شد</option>
                  </select></div>
                  <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-xs text-gray-500 font-medium">ماژول</label><input value={formData.module || ''} onChange={(e) => setFormData({ ...formData, module: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" /></div><div className="space-y-1"><label className="text-xs text-gray-500 font-medium">علت</label><input value={formData.cause || ''} onChange={(e) => setFormData({ ...formData, cause: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" /></div></div>
                  <textarea placeholder="توضیحات تکمیلی..." value={formData.desc_text || ''} onChange={(e) => setFormData({...formData, desc_text: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" />
                </div>
              )}
               {modalType === 'feature' && (
                <div className="space-y-3">
                  <div className="space-y-1"><label className="text-xs text-gray-500 font-medium">وضعیت</label>
                  <select value={formData.status || 'بررسی نشده'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none">
                      <option value="بررسی نشده">بررسی نشده</option><option value="در تحلیل">در تحلیل</option><option value="در توسعه">در توسعه</option><option value="انجام شد">انجام شد</option>
                  </select></div>
                  <input placeholder="عنوان فیچر" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" />
                  <textarea placeholder="شرح..." value={formData.desc_text || ''} onChange={(e) => setFormData({...formData, desc_text: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" />
                </div>
              )}
               {modalType === 'refund' && (
                <div className="space-y-3">
                  <div className="space-y-1"><label className="text-xs text-gray-500 font-medium">وضعیت</label>
                  <select value={formData.action || 'در حال بررسی'} onChange={(e) => setFormData({...formData, action: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none">
                      <option value="در حال بررسی">در حال بررسی</option><option value="بازپرداخت شد">بازپرداخت شد</option><option value="رد شد">رد شد</option>
                  </select></div>
                  <textarea placeholder="دلیل..." rows="3" value={formData.reason || ''} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none" />
                   <button type="button" onClick={handleRefundAI} className="bg-purple-50 text-purple-600 text-[11px] w-full py-2.5 rounded-xl flex justify-center gap-1 items-center border border-purple-100 hover:bg-purple-100 transition"><Sparkles size={14} /> پیشنهاد متن</button>
                   {formData.suggestion && <div className="text-[11px] bg-purple-50 p-3 rounded-xl border border-purple-100 text-purple-800">{formData.suggestion}</div>}
                </div>
              )}
              <div className="space-y-1 mt-4"><label className="text-xs text-gray-500 font-medium">اولویت</label><select value={formData.flag || ''} onChange={(e) => setFormData({ ...formData, flag: e.target.value })} className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-white outline-none"><option value="">عادی</option><option value="پیگیری مهم">پیگیری مهم</option><option value="پیگیری فوری">پیگیری فوری</option></select></div>
              <button type="submit" className="w-full bg-gradient-to-l from-blue-600 to-blue-500 text-white p-3 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 transition mt-2 text-sm">ذخیره اطلاعات</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}