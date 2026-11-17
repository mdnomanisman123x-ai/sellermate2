"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase-client";

type Business = {
  id: string;
  name: string;
  currency: string;
};

const panel: React.CSSProperties = {
  width: "100%",
  maxWidth: 440,
  padding: 28,
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  background: "#ffffff",
  boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)"
};

const field: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 11,
  fontSize: 15,
  marginTop: 7,
  color: "#111827",
  background: "#ffffff"
};

const primary: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  border: 0,
  borderRadius: 11,
  background: "#116b4a",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer"
};

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => getSupabaseClient());
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadBusiness = async (currentUser: User) => {
      setLoading(true);
      const { data, error: queryError } = await client
        .from("businesses")
        .select("id, name, currency")
        .eq("owner_id", currentUser.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!active) return;

      if (queryError) {
        setError("ব্যবসার তথ্য লোড করা যায়নি। Supabase-এর businesses টেবিলের RLS policy পরীক্ষা করতে হবে।");
        setBusiness(null);
      } else {
        setError("");
        setBusiness(data as Business | null);
      }
      setLoading(false);
    };

    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        void loadBusiness(currentUser);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        Promise.resolve().then(() => loadBusiness(currentUser));
      } else {
        setBusiness(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [client]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    setBusy(true);
    setError("");
    setMessage("");

    if (mode === "signup") {
      const { data, error: authError } = await client.auth.signUp({
        email: email.trim(),
        password
      });

      if (authError) {
        setError(authError.message);
      } else if (!data.session) {
        setMessage("অ্যাকাউন্ট তৈরি হয়েছে। ইমেইলে Supabase-এর confirmation link এলে সেটিতে চাপ দিয়ে তারপর লগইন করো।");
      } else {
        setMessage("অ্যাকাউন্ট তৈরি হয়েছে। এখন তোমার ব্যবসার নাম যোগ করো।");
      }
    } else {
      const { error: authError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (authError) setError(authError.message);
    }

    setBusy(false);
  }

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !user || !businessName.trim()) return;
    setBusy(true);
    setError("");

    const { data, error: insertError } = await client
      .from("businesses")
      .insert({
        owner_id: user.id,
        name: businessName.trim(),
        currency: "BDT"
      })
      .select("id, name, currency")
      .single();

    if (insertError) {
      setError("ব্যবসার নাম সেভ হয়নি। businesses টেবিলের insert RLS policy এবং কলামগুলো পরীক্ষা করতে হবে।");
    } else {
      setBusiness(data as Business);
    }
    setBusy(false);
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    setBusiness(null);
    setUser(null);
  }

  if (!client) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "#f5f7f6", fontFamily: "Arial, sans-serif" }}>
        <section style={panel}>
          <div style={{ color: "#116b4a", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>SELLERMATE SETUP</div>
          <h1 style={{ margin: "12px 0 8px", color: "#111827", fontSize: 25 }}>Supabase সংযোগ বাকি</h1>
          <p style={{ color: "#4b5563", lineHeight: 1.65 }}>Vercel Project → Settings → Environment Variables-এ নিচের দুটি variable যোগ করো:</p>
          <div style={{ padding: 12, borderRadius: 10, background: "#f3f4f6", color: "#111827", fontSize: 13, lineHeight: 1.9, overflowWrap: "anywhere" }}>
            NEXT_PUBLIC_SUPABASE_URL<br />
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          </div>
          <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6 }}>URL ও Publishable key Supabase Project Settings → API Keys থেকে পাবে। Secret বা service_role key ব্যবহার করবে না এবং কাউকে পাঠাবে না। Variable যোগ করার পর Vercel-এ নতুন deployment করতে হবে।</p>
        </section>
      </main>
    );
  }

  if (loading) {
    return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#116b4a", fontFamily: "Arial, sans-serif" }}>SellerMate লোড হচ্ছে…</main>;
  }

  if (!user) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 18, background: "#f5f7f6", fontFamily: "Arial, sans-serif" }}>
        <section style={panel}>
          <div style={{ color: "#116b4a", fontWeight: 800, letterSpacing: 1, fontSize: 13 }}>SELLERMATE · BUSINESS WORKSPACE</div>
          <h1 style={{ color: "#111827", fontSize: 27, margin: "12px 0 6px" }}>{mode === "login" ? "আবার স্বাগতম" : "নতুন অ্যাকাউন্ট তৈরি করো"}</h1>
          <p style={{ color: "#6b7280", marginTop: 0, lineHeight: 1.5 }}>তোমার ব্যবসার হিসাব নিরাপদ রাখতে ইমেইল দিয়ে প্রবেশ করো।</p>
          <form onSubmit={submitAuth}>
            <label style={{ display: "block", color: "#374151", fontWeight: 600, marginTop: 18 }}>ইমেইল
              <input style={field} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <label style={{ display: "block", color: "#374151", fontWeight: 600, marginTop: 14 }}>পাসওয়ার্ড
              <input style={field} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="কমপক্ষে ৬ অক্ষর" />
            </label>
            {error && <p role="alert" style={{ color: "#b91c1c", fontSize: 13, lineHeight: 1.5 }}>{error}</p>}
            {message && <p role="status" style={{ color: "#116b4a", fontSize: 13, lineHeight: 1.5 }}>{message}</p>}
            <button disabled={busy} type="submit" style={{ ...primary, marginTop: 20, opacity: busy ? 0.65 : 1 }}>{busy ? "অপেক্ষা করো…" : mode === "login" ? "লগইন করো" : "অ্যাকাউন্ট তৈরি করো"}</button>
          </form>
          <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }} style={{ width: "100%", marginTop: 15, padding: 10, border: 0, background: "transparent", color: "#116b4a", fontWeight: 700, cursor: "pointer" }}>
            {mode === "login" ? "নতুন অ্যাকাউন্ট খুলবে? এখানে চাপো" : "আগে অ্যাকাউন্ট আছে? লগইন করো"}
          </button>
        </section>
      </main>
    );
  }

  if (!business) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 18, background: "#f5f7f6", fontFamily: "Arial, sans-serif" }}>
        <section style={panel}>
          <div style={{ color: "#116b4a", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>YOUR BUSINESS WORKSPACE</div>
          <h1 style={{ color: "#111827", fontSize: 26, margin: "12px 0 6px" }}>তোমার ব্যবসার নাম কী?</h1>
          <p style={{ color: "#6b7280", lineHeight: 1.6 }}>এই নাম দিয়ে তোমার SellerMate workspace তৈরি হবে।</p>
          <form onSubmit={createBusiness}>
            <label style={{ display: "block", color: "#374151", fontWeight: 600 }}>ব্যবসার নাম
              <input style={field} required maxLength={80} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="যেমন: নোমান ট্রেডার্স" />
            </label>
            {error && <p role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}
            <button disabled={busy} type="submit" style={{ ...primary, marginTop: 20, opacity: busy ? 0.65 : 1 }}>{busy ? "সেভ হচ্ছে…" : "Workspace তৈরি করো"}</button>
          </form>
          <button type="button" onClick={signOut} style={{ marginTop: 14, border: 0, background: "transparent", color: "#6b7280", cursor: "pointer" }}>লগআউট</button>
        </section>
      </main>
    );
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "9px 16px", background: "#eaf5ef", color: "#14532d", fontSize: 12, fontFamily: "Arial, sans-serif" }}>
        <span><strong>{business.name}</strong> · Supabase account connected. বিক্রি/খরচ/স্টক ডেটা সংযোগ পরের ধাপে হবে।</span>
        <button type="button" onClick={signOut} style={{ border: "1px solid #b7d7c5", background: "#fff", borderRadius: 8, padding: "5px 10px", color: "#14532d", cursor: "pointer" }}>লগআউট</button>
      </div>
      {children}
    </>
  );
}
