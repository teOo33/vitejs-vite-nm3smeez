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
// 🔧 تنظیمات
// =================================================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const appPassword = import.meta.env.VITE_APP_PASSWORD || '';

const INITIAL_FORM_DATA = {
  username: '', phone_number: '', instagram_username: '', subscription_status: '',
  desc_text: '', module: '', type: '', status: '', support: '', resolved_at: '',
  technical_note: '', cause: '', first_frozen_at: '', freeze_count: '',
  last_frozen_at: '', resolve_status: '', note: '', title: '', category: '',
  repeat_count: '', importance: '', internal_note: '', reason: '', duration: '',
  action: '', suggestion: '', can_return: '', sales_source: '', ops_note: '', flag: '',
};

// =================================================================================
// 🎨 استایل‌ها (Tailwind + Font)
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

      const style = document.createElement('style');
      style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;300;400;500;700;900&display=swap');
        body { font-family: 'Vazirmatn', sans-serif; background-color: #F3F4F6; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `;
      document.head.appendChild(style);
    }
  }, []);
};

// =================================================================================
// 📡 کلاینت‌ها
// =================================================================================
let supabase;
try { if (supabaseUrl && supabaseUrl.startsWith('http')) supabase = createClient(supabaseUrl, supabaseKey); } catch (e) { console.error(e); }

const callGeminiAI = async (prompt, isJson = false) => {
  if (!geminiApiKey) return alert('کلید هوش مصنوعی وارد نشده است.');
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: isJson ? 'application/json' : 'text/plain' } }),
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) { return null; }
};

