import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-10 bg-white">
      {children}
    </div>
  );
}
