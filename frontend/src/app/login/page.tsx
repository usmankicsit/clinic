'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthField,
  AuthForm,
  AuthLink,
  AuthLinks,
  AuthShell,
  DemoAccountPicker,
  type DemoAccount,
} from '@/components/AuthShell';
import { homeForRole, useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

const STAFF_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Admin',
    hint: 'Full clinic control',
    email: 'admin@clinic.health',
    password: 'Admin123!',
  },
  {
    label: 'Staff',
    hint: 'POS & orders',
    email: 'staff@clinic.health',
    password: 'Cashier123!',
  },
];

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(homeForRole(user.role));
    }
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const u = await login(email, password);
      if (u.role === 'CUSTOMER') {
        router.replace('/shop');
        return;
      }
      router.replace(homeForRole(u.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      brand="Bait Al Shifa"
      tagline="Clinic workspace"
      title="Staff sign in"
      subtitle="Enter your staff email and password to continue."
      variant="staff"
      footer={
        <AuthLinks>
          <span>
            Ordering as a guest? <AuthLink href="/shop/login">Customer login</AuthLink>
          </span>
          <span>
            New customer? <AuthLink href="/shop/register">Create account</AuthLink>
          </span>
        </AuthLinks>
      }
    >
      <DemoAccountPicker
        accounts={STAFF_ACCOUNTS}
        activeEmail={email}
        onPick={(account) => {
          setEmail(account.email);
          setPassword(account.password);
          setError('');
        }}
      />
      <AuthForm
        onSubmit={onSubmit}
        submitLabel="Sign in to workspace"
        submitting={submitting}
        error={error}
      >
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="off"
          required
          placeholder="you@clinic.health"
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
        />
      </AuthForm>
    </AuthShell>
  );
}
