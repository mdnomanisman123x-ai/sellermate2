"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Sale = { id: number; title: string; amount: number; date: string; customer: string };
type Expense = { id: number; title: string; amount: number; date: string; category: string };
type Customer = { id: number; name: string; phone: string; note: string };
type Product = { id: number; name: string; stock: number; price: number };
type Store = { sales: Sale[]; expenses: Expense[]; customers: Customer[]; products: Product[] };
type Tab = "overview" | "sales" | "expenses" | "customers" | "inventory" | "privacy";
type FormKind = "sale" | "expense" | "customer" | "product" | null;

const starter: Store = {
  sales: [
    { id: 1, title: "Online order #1024", amount: 2450, date: "Today", customer: "Walk-in customer" },
    { id: 2, title: "Product order #1023", amount: 1800, date: "Yesterday", customer: "Regular customer" },
    { id: 3, title: "Retail sale", amount: 950, date: "Yesterday", customer: "Walk-in customer" }
  ],
  expenses: [
    { id: 1, title: "Product purchase", amount: 2200, date: "Today", category: "Stock" },
    { id: 2, title: "Delivery charge", amount: 180, date: "Yesterday", category: "Delivery" }
  ],
  customers: [
    { id: 1, name: "Rahim Ahmed", phone: "01XXXXXXXXX", note: "Regular customer" },
    { id: 2, name: "Nusrat Jahan", phone: "01XXXXXXXXX", note: "Online customer" }
  ],
  products: [
    { id: 1, name: "Sample product A", stock: 18, price: 650 },
    { id: 2, name: "Sample product B", stock: 7, price: 1250 },
    { id: 3, name: "Sample product C", stock: 2, price: 390 }
  ]
};

const navigation: { id: Tab; icon: string; en: string; bn: string }[] = [
  { id: "overview", icon: "▦", en: "Overview", bn: "ড্যাশবোর্ড" },
  { id: "sales", icon: "↗", en: "Sales", bn: "বিক্রি" },
  { id: "expenses", icon: "↘", en: "Expenses", bn: "খরচ" },
  { id: "customers", icon: "♙", en: "Customers", bn: "কাস্টমার" },
  { id: "inventory", icon: "▤", en: "Inventory", bn: "স্টক" },
  { id: "privacy", icon: "◈", en: "Privacy", bn: "গোপনীয়তা" }
];

