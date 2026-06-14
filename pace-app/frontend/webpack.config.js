const path = require("path");

module.exports = {
  entry: {
    home:           "./islands/home/index.tsx",
    planning:       "./islands/planning/index.tsx",
    "daily-report": "./islands/daily-report/index.tsx",
    manhour:        "./islands/manhour/index.tsx",
    "dashboard-1":  "./islands/dashboard-1/index.tsx",
    "dashboard-2":  "./islands/dashboard-2/index.tsx",
    timesheet:      "./islands/timesheet/index.tsx",
    "master-data":  "./islands/master-data/index.tsx",
  },
  output: {
    path: path.resolve(__dirname, "../app/static/js"),
    filename: "[name].bundle.js",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "all",
        },
      },
    },
  },
};