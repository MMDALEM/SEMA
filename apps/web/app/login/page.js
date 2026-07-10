'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Alert, Button, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [uniqueCode, setUniqueCode] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  function startCountdown(seconds) {
    setCountdown(seconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function requestOtp(e) {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/login/request', {
        method: 'POST',
        body: { uniqueCode: uniqueCode.trim() },
      });
      setPhoneMasked(data.phoneMasked);
      setInfo(data.message);
      setStep(2);
      startCountdown(120);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/auth/login/verify', {
        method: 'POST',
        body: { uniqueCode: uniqueCode.trim(), otp: otp.trim() },
      });
      router.replace('/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white">
            س
          </div>
          <h1 className="text-2xl font-bold text-slate-800">سما</h1>
          <p className="mt-1 text-sm text-slate-500">سیستم مدیریت اداری سازمان</p>
        </div>

        {step === 1 && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                کد یکتای شما
              </label>
              <Input
                dir="ltr"
                placeholder="SEMA-XXXX-XXXX"
                className="text-center font-mono tracking-widest"
                value={uniqueCode}
                onChange={(e) => setUniqueCode(e.target.value.toUpperCase())}
                autoFocus
                required
              />
              <p className="mt-1.5 text-xs text-slate-400">
                کد یکتا هنگام ثبت‌نام توسط مدیریت به شما داده شده است
              </p>
            </div>
            <Alert>{error}</Alert>
            <Button type="submit" className="w-full" disabled={loading || !uniqueCode.trim()}>
              {loading ? 'در حال ارسال...' : 'دریافت کد یک‌بارمصرف'}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <Alert tone="blue">کد ۶ رقمی به شماره {phoneMasked} پیامک شد</Alert>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                کد یک‌بارمصرف
              </label>
              <Input
                dir="ltr"
                inputMode="numeric"
                maxLength={6}
                placeholder="− − − − − −"
                className="text-center font-mono text-lg tracking-[0.5em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                required
              />
            </div>
            <Alert>{error}</Alert>
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? 'در حال بررسی...' : 'ورود به سیستم'}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
              >
                تغییر کد یکتا
              </button>
              {countdown > 0 ? (
                <span className="text-slate-400">
                  ارسال مجدد تا {countdown.toLocaleString('fa-IR')} ثانیه
                </span>
              ) : (
                <button
                  type="button"
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                  onClick={requestOtp}
                  disabled={loading}
                >
                  ارسال مجدد کد
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
