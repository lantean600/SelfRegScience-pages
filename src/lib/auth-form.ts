/** Shared client logic for login / register forms. */
export async function parseAuthResponse(res: Response): Promise<{
  ok: boolean;
  error?: string;
}> {
  let data: { error?: string } = {};
  try {
    const text = await res.text();
    if (text) data = JSON.parse(text) as { error?: string };
  } catch {
    /* HTML error page or empty body */
  }

  if (!res.ok) {
    return {
      ok: false,
      error:
        data.error ??
        (res.status === 401
          ? "邮箱或密码错误"
          : res.status === 409
            ? "邮箱已注册"
            : `请求失败（${res.status}）`),
    };
  }

  return { ok: true };
}
