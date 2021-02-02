const config = {
  ssh: {
    test: {
      host: "100.100.100.xxx",
      port: "22",
      username: "root",
      password: "xxxx"
    },
    prod: {
      host: "200.200.200.xxx",
      port: "22",
      username: "root",
      password: "xxxxx"
    }
  }
}

module.exports = config;