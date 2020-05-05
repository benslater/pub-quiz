let _csrf;

export default async (url, opts) => {
  if (!_csrf) {
    const { _csrf: csrf } = await (
      await fetch("http://localhost:3000/api/get-csrf")
    ).json();
    _csrf = csrf;
  }

  const fetchOpts = {
    ...opts,
    body: ["POST", "PUT", "DELETE"].includes(opts.method)
      ? JSON.stringify({ ...opts.body, _csrf })
      : undefined,
  };

  return await fetch(url, fetchOpts);
};
