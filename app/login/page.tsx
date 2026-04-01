'use client';

import React from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { Navbar } from '@/components/layout/navbar';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12 flex justify-center">
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </main>
    </div>
  );
}