const downloadCSV = (data, fileName) => {
  if (!data || !data.length) return alert('داده‌ای وجود ندارد.');
  const headers = Object.keys(data[0]);
  const csvContent = [headers.join(','), ...data.map((row) => headers.map((fieldName) => `"${(row[fieldName] || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.csv`;
  link.click();
};

const UserAvatar = ({ name, size = 'md' }) => {
    const safeName = name || '?';
    const colors = ['from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-pink-400 to-pink-600', 'from-emerald-400 to-emerald-600', 'from-orange-400 to-orange-600'];
    const colorIndex = safeName.length % colors.length;
    const sizeClasses = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm';
    return <div className={`${sizeClasses} rounded-full bg-gradient-to-br ${colors[colorIndex]} text-white flex items-center justify-center font-bold shadow-md shrink-0`}>{safeName.charAt(0)}</div>;
};

// =================================================================================
// 🧠 کامپوننت اصلی
// =================================================================================
export default function App() {
  useTailwind();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
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
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Login Logic
  const [isAuthed, setIsAuthed] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!appPassword) return true;
    return localStorage.getItem('vardast_ops_authed') === '1';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!appPassword || passwordInput === appPassword) { setIsAuthed(true); localStorage.setItem('vardast_ops_authed', '1'); setLoginError(''); } 
    else { setLoginError('رمز عبور اشتباه است.'); }
  };

  // Data Loading
  useEffect(() => {
    if (!supabase) return;
    setIsConnected(true);
    const fetchAll = async () => {
      const { data: d1 } = await supabase.from('issues').select('*').order('id', { ascending: false }); if (d1) setIssues(d1);
      const { data: d2 } = await supabase.from('frozen').select('*').order('id', { ascending: false }); if (d2) setFrozen(d2);
      const { data: d3 } = await supabase.from('features').select('*').order('id', { ascending: false }); if (d3) setFeatures(d3);
      const { data: d4 } = await supabase.from('refunds').select('*').order('id', { ascending: false }); if (d4) setRefunds(d4);
    };
    fetchAll();
    const channel = supabase.channel('updates').on('postgres_changes', { event: 'INSERT', schema: 'public' }, (payload) => {
        const newRow = payload.new;
        if (payload.table === 'issues') setIssues(prev => [newRow, ...prev]);
        if (payload.table === 'frozen') setFrozen(prev => [newRow, ...prev]);
        if (payload.table === 'features') setFeatures(prev => [newRow, ...prev]);
        if (payload.table === 'refunds') setRefunds(prev => [newRow, ...prev]);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Analytics & AI
  const analytics = useMemo(() => {
    const resolved = issues.filter((i) => i.status === 'حل‌شده').length;
    return { solvedRatio: issues.length ? Math.round((resolved / issues.length) * 100) : 0, activeFrozen: frozen.filter((f) => f.status === 'فریز').length, refundCount: refunds.length };
  }, [issues, frozen, refunds]);

  const churnRisks = useMemo(() => {
      const recentIssues = issues.slice(0, 100); 
      const userCounts = {};
      recentIssues.forEach(i => {
          if (!userCounts[i.username]) userCounts[i.username] = { count: 0, issues: [] };
          userCounts[i.username].count += 1; userCounts[i.username].issues.push(i.desc_text);
      });
      return Object.entries(userCounts).filter(([_, data]) => data.count >= 3).map(([username, data]) => ({ username, count: data.count, issues: data.issues }));
  }, [issues]);

  const chartData = useMemo(() => {
    const acc = {}; issues.forEach((i) => { const d = i.created_at ? i.created_at.split(' ')[0] : 'نامشخص'; acc[d] = (acc[d] || 0) + 1; });
    return Object.keys(acc).map((d) => ({ date: d, count: acc[d] }));
  }, [issues]);

  const pieChartData = useMemo(() => {
    const acc = {}; refunds.forEach((r) => { const cat = r.category || 'سایر'; acc[cat] = (acc[cat] || 0) + 1; });
    return Object.keys(acc).map((name) => ({ name, value: acc[name] }));
  }, [refunds]);

  const handleAiChurnAnalysis = async (user) => {
      setAiLoading(true);
      const res = await callGeminiAI(`کاربر ${user.username}، ${user.count} مشکل داشته: ${JSON.stringify(user.issues)}. تحلیل JSON: {"anger_score": number, "root_cause": "string", "message": "string"}`, true);
      setAiLoading(false);
      if (res) { try { const data = JSON.parse(res); alert(`🔥 خطر: ${data.anger_score}/10\n🔍 علت: ${data.root_cause}\n💬 پیام: ${data.message}`); } catch(e) { alert(res); } }
  };
  const handleSmartAnalysis = async () => {
    if (!formData.desc_text) return alert('شرح وارد نشده.'); setAiLoading(true);
    const res = await callGeminiAI(`Analyze issue Persian "${formData.desc_text}". JSON: { "module": "", "type": "", "note": "" }`, true); setAiLoading(false);
    if (res) { try { const parsed = JSON.parse(res); setFormData(prev => ({ ...prev, ...parsed, technical_note: parsed.note })); } catch(e){} }
  };
  const handleRefundAI = async () => {
    if (!formData.username) return; setAiLoading(true);
    const res = await callGeminiAI(`پیام فارسی برای "${formData.username}" جهت بازگشت وجه: "${formData.reason}"`, false); setAiLoading(false);
    if (res) setFormData(prev => ({ ...prev, suggestion: res.trim() }));
  };
  const handleFeatureAI = async () => {
    if (!formData.desc_text) return alert('شرح فیچر ناقص است.');
    setAiLoading(true);
    const res = await callGeminiAI(`عنوان کوتاه فارسی برای: "${formData.desc_text}"`, false);
    setAiLoading(false);
    if (res) setFormData((prev) => ({ ...prev, title: res.trim() }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const today = new Date().toLocaleDateString('fa-IR');
    const isEdit = !!editingId;
    let table = '';
    const commonFields = { username: formData.username, phone_number: formData.phone_number, instagram_username: formData.instagram_username, flag: formData.flag || null };
    let payload = {};

    if (modalType === 'issue') {
      table = 'issues';
      payload = { ...commonFields, desc_text: formData.desc_text, module: formData.module, type: formData.type, status: formData.status || 'باز', support: formData.support, subscription_status: formData.subscription_status, resolved_at: formData.resolved_at, technical_note: formData.technical_note };
      if (!isEdit) payload.created_at = today;
    } else if (modalType === 'frozen') {
      table = 'frozen';
      payload = { ...commonFields, desc_text: formData.desc_text, module: formData.module, cause: formData.cause, status: formData.status || 'فریز', subscription_status: formData.subscription_status, first_frozen_at: formData.first_frozen_at, freeze_count: formData.freeze_count ? Number(formData.freeze_count) : null, last_frozen_at: formData.last_frozen_at, resolve_status: formData.resolve_status, note: formData.note };
      if (!isEdit) payload.frozen_at = today;
    } else if (modalType === 'feature') {
      table = 'features';
      payload = { ...commonFields, desc_text: formData.desc_text, title: formData.title, category: formData.category, status: formData.status || 'بررسی نشده', repeat_count: formData.repeat_count ? Number(formData.repeat_count) : null, importance: formData.importance ? Number(formData.importance) : null, internal_note: formData.internal_note };
      if (!isEdit) payload.created_at = today;
    } else if (modalType === 'refund') {
      table = 'refunds';
      payload = { ...commonFields, reason: formData.reason, duration: formData.duration, category: formData.category, action: formData.action || 'در حال بررسی', suggestion: formData.suggestion, can_return: formData.can_return, sales_source: formData.sales_source, ops_note: formData.ops_note };
      if (!isEdit) payload.requested_at = today;
    }

    if (!supabase) return alert('دیتابیس متصل نیست.');
    const { error } = editingId ? await supabase.from(table).update(payload).eq('id', editingId) : await supabase.from(table).insert([payload]);
    if (error) alert(error.message); 
    else { setIsModalOpen(false); setEditingId(null); setFormData(INITIAL_FORM_DATA); }
  };

  const openModal = (t, record = null) => { setModalType(t); setEditingId(record?.id || null); setFormData(record ? { ...INITIAL_FORM_DATA, ...record } : INITIAL_FORM_DATA); setIsModalOpen(true); };

  const UserProfile = () => {
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedUserStats, setSelectedUserStats] = useState(null);
    const userMap = useMemo(() => {
        const map = {}; [...issues, ...frozen, ...features, ...refunds].forEach(r => { if(r.username) map[r.username] = { username: r.username, phone: r.phone_number, insta: r.instagram_username }; });
        return map;
    }, [issues, frozen, features, refunds]);
    const handleSearch = (val) => { setSearch(val); if(val) setSuggestions(Object.values(userMap).filter(u => u.username.includes(val))); else setSuggestions([]); };
    useEffect(() => { if(userMap[search]) setSelectedUserStats(userMap[search]); else setSelectedUserStats(null); }, [search, userMap]);
    const allRecords = [...issues.map(x=>({...x,src:'issue',date:x.created_at})),...frozen.map(x=>({...x,src:'frozen',date:x.frozen_at})),...features.map(x=>({...x,src:'feature',date:x.created_at})),...refunds.map(x=>({...x,src:'refund',date:x.requested_at}))].filter(r=>r.username===search);

    return (
      <div className="w-full max-w-6xl mx-auto animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white mb-6">
          <h2 className="font-bold text-gray-800 mb-2">جستجوی کاربر</h2>
          <div className="relative">
            <div className="flex items-center border border-gray-200 rounded-2xl bg-gray-50/50"><div className="pl-3 pr-4 text-gray-400"><Search size={18}/></div><input placeholder="نام..." value={search} className="w-full p-3 bg-transparent outline-none" onChange={(e) => handleSearch(e.target.value)} /></div>
            {suggestions.length > 0 && <div className="absolute top-full w-full bg-white shadow-xl rounded-2xl mt-1 z-50 max-h-60 overflow-auto text-right">{suggestions.map(u=><div key={u.username} onClick={()=>{setSearch(u.username);setSuggestions([])}} className="p-3 hover:bg-gray-50 cursor-pointer">{u.username}</div>)}</div>}
          </div>
        </div>
        {selectedUserStats && (
            <div className="bg-white/80 backdrop-blur p-6 rounded-3xl shadow-sm border border-white mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner"><UserAvatar name={selectedUserStats.username} size="lg"/></div>
                <div className="flex-1 text-center sm:text-right"><h2 className="text-xl font-bold text-gray-800 mb-2">{selectedUserStats.username}</h2><div className="flex flex-wrap justify-center sm:justify-start gap-3">{selectedUserStats.phone && <span className="bg-gray-100 px-3 py-1 rounded-lg text-sm">{selectedUserStats.phone}</span>}</div></div>
            </div>
        )}
        {allRecords.length > 0 && <div className="space-y-4">{allRecords.map((r,i)=><div key={i} className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center"><span>{r.src === 'issue' ? 'مشکل' : r.src}</span><span>{r.date}</span></div>)}</div>}
      </div>
    );
  };

  if (appPassword && !isAuthed) return <div className="h-screen grid place-items-center bg-gray-50" dir="rtl"><form onSubmit={handleLogin} className="p-10 bg-white shadow-xl rounded-3xl w-full max-w-md"><h1 className="text-xl font-bold mb-4 text-center">ورود</h1><input type="password" value={passwordInput} onChange={e=>setPasswordInput(e.target.value)} className="border p-3 rounded-xl w-full mb-4 bg-gray-50" placeholder="رمز..."/><button className="bg-blue-600 text-white w-full p-3 rounded-xl font-bold">ورود</button></form></div>;

  return (
    // ------------------------------------------------------------------------------------
    // 🔥 ساختار اصلاح شده بر اساس کد اصلی شما
    // استفاده از Flex Box استاندارد برای کنار هم قرار دادن سایدبار و محتوا
    // ------------------------------------------------------------------------------------
    <div className="flex h-screen w-full bg-[#F3F4F6] text-right font-sans overflow-hidden relative" dir="rtl">
      
      {/* بک‌گراند */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

      {/* سایه موبایل */}
      {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm transition-opacity" />}

      {/* سایدبار */}
      <aside className={`
          fixed inset-y-0 right-0 z-40 h-full bg-white/90 backdrop-blur-xl border-l border-white/50 flex flex-col transition-transform duration-300 shadow-2xl lg:shadow-none
          lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0 w-64' : 'translate-x-full lg:w-20'}
      `}>
        <div className="p-5 flex items-center justify-between h-20 border-b border-gray-100/50">
           <div className={`${!isSidebarOpen && 'lg:hidden'} font-extrabold text-blue-600 text-xl`}>وردست</div>
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-xl lg:mr-auto transition"><Menu size={20}/></button>
        </div>
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
            {[{ id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard }, { id: 'issues', label: 'مشکلات فنی', icon: AlertTriangle }, { id: 'frozen', label: 'اکانت فریز', icon: Snowflake }, { id: 'features', label: 'درخواست فیچر', icon: Lightbulb }, { id: 'refunds', label: 'بازگشت وجه', icon: CreditCard }, { id: 'profile', label: 'پروفایل کاربر', icon: User }].map((i) => (
                <button key={i.id} onClick={() => { setActiveTab(i.id); if(window.innerWidth < 1024) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all whitespace-nowrap ${activeTab === i.id ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' : 'text-slate-600 hover:bg-white/50'}`}>
                    <i.icon size={20} className={`shrink-0 ${activeTab === i.id ? 'text-blue-600' : 'text-gray-400'}`} /><span className={`${!isSidebarOpen && 'lg:hidden'}`}>{i.label}</span>
                </button>
            ))}
        </nav>
        <div className="p-4 border-t text-center text-xs text-emerald-600 font-bold">{isConnected ? 'آنلاین' : 'آفلاین'}</div>
      </aside>

      {/* محتوای اصلی */}
      <main className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 relative z-0 custom-scrollbar">
        <header className="flex items-center justify-between mb-8 sticky top-0 z-20 pt-2 pb-4">
          <div className="flex items-center gap-3">
             <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-white rounded-xl shadow-sm text-gray-600"><Menu size={20} /></button>
             <h1 className="text-2xl font-extrabold text-slate-800">{activeTab === 'dashboard' ? 'داشبورد مدیریت' : activeTab === 'issues' ? 'مشکلات فنی' : activeTab}</h1>
          </div>
          <div className="hidden sm:block text-xs text-gray-500 bg-white/50 px-3 py-1 rounded-full">امروز {new Date().toLocaleDateString('fa-IR')}</div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
               {[
                  { title: 'نرخ حل', value: `%${analytics.solvedRatio}`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { title: 'فریز', value: analytics.activeFrozen, icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { title: 'بازگشت وجه', value: analytics.refundCount, icon: CreditCard, color: 'text-rose-500', bg: 'bg-rose-50' },
                  { title: 'کل تیکت‌ها', value: issues.length, icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50' }
               ].map((c,i) => (
                   <div key={i} className="bg-white/70 backdrop-blur p-5 rounded-[2rem] border border-white shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
                       <div className={`absolute -left-4 -top-4 p-6 rounded-full opacity-10 ${c.bg} scale-150`}><c.icon size={60}/></div>
                       <span className="text-xs font-bold text-gray-500">{c.title}</span>
                       <div className="flex items-end gap-2"><h3 className={`text-3xl font-black ${c.color}`}>{c.value}</h3></div>
                   </div>
               ))}
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="col-span-1 bg-white/70 backdrop-blur p-6 rounded-[2rem] border border-red-100 shadow-sm flex flex-col h-[350px]">
                    <h4 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2"><AlertCircle size={16} className="text-red-500"/> ریسک ریزش (هفته جاری)</h4>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                        {churnRisks.length === 0 ? <div className="text-center text-gray-400 mt-10">کاربری در خطر نیست!</div> : churnRisks.map((u,i)=>(
                            <div key={i} className="bg-white border border-red-50 p-3 rounded-2xl flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-2"><UserAvatar name={u.username} size="sm"/><div><div className="font-bold text-sm">{u.username}</div><div className="text-[10px] text-red-500">{u.count} خطا</div></div></div>
                                <button onClick={()=>handleAiChurnAnalysis(u)} className="text-[10px] bg-purple-50 text-purple-600 px-3 py-1 rounded-lg border border-purple-100">تحلیل AI</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-1 xl:col-span-2 bg-white/70 backdrop-blur p-6 rounded-[2rem] border border-white shadow-sm h-[350px] flex flex-col">
                    <h4 className="font-bold text-gray-700 text-sm mb-4 flex gap-2"><TrendingUp size={18}/> روند ثبت مشکلات</h4>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}><defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date" tick={{fontSize:10}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{borderRadius:'10px', border:'none'}}/><Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fill="url(#colorCount)"/></AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'profile' && <UserProfile />}
        
        {['issues', 'frozen', 'features', 'refunds'].includes(activeTab) && (
            <div className="bg-white/80 backdrop-blur rounded-[2rem] p-6 shadow-sm border border-white min-h-[60vh] animate-fade-in-up">
                 <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                    <h2 className="font-bold text-lg text-slate-700">{activeTab === 'issues' ? 'مشکلات فنی' : activeTab}</h2>
                    <div className="flex gap-2">
                        <button onClick={()=>downloadCSV(issues, 'export')} className="px-4 py-2 bg-white border rounded-xl text-sm flex gap-2 items-center hover:bg-gray-50"><Download size={16}/> خروجی</button>
                        <button onClick={()=>openModal(activeTab === 'issues' ? 'issue' : activeTab === 'frozen' ? 'frozen' : activeTab === 'features' ? 'feature' : 'refund')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm flex gap-2 items-center hover:bg-blue-700 shadow-lg shadow-blue-200"><Plus size={16}/> ثبت جدید</button>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right whitespace-nowrap">
                        <thead className="text-gray-500 border-b bg-gray-50/50"><tr><th className="p-3 rounded-r-xl">تاریخ</th><th className="p-3">کاربر</th><th className="p-3">توضیح</th><th className="p-3">وضعیت</th><th className="p-3 rounded-l-xl">...</th></tr></thead>
                        <tbody>
                            {(activeTab === 'issues' ? issues : activeTab === 'frozen' ? frozen : activeTab === 'features' ? features : refunds).map(row=>(
                                <tr key={row.id} className="border-b last:border-0 hover:bg-white transition-colors">
                                    <td className="p-3 text-gray-400 font-mono text-xs">{row.created_at || row.frozen_at || row.requested_at}</td>
                                    <td className="p-3"><div className="flex gap-2 items-center"><UserAvatar name={row.username} size="sm"/><span className="font-bold">{row.username}</span></div></td>
                                    <td className="p-3 truncate max-w-[150px] text-gray-500">{row.desc_text || row.reason || row.title}</td>
                                    <td className="p-3"><span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-lg text-xs font-bold">{row.status || row.action}</span></td>
                                    <td className="p-3"><button onClick={()=>openModal(activeTab === 'issues' ? 'issue' : activeTab === 'frozen' ? 'frozen' : activeTab === 'features' ? 'feature' : 'refund', row)} className="text-xs border px-3 py-1 rounded-lg hover:bg-gray-50">ویرایش</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        )}
      </main>

      {/* مودال فرم‌ها (با تمام فیلدها) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-50 p-4">
             <div className="bg-white/95 backdrop-blur w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-white">
                 <div className="flex justify-between mb-6 items-center border-b pb-4"><h3 className="font-bold text-lg">فرم ثبت اطلاعات</h3><button onClick={()=>setIsModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition"><X size={20}/></button></div>
                 <form onSubmit={handleSave} className="space-y-4">
                     <div className="space-y-1"><label className="text-xs text-gray-500">نام کاربری</label><input required value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})} className="w-full border border-gray-200 bg-gray-50/50 p-3 rounded-xl outline-none focus:border-blue-500 transition"/></div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><label className="text-xs text-gray-500">موبایل</label><input value={formData.phone_number} onChange={e=>setFormData({...formData, phone_number: e.target.value})} className="w-full border p-3 rounded-xl outline-none"/></div>
                        <div className="space-y-1"><label className="text-xs text-gray-500">اینستاگرام</label><input value={formData.instagram_username} onChange={e=>setFormData({...formData, instagram_username: e.target.value})} className="w-full border p-3 rounded-xl outline-none"/></div>
                     </div>
                     <div className="w-full h-px bg-gray-100 my-2"></div>

                     {/* فیلدهای اختصاصی Issue */}
                     {modalType === 'issue' && (
                         <>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1"><label className="text-xs text-gray-500">وضعیت</label><select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full border p-3 rounded-xl bg-white"><option>باز</option><option>در حال بررسی</option><option>حل‌شده</option></select></div>
                                <div className="space-y-1"><label className="text-xs text-gray-500">پشتیبان</label><input value={formData.support} onChange={e=>setFormData({...formData, support: e.target.value})} className="w-full border p-3 rounded-xl"/></div>
                            </div>
                            <div className="space-y-1 relative">
                                <label className="text-xs text-gray-500">شرح مشکل</label>
                                <textarea rows="3" value={formData.desc_text} onChange={e=>setFormData({...formData, desc_text: e.target.value})} className="w-full border p-3 rounded-xl outline-none focus:border-blue-500"/>
                                <button type="button" onClick={handleSmartAnalysis} className="absolute bottom-3 left-3 text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-200 flex gap-1 items-center"><Sparkles size={12}/> تحلیل AI</button>
                            </div>
                            <div className="space-y-1"><label className="text-xs text-gray-500">یادداشت فنی</label><textarea rows="2" value={formData.technical_note} onChange={e=>setFormData({...formData, technical_note: e.target.value})} className="w-full border p-3 rounded-xl"/></div>
                         </>
                     )}

                     {/* فیلدهای اختصاصی Frozen */}
                     {modalType === 'frozen' && (
                         <>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1"><label className="text-xs text-gray-500">وضعیت</label><select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full border p-3 rounded-xl"><option>فریز</option><option>رفع شد</option></select></div>
                                <div className="space-y-1"><label className="text-xs text-gray-500">ماژول</label><input value={formData.module} onChange={e=>setFormData({...formData, module: e.target.value})} className="w-full border p-3 rounded-xl"/></div>
                            </div>
                            <div className="space-y-1"><label className="text-xs text-gray-500">علت فریز</label><input value={formData.cause} onChange={e=>setFormData({...formData, cause: e.target.value})} className="w-full border p-3 rounded-xl"/></div>
                            <textarea placeholder="توضیحات..." value={formData.desc_text} onChange={e=>setFormData({...formData, desc_text: e.target.value})} className="w-full border p-3 rounded-xl"/>
                         </>
                     )}

                     {/* فیلدهای اختصاصی Feature */}
                     {modalType === 'feature' && (
                         <>
                             <div className="space-y-1"><label className="text-xs text-gray-500">عنوان</label><input value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full border p-3 rounded-xl"/></div>
                             <textarea placeholder="شرح درخواست..." value={formData.desc_text} onChange={e=>setFormData({...formData, desc_text: e.target.value})} className="w-full border p-3 rounded-xl h-24"/>
                             <button type="button" onClick={handleFeatureAI} className="w-full py-2 bg-purple-50 text-purple-600 rounded-xl text-xs border border-purple-100">✨ پیشنهاد عنوان با AI</button>
                         </>
                     )}

                     {/* فیلدهای اختصاصی Refund */}
                     {modalType === 'refund' && (
                         <>
                             <div className="space-y-1"><label className="text-xs text-gray-500">وضعیت</label><select value={formData.action} onChange={e=>setFormData({...formData, action: e.target.value})} className="w-full border p-3 rounded-xl"><option>در حال بررسی</option><option>بازپرداخت شد</option><option>رد شد</option></select></div>
                             <textarea placeholder="دلیل بازگشت وجه..." rows="3" value={formData.reason} onChange={e=>setFormData({...formData, reason: e.target.value})} className="w-full border p-3 rounded-xl"/>
                             <button type="button" onClick={handleRefundAI} className="w-full py-2 bg-purple-50 text-purple-600 rounded-xl text-xs border border-purple-100 flex justify-center gap-2 items-center"><Sparkles size={14}/> نگارش پیام مودبانه با AI</button>
                             {formData.suggestion && <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-gray-200">{formData.suggestion}</div>}
                         </>
                     )}
                     
                     <div className="pt-4">
                        <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition transform active:scale-95">ذخیره اطلاعات</button>
                     </div>
                 </form>
             </div>
        </div>
      )}
    </div>
  );
}