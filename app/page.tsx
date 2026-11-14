
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "worker">("worker");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!name.trim()) {
      setMessage("이름을 입력해 주세요.");
      return;
    }

    if (password.length < 6) {
      setMessage("비밀번호는 6자 이상 입력해 주세요.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name.trim(),
          role,
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(`회원가입 실패: ${error.message}`);
      return;
    }

    setMessage(
      "회원가입 요청이 완료됐어요. 이메일 인증이 필요하다면 받은 메일에서 인증을 진행해 주세요."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          JOBPANG
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          오늘 일, 지금 잡자!
        </p>

        <h2 className="mt-8 text-xl font-bold text-gray-900">
          회원가입
        </h2>

        <form onSubmit={handleSignup} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력해 주세요"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상 입력해 주세요"
              minLength={6}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium">
              가입 유형
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("worker")}
                className={`rounded-lg border p-4 text-sm font-semibold ${
                  role === "worker"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                구직자
                <span className="mt-1 block text-xs font-normal">
                  일자리를 찾고 있어요
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole("owner")}
                className={`rounded-lg border p-4 text-sm font-semibold ${
                  role === "owner"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                점주
                <span className="mt-1 block text-xs font-normal">
                  일할 사람을 찾고 있어요
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "가입 처리 중..." : "회원가입"}
          </button>

          {message && (
            <p className="break-words text-sm text-blue-700">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