const money = (value: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(value);

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [store, setStore] = useState<Store>(starter);
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState<FormKind>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sellermate-demo-v1");
      if (saved) setStore(JSON.parse(saved) as Store);
    } catch {
      // Ignore invalid local demo data.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("sellermate-demo-v1", JSON.stringify(store));
  }, [store, ready]);

  const totals = useMemo(() => {
    const sales = store.sales.reduce((sum, item) => sum + item.amount, 0);
    const expenses = store.expenses.reduce((sum, item) => sum + item.amount, 0);
    return { sales, expenses, profit: sales - expenses };
  }, [store]);

  const label = (en: string, bn: string) => lang === "en" ? en : bn;
  const current = navigation.find(item => item.id === tab);
  const openForm = (kind: Exclude<FormKind, null>) => setForm(kind);

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = Date.now();
    const amount = Number(data.get("amount") || 0);

    if (form === "sale") {
      setStore(s => ({ ...s, sales: [{ id, title: String(data.get("title")), amount, date: "Just now", customer: String(data.get("customer") || "Customer") }, ...s.sales] }));
      setNotice(label("Sale saved on this device.", "বিক্রির তথ্য এই ডিভাইসে সেভ হয়েছে।"));
    } else if (form === "expense") {
      setStore(s => ({ ...s, expenses: [{ id, title: String(data.get("title")), amount, date: "Just now", category: String(data.get("category") || "Other") }, ...s.expenses] }));
      setNotice(label("Expense saved on this device.", "খরচের তথ্য এই ডিভাইসে সেভ হয়েছে।"));
    } else if (form === "customer") {
      setStore(s => ({ ...s, customers: [{ id, name: String(data.get("name")), phone: String(data.get("phone")), note: String(data.get("note") || "") }, ...s.customers] }));
      setNotice(label("Customer saved on this device.", "কাস্টমারের তথ্য এই ডিভাইসে সেভ হয়েছে।"));
    } else if (form === "product") {
      setStore(s => ({ ...s, products: [{ id, name: String(data.get("name")), stock: Number(data.get("stock") || 0), price: Number(data.get("price") || 0) }, ...s.products] }));
      setNotice(label("Product saved on this device.", "পণ্যের তথ্য এই ডিভাইসে সেভ হয়েছে।"));
    }
    setForm(null);
    window.setTimeout(() => setNotice(""), 3000);
  }

  const addForTab = () => openForm(tab === "expenses" ? "expense" : tab === "customers" ? "customer" : tab === "inventory" ? "product" : "sale");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#"><span className="brand-mark">S</span><span>Seller<span className="brand-light">Mate</span><small>BUSINESS WORKSPACE</small></span></a>
        <div className="workspace"><span className="workspace-dot" /><span><b>My Business</b><small>Starter workspace</small></span><span className="chevron">⌄</span></div>
        <p className="nav-caption">{label("WORKSPACE", "ওয়ার্কস্পেস")}</p>
        <nav>
          {navigation.map(item => (
            <button key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
              <span className="nav-icon">{item.icon}</span><span>{label(item.en, item.bn)}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon">✦</span><b>{label("Need a hand?", "সাহায্য লাগবে?")}</b><p>{label("Your business journey starts with one good decision.", "একটি ভালো সিদ্ধান্ত থেকেই ব্যবসার অগ্রগতি শুরু।")}</p><button onClick={() => setTab("overview")}>{label("Explore dashboard", "ড্যাশবোর্ড দেখুন")} →</button></div>
          <div className="profile"><div className="avatar">N</div><span><b>Business Owner</b><small>Free plan</small></span><span className="more">•••</span></div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">S</span> SellerMate</div>
          <div className="breadcrumb">Workspace <span>/</span> <b>{current ? label(current.en, current.bn) : "Overview"}</b></div>
          <div className="top-actions"><button className="language" onClick={() => setLang(lang === "en" ? "bn" : "en")}>{lang === "en" ? "বাংলা" : "English"}</button><div className="top-avatar">N</div></div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div><p className="eyebrow">{label("YOUR BUSINESS AT A GLANCE", "আজকের ব্যবসার এক নজর")}</p><h1>{tab === "overview" ? label("Good to see you, Boss.", "স্বাগতম, বস।") : label(current?.en || "Workspace", current?.bn || "ওয়ার্কস্পেস")}</h1><p className="subheading">{tab === "overview" ? label("Here’s what’s happening with your business today.", "আজ আপনার ব্যবসার অবস্থা এক নজরে দেখে নিন।") : label("Manage your business activity in one simple workspace.", "এক জায়গা থেকেই আপনার ব্যবসার কাজ পরিচালনা করুন।")}</p></div>
            <button className="primary-button" onClick={addForTab}><span>＋</span> {label("Add new", "নতুন যোগ করুন")}</button>
          </div>

          {notice && <div className="notice">✓ {notice}</div>}

          {tab === "overview" && <>
            <div className="metric-grid">
              <Metric title={label("Total sales", "মোট বিক্রি")} value={money(totals.sales)} hint={label("Recorded sales", "রেকর্ড করা বিক্রি")} icon="↗" tone="green" />
              <Metric title={label("Total expenses", "মোট খরচ")} value={money(totals.expenses)} hint={label("Recorded expenses", "রেকর্ড করা খরচ")} icon="↘" tone="orange" />
              <Metric title={label("Net balance", "নিট ব্যালেন্স")} value={money(totals.profit)} hint={label("Sales minus expenses", "বিক্রি থেকে খরচ বাদ")} icon="◈" tone="blue" />
              <Metric title={label("Customers", "কাস্টমার")} value={String(store.customers.length)} hint={label("Saved customers", "সংরক্ষিত কাস্টমার")} icon="♙" tone="purple" />
            </div>
            <div className="dashboard-grid">
              <section className="panel sales-panel"><div className="panel-heading"><div><h2>{label("Business snapshot", "ব্যবসার সারসংক্ষেপ")}</h2><p>{label("Your recorded income and expenses", "আপনার সংরক্ষিত আয় ও খরচ")}</p></div><span className="period-pill">{label("All time", "সব সময়")}</span></div>
                <div className="chart-wrap"><div className="chart-labels"><span>{money(totals.sales)}</span><span>{money(totals.expenses)}</span></div><div className="bars"><div className="bar-column"><div className="bar sales-bar" style={{ height: `${Math.max(10, totals.sales ? 100 : 10)}%` }} /><small>{label("Sales", "বিক্রি")}</small></div><div className="bar-column"><div className="bar expense-bar" style={{ height: `${Math.max(8, totals.sales ? Math.min(100, totals.expenses / Math.max(totals.sales, 1) * 100) : 8)}%` }} /><small>{label("Expenses", "খরচ")}</small></div></div></div>
                <p className="chart-footnote">{label("This chart uses the entries you add. It is not connected to a bank or payment provider.", "এই চার্টে আপনার যোগ করা তথ্য দেখানো হয়। এটি ব্যাংক বা পেমেন্ট সেবার সাথে যুক্ত নয়।")}</p>
              </section>
              <section className="panel health-panel"><div className="panel-heading"><div><h2>{label("Business health", "ব্যবসার অবস্থা")}</h2><p>{label("A simple financial signal", "সহজ আর্থিক ইঙ্গিত")}</p></div><span className="health-icon">✦</span></div><div className="health-score"><strong>{totals.profit >= 0 ? label("Good", "ভালো") : label("Review", "পর্যালোচনা")}</strong><span>{label("Based on recorded entries", "সংরক্ষিত তথ্যের ভিত্তিতে")}</span></div><div className="health-line"><span style={{ width: `${totals.sales ? Math.max(8, Math.min(100, totals.profit / Math.max(totals.sales, 1) * 100 + 50)) : 8}%` }} /></div><p className="health-tip">{totals.profit >= 0 ? label("Your recorded sales are higher than expenses. Keep tracking every cost.", "সংরক্ষিত বিক্রি খরচের চেয়ে বেশি। প্রতিটি খরচ লিখে রাখুন।") : label("Recorded expenses are higher than sales. Review your costs and entries.", "সংরক্ষিত খরচ বিক্রির চেয়ে বেশি। খরচ ও হিসাব যাচাই করুন।")}</p></section>
            </div>
            <section className="panel transactions"><div className="panel-heading"><div><h2>{label("Recent activity", "সাম্প্রতিক কার্যক্রম")}</h2><p>{label("Latest sales and expenses", "সর্বশেষ বিক্রি ও খরচ")}</p></div><button className="text-button" onClick={() => setTab("sales")}>{label("View sales", "বিক্রি দেখুন")} →</button></div><ActivityList sales={store.sales.slice(0, 3)} expenses={store.expenses.slice(0, 2)} /></section>
            <section className="quick-grid">
              <QuickAction icon="↗" title={label("Record a sale", "বিক্রি লিখুন")} desc={label("Add money coming in", "আয়ের তথ্য যোগ করুন")} tone="green-bg" onClick={() => openForm("sale")} />
              <QuickAction icon="↘" title={label("Add an expense", "খরচ যোগ করুন")} desc={label("Track where money goes", "টাকা কোথায় খরচ হচ্ছে লিখুন")} tone="orange-bg" onClick={() => openForm("expense")} />
              <QuickAction icon="♙" title={label("Add a customer", "কাস্টমার যোগ করুন")} desc={label("Build your customer list", "কাস্টমার তালিকা তৈরি করুন")} tone="purple-bg" onClick={() => openForm("customer")} />
            </section>
          </>}

          {tab === "sales" && <DataPanel title={label("Sales records", "বিক্রির হিসাব")} subtitle={money(totals.sales)} action={label("Add sale", "বিক্রি যোগ")} onAdd={() => openForm("sale")}><div className="table-wrap"><table><thead><tr><th>{label("Description", "বিবরণ")}</th><th>{label("Customer", "কাস্টমার")}</th><th>{label("Date", "তারিখ")}</th><th>{label("Amount", "পরিমাণ")}</th></tr></thead><tbody>{store.sales.map(s => <tr key={s.id}><td>{s.title}</td><td>{s.customer}</td><td>{s.date}</td><td className="positive">{money(s.amount)}</td></tr>)}</tbody></table>{store.sales.length === 0 && <Empty text={label("No sales yet. Add your first sale.", "এখনো বিক্রি যোগ হয়নি। প্রথম বিক্রিটি যোগ করুন।")} />}</div></DataPanel>}

          {tab === "expenses" && <DataPanel title={label("Expense records", "খরচের হিসাব")} subtitle={money(totals.expenses)} action={label("Add expense", "খরচ যোগ")} onAdd={() => openForm("expense")}><div className="table-wrap"><table><thead><tr><th>{label("Description", "বিবরণ")}</th><th>{label("Category", "ধরন")}</th><th>{label("Date", "তারিখ")}</th><th>{label("Amount", "পরিমাণ")}</th></tr></thead><tbody>{store.expenses.map(e => <tr key={e.id}><td>{e.title}</td><td>{e.category}</td><td>{e.date}</td><td className="negative">{money(e.amount)}</td></tr>)}</tbody></table>{store.expenses.length === 0 && <Empty text={label("No expenses yet.", "এখনো কোনো খরচ যোগ হয়নি।")} />}</div></DataPanel>}

          {tab === "customers" && <DataPanel title={label("Customer book", "কাস্টমার তালিকা")} subtitle={`${store.customers.length} ${label("saved customers", "জন কাস্টমার সংরক্ষিত")}`} action={label("Add customer", "কাস্টমার যোগ")} onAdd={() => openForm("customer")}><div className="customer-list">{store.customers.map(c => <div className="customer-row" key={c.id}><div className="customer-avatar">{c.name.slice(0, 1).toUpperCase()}</div><div className="customer-info"><b>{c.name}</b><small>{c.phone} · {c.note}</small></div><span className="customer-status">Saved</span></div>)}{store.customers.length === 0 && <Empty text={label("Your customer list is empty.", "কাস্টমার তালিকা খালি।")} />}</div></DataPanel>}

          {tab === "inventory" && <DataPanel title={label("Product inventory", "পণ্যের স্টক")} subtitle={`${store.products.length} ${label("products tracked", "টি পণ্যের হিসাব")}`} action={label("Add product", "পণ্য যোগ")} onAdd={() => openForm("product")}><div className="table-wrap"><table><thead><tr><th>{label("Product", "পণ্য")}</th><th>{label("Stock", "স্টক")}</th><th>{label("Unit price", "একক মূল্য")}</th><th>{label("Status", "অবস্থা")}</th></tr></thead><tbody>{store.products.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.stock}</td><td>{money(p.price)}</td><td><span className={p.stock <= 5 ? "stock-low" : "stock-ok"}>{p.stock <= 5 ? label("Low stock", "স্টক কম") : label("In stock", "স্টক আছে")}</span></td></tr>)}</tbody></table>{store.products.length === 0 && <Empty text={label("No products added yet.", "এখনো কোনো পণ্য যোগ হয়নি।")} />}</div></DataPanel>}

          {tab === "privacy" && <section className="privacy-grid"><div className="panel privacy-main"><div className="privacy-symbol">◈</div><h2>{label("Your data. Your control.", "আপনার তথ্য, আপনার নিয়ন্ত্রণ।")}</h2><p>{label("This demo workspace stores its data in this browser on this device. It is not connected to an AI provider or cloud database.", "এই ডেমো ওয়ার্কস্পেসের তথ্য এই ডিভাইসের ব্রাউজারে থাকে। এটি এখনো কোনো AI সেবা বা ক্লাউড ডেটাবেসের সাথে যুক্ত নয়।")}</p><div className="privacy-status"><span className="status-dot" /> {label("External AI access: OFF", "বাহ্যিক AI অ্যাক্সেস: বন্ধ")}</div><div className="privacy-note"><b>{label("Important", "গুরুত্বপূর্ণ")}</b><span>{label("Do not enter real customer or sensitive business information in this demo. Browser storage is not a secure production database.", "এই ডেমোতে আসল কাস্টমার বা সংবেদনশীল ব্যবসায়িক তথ্য দেবেন না। ব্রাউজারের স্টোরেজ নিরাপদ প্রোডাকশন ডেটাবেস নয়।")}</span></div></div><div className="panel privacy-checks"><h2>{label("Privacy checklist", "গোপনীয়তা চেকলিস্ট")}</h2><Check title={label("No AI API connected", "AI API সংযুক্ত নয়")} desc={label("No business data is sent to an AI provider.", "কোনো ব্যবসার তথ্য AI সেবায় পাঠানো হচ্ছে না।")} /><Check title={label("No cloud sync", "ক্লাউড সিঙ্ক নেই")} desc={label("Demo entries stay in this browser.", "ডেমোর তথ্য এই ব্রাউজারেই থাকে।")} /><Check title={label("Production security not configured", "প্রোডাকশন নিরাপত্তা সেটআপ হয়নি")} desc={label("Authentication, database security and backups are still required.", "লগইন, ডেটাবেস নিরাপত্তা ও ব্যাকআপ এখনো সেটআপ করতে হবে।")} warn /><button className="outline-button" onClick={() => { if (confirm(label("Delete all demo data stored in this browser?", "এই ব্রাউজারে রাখা সব ডেমো তথ্য মুছে ফেলবেন?"))) { localStorage.removeItem("sellermate-demo-v1"); setStore({ sales: [], expenses: [], customers: [], products: [] }); } }}>{label("Delete local demo data", "এই ডিভাইসের ডেমো তথ্য মুছুন")}</button></div></section>}

          <footer className="footer"><span>© 2026 SellerMate</span><span>{label("Built for small business owners", "ছোট ব্যবসায়ীদের জন্য তৈরি")}</span><span className="demo-tag">DEMO WORKSPACE</span></footer>
        </div>
      </section>

      {form && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setForm(null); }}><form className="modal" onSubmit={submitForm}>
        <div className="modal-head"><div><p className="eyebrow">{label("QUICK ENTRY", "দ্রুত তথ্য যোগ")}</p><h2>{form === "sale" ? label("Record a sale", "বিক্রি লিখুন") : form === "expense" ? label("Add an expense", "খরচ যোগ করুন") : form === "customer" ? label("Add a customer", "কাস্টমার যোগ করুন") : label("Add a product", "পণ্য যোগ করুন")}</h2></div><button type="button" className="close-button" onClick={() => setForm(null)}>×</button></div>
        {(form === "sale" || form === "expense") && <><label>{label("Description", "বিবরণ")}<input name="title" required placeholder={form === "sale" ? "e.g. Online order" : "e.g. Delivery charge"} /></label><label>{label("Amount (BDT)", "পরিমাণ (টাকা)")}<input name="amount" type="number" min="1" step="1" required placeholder="1500" /></label>{form === "sale" ? <label>{label("Customer (optional)", "কাস্টমার (ঐচ্ছিক)")}<input name="customer" placeholder="Customer name" /></label> : <label>{label("Category", "খরচের ধরন")}<select name="category"><option>Stock</option><option>Delivery</option><option>Packaging</option><option>Salary</option><option>Rent</option><option>Other</option></select></label>}</>}
        {form === "customer" && <><label>{label("Customer name", "কাস্টমারের নাম")}<input name="name" required placeholder="Name" /></label><label>{label("Phone number", "ফোন নম্বর")}<input name="phone" required placeholder="01XXXXXXXXX" /></label><label>{label("Note (optional)", "নোট (ঐচ্ছিক)")}<input name="note" placeholder="Regular customer" /></label></>}
        {form === "product" && <><label>{label("Product name", "পণ্যের নাম")}<input name="name" required placeholder="Product name" /></label><label>{label("Stock quantity", "স্টকের পরিমাণ")}<input name="stock" type="number" min="0" required placeholder="10" /></label><label>{label("Unit price (BDT)", "একক মূল্য (টাকা)")}<input name="price" type="number" min="0" required placeholder="500" /></label></>}
        <div className="modal-actions"><button type="button" className="outline-button" onClick={() => setForm(null)}>{label("Cancel", "বাতিল")}</button><button type="submit" className="primary-button">{label("Save entry", "সেভ করুন")} →</button></div><p className="modal-footnote">{label("Saved locally in this browser only.", "শুধু এই ব্রাউজারে সেভ হবে।")}</p>
      </form></div>}
    </main>
  );
}

