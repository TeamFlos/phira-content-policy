# Phira Content Policy — 需求简报

> **读者**：没有接触过审核工作的项目开发者
>
> **目标**：建立一个结构化的内容策略数据库，供审核志愿者和上传者查询"某首曲子 / 某个版权方 / 某位艺人在 Phira 上是否可用"。

## 1. 背景与动机

Phira 是一个 UGC 音游社区，用户上传的谱面涉及大量第三方音乐和素材。目前版权策略散落在审核群的聊天记录和少数人的脑子里，缺乏统一的可查询来源。

本项目要解决的问题：**让任何一个审核志愿者或上传者，能在几秒钟内查到"这个东西能不能用、为什么"。**

## 2. 核心概念（Ubiquitous Language）

| 术语              | 含义                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **Rights Holder** | 版权持有方/厂牌（如 lowiro、Rayark、Pigeon Games）。拥有自身的 policy，并下辖具体的曲目条目。 |
| **Artist**        | 艺人/创作者个体。拥有自身的 policy（如黑名单、特殊二创要求），不包含曲目数据。                |
| **Track**         | 一首具体曲目。归属于某个 Rights Holder，可关联一个或多个 Artist。                             |
| **Policy**        | 对某个实体（Rights Holder / Artist / Track）的使用策略判定。                                  |
| **Status**        | 策略状态，取值为以下三种之一：                                                                |
|                   | `forbidden` — 禁止使用                                                                        |
|                   | `restricted` — 需要额外许可或满足特定条件                                                     |
|                   | `free` — 无限制                                                                               |

## 3. 数据模型

### 3.1 Status 枚举

```typescript
type Status = "forbidden" | "restricted" | "free";
```

### 3.2 Rights Holder

每个 Rights Holder 是 `data/rights_holders/` 下的一个目录，目录内包含：

- 一个声明自身 policy 的文件（如 `_policy.toml`）
- 一个或多个包含下属曲目的 `.toml` 文件（文件如何拆分由维护者自行决定）

```toml
# data/rights_holders/lowiro/_policy.toml

name = "lowiro"
status = "forbidden"
note = "Arcaea 发行商，旗下独占曲目一律禁止使用"
```

```toml
# data/rights_holders/lowiro/arcaea.toml

[[track]]
name = "Testify"
artist = "t+pazolite"
artist_ids = ["t_pazolite"]  # 可选，指向 artists/ 下的条目
status = "forbidden"
note = "lowiro 独占曲目"

[[track]]
name = "Grievous Lady"
artist = "Team Grimoire vs Laur"
status = "forbidden"
```

### 3.3 Artist

每个 Artist 是 `data/artists/` 下的一个 `.toml` 文件。仅描述艺人维度的 policy，**不包含曲目数据**。

```toml
# data/artists/pusu.toml

name = "pusu"
status = "forbidden"
reason = "criminal_record"
note = "犯罪记录，社区决策禁止收录其作品"
```

```toml
# data/artists/some_musician.toml

name = "Some Musician"
status = "restricted"
note = "本人声明未经许可不得二创"
references = [
  "原文: https://twitter.com/...",
  "归档: https://web.archive.org/..."
]
```

### 3.4 Independent Tracks

没有明确版权方归属的曲目，放在 `data/independent/` 下。文件如何组织不限，最终会被全部合并。不包含额外元数据。

```toml
# data/independent/misc.toml

[[track]]
name = "Some Free Track"
artist = "Indie Artist"
artist_ids = ["indie_artist"]
status = "free"
```

### 3.5 目录结构总览

```
data/
  rights_holders/
    lowiro/
      _policy.toml          # lowiro 自身的 policy
      arcaea.toml            # 曲目，文件拆分方式随意
      arcaea_collab.toml
    rayark/
      _policy.toml
      cytus.toml
      deemo.toml
    pigeon_games/
      _policy.toml
      phigros.toml
  artists/
    pusu.toml
    ice.toml
    some_musician.toml
  independent/
    misc.toml               # 随意拆分
    vocaloid_stuff.toml
```

## 4. 查询逻辑

### 4.1 查询入口

用户可以按两种方式搜索：

- **按曲目**：输入曲名或艺术家名，匹配 rights_holders 和 independent 下的 track 条目
- **按实体**：输入版权方或艺人名，匹配 rights_holders 和 artists 下的 policy 条目

### 4.2 结果展示

对于一首曲目的查询，前端应展示**所有命中的相关条目**：

1. 曲目自身的 status（如果有对应条目）
2. 所属 Rights Holder 的 status（通过目录归属隐式确定）
3. 关联 Artist 的 status（通过 `artist_ids` 关联，如果存在）

所有维度并列展示，同时在不显著的位置给出一个**自动计算的综合结论**（取所有命中 status 中最严格的值，`forbidden > restricted > free`）。

### 4.3 未命中

如果搜索无任何命中，明确提示"未找到相关策略记录"。**不意味着可以使用**，只意味着数据库尚未收录。

## 5. 技术方案

| 层         | 选型                                                            |
| ---------- | --------------------------------------------------------------- |
| 数据源     | TOML 文件，存放在 Git 仓库中，通过 PR 维护                      |
| 数据校验   | CI 中使用 Zod schema 校验所有 TOML 文件的结构正确性             |
| 前端       | Vue 3 + TypeScript SPA                                          |
| Lint / Fmt | oxlint + oxfmt                                                  |
| CI         | lint（含 typecheck）+ fmt check + Zod 数据校验                  |
| 部署       | Cloudflare Pages                                                |
| 搜索       | 纯前端，构建时将所有 TOML 编译为 JSON，运行时加载并做客户端搜索 |

## 6. 不做的事（当前阶段）

- ❌ 不做用户登录和在线编辑（维护走 Git 仓库）
- ❌ 不做后端 API（纯静态站）
- ❌ 不做与 Phira 游戏客户端/服务端的集成（未来可期，但不是现在）
- ❌ 不做插画/背景素材的策略管理（先聚焦音乐维度）

## 7. 未来可能的演进

- 后端定期拉取数据，在谱面上传阶段做自动预检
- 接入游戏内审核工作台，减少志愿者的手动操作
- 扩展到插画、背景等其他素材类型的策略管理
