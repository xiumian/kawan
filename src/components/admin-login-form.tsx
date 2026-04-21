"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("chenfenpro123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: String(formData.get("username") ?? ""),
        password: String(formData.get("password") ?? ""),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setLoading(false);
      setError(data.error ?? "登录失败");
      return;
    }

    startTransition(() => {
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="panel-surface space-y-5">
      <label className="field-shell">
        <span className="field-label">用户名</span>
        <input
          className="field-input"
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={loading}
        />
      </label>

      <label className="field-shell">
        <span className="field-label">密码</span>
        <input
          className="field-input"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
        />
      </label>

      {error ? <div className="text-sm text-rose-300">{error}</div> : null}

      <button className="action-primary w-full justify-center" disabled={loading}>
        {loading ? "登录中..." : "进入后台"}
      </button>
    </form>
  );
}
