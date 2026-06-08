**中文** | [English](README.en.md)

# Phira Content Policy

[Phira](https://phira.teamflos.com/) 社区的内容策略数据库。提供可查询、可追溯的版权策略信息，帮助判断某首曲目、某个版权方或某位艺人在 Phira 上是否可用。

**在线查询：[teamflos.github.io/phira-content-policy](https://teamflos.github.io/phira-content-policy/)**

## 数据源

数据以 TOML 文件存放在 `data/` 目录下，通过 Git 维护：

```
data/
  rights_holders/  ← 版权方（每方一个子目录）
    lowiro/
      _policy.toml   # 版权方自身的策略声明
      *.toml          # 下属曲目（可拆多个文件）
  artists/          ← 艺人维度策略（每个艺人一个 .toml）
  independent/      ← 无明确版权方的曲目
```

数据有误？前往 [Issues](https://github.com/TeamFlos/phira-content-policy/issues) 反馈。
