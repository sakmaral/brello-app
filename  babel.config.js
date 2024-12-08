module.exports = function (api) {
  api.cache(true);

  return {
    plugins: [
      [
        "effector/babel-plugin",
        {
          addNames: api.env("production") === false,
        },
      ],
    ],
  };
};
