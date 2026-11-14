
"use client";

import { useState } from "react";
import Link from "next/link";

type Job = {
  id: number;
  store: string;
  title: string;
  time: string;
  pay: string;
  location: string;
  applicants: number;
  applied: boolean;
};

export default function DemoPage() {
  const [role, setRole] = useState<"worker" | "owner">("worker");

  const [jobs, setJobs] = useState<Job[]>([
    {
      id: 1,
      store: "브루데이 강남점",
      title: "카페 음료 제조 및 매장 정리",
      time: "오늘 17:00 ~ 22:00",
      pay: "시급 12,000원",
      location: "서울 강남구",
      applicants: 2,
      applied: false,
    },
    {
      id: 2,
      store: "모카정원 홍대점",
      title: "카페 홀 업무",
      time: "오늘 18:00 ~ 23:00",
      pay: "시급 13,000원",
      location: "서울 마포구",
      applicants: 1,
      applied: false,
    },
    {
      id: 3,
      store: "라운드빈 성수점",
      title: "음료 제조 및 고객 응대",
      time: "내일 10:00 ~ 16:00",
      pay: "시급 12,500원",
      location: "서울 성동구",
      applicants: 0,
      applied: false,
    },
  ]);

  const [store, setStore] = useState("");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [pay, setPay] = useState("");
  const [location, setLocation] = useState("");

  function applyJob(id: number) {
    setJobs((current) =>
      current.map((job) =>
        job.id === id && !job.applied
          ? {
              ...job,
              applied: true,
              applicants: job.applicants + 1,
            }
          : job
      )
    );
  }

  function addJob(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!store.trim() || !title.trim() || !time.trim() ||
        !pay.trim() || !location.trim()) {
      return;
    }

    const newJob: Job = {
      id: Date.now(),
      store,
      title,
      time,
      pay,
      location,
      applicants: 0,
      applied: false,
    };

    setJobs((current) => [newJob, ...current]);

    setStore("");
    setTitle("");
    setTime("");
    setPay("");
    setLocation("");

    alert("구인 공고가 등록됐어요!");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="text-2xl font-black text-blue-600">
              JOBPANG
            </h1>
            <p className="text-xs text-gray-500">
              오늘 일, 지금 잡자!
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600">
            DEMO MODE
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-8">
        <h2 className="text-2xl font-bold text-gray-900">
          어떤 서비스를 이용하시나요?
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          점주와 구직자 화면을 자유롭게 전환해 보세요. 데모 데이터는 실제 계정에 저장되지 않습니다.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
        >
          실제 계정으로 로그인 / 회원가입
        </Link>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setRole("worker")}
            className={`rounded-xl border p-5 text-left ${
              role === "worker"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <span className="text-2xl">👷</span>
            <h3 className="mt-2 font-bold">구직자</h3>
            <p className="mt-1 text-xs text-gray-500">
              일자리를 찾고 지원하기
            </p>
          </button>

          <button
            onClick={() => setRole("owner")}
            className={`rounded-xl border p-5 text-left ${
              role === "owner"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <span className="text-2xl">🏪</span>
            <h3 className="mt-2 font-bold">점주</h3>
            <p className="mt-1 text-xs text-gray-500">
              구인 공고 등록 및 지원자 관리
            </p>
          </button>
        </div>

        {role === "worker" ? (
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                긴급 구인 공고
              </h2>
              <span className="text-sm text-gray-500">
                총 {jobs.length}건
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {jobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-600">
                        {job.store}
                      </p>
                      <h3 className="mt-2 font-bold text-gray-900">
                        {job.title}
                      </h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                      모집 중
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p>📍 {job.location}</p>
                    <p>🕒 {job.time}</p>
                    <p>💰 {job.pay}</p>
                    <p>👥 지원자 {job.applicants}명</p>
                  </div>

                  <button
                    onClick={() => applyJob(job.id)}
                    disabled={job.applied}
                    className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-bold text-white disabled:bg-gray-300"
                  >
                    {job.applied ? "지원 완료" : "공고 지원하기"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-10">
            <h2 className="text-xl font-bold">
              구인 공고 등록
            </h2>

            <form
              onSubmit={addJob}
              className="mt-5 space-y-4 rounded-xl border bg-white p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  매장명
                </label>
                <input
                  value={store}
                  onChange={(e) => setStore(e.target.value)}
                  placeholder="예: 브루데이 강남점"
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  업무 내용
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 음료 제조 및 매장 정리"
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  근무 시간
                </label>
                <input
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="예: 오늘 17:00 ~ 22:00"
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  급여
                </label>
                <input
                  value={pay}
                  onChange={(e) => setPay(e.target.value)}
                  placeholder="예: 시급 12,000원"
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  근무 지역
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="예: 서울 강남구"
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white"
              >
                구인 공고 등록하기
              </button>
            </form>

            <h2 className="mt-10 text-xl font-bold">
              등록된 공고 및 지원자 현황
            </h2>

            <div className="mt-5 space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border bg-white p-5"
                >
                  <h3 className="font-bold">{job.store}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {job.title}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-blue-600">
                    지원자 {job.applicants}명
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>

      <footer className="border-t bg-white py-6 text-center text-xs text-gray-400">
        JOBPANG DEMO · 임시 데이터로 작동합니다.
      </footer>
    </main>
  );
}
