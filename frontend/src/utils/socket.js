let _csrf;

export default {
  post: async (url, body) => {
    if (!_csrf) {
      const { _csrf: csrf } = await (
        await fetch("http://localhost:1337/get-csrf")
      ).json();
      _csrf = csrf;
    }

    return await io.socket.post(url, { ...body, _csrf });
  },
  get: async (url) => await io.socket.get(url),
  on: (url, callback) => io.socket.on(url, callback),
};