function Metric({ title, value, hint, icon, tone }: { title: string; value: string; hint: string; icon: string; tone: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{title}</span><span className={`metric-icon ${tone}`}>{icon}</span></div><strong>{value}</strong><small>{hint}</small></div>;
}
function QuickAction({ icon, title, desc, tone, onClick }: { icon: string; title: string; desc: string; tone: string; onClick: () => void }) {
  return <button className="quick-action" onClick={onClick}><span className={`quick-icon ${tone}`}>{icon}</span><b>{title}</b><small>{desc}</small><i>＋</i></button>;
}
function DataPanel({ title, subtitle, action, onAdd, children }: { title: string; subtitle: string; action: string; onAdd: () => void; children: React.ReactNode }) {
  return <section className="panel full-panel"><div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="primary-button small" onClick={onAdd}>＋ {action}</button></div>{children}</section>;
}
function ActivityList({ sales, expenses }: { sales: Sale[]; expenses: Expense[] }) {
  const items = [...sales.map(x => ({ id: `s${x.id}`, title: x.title, date: x.date, amount: x.amount, type: "sale" })), ...expenses.map(x => ({ id: `e${x.id}`, title: x.title, date: x.date, amount: x.amount, type: "expense" }))];
  return <div className="activity-list">{items.map(item => <div className="activity-row" key={item.id}><span className={`activity-icon ${item.type}`}>{item.type === "sale" ? "↗" : "↘"}</span><div className="activity-title"><b>{item.title}</b><small>{item.date}</small></div><strong className={item.type === "sale" ? "positive" : "negative"}>{item.type === "sale" ? "+" : "−"}{money(item.amount)}</strong></div>)}</div>;
}
function Empty({ text }: { text: string }) { return <div className="empty-state"><span>✧</span><p>{text}</p></div>; }
function Check({ title, desc, warn = false }: { title: string; desc: string; warn?: boolean }) {
  return <div className="check-row"><span className={warn ? "warn" : ""}>{warn ? "!" : "✓"}</span><div><b>{title}</b><small>{desc}</small></div></div>;
}
