## 代码相关
- [x] 前端展示
  - [x] 搜索功能
- [x] 部署一个 github.io 页面展示数据
- [ ] loader增加artistIds相关检查（类型安全？）
- [x] 曲目和作者的别名机制（便于搜索）
- [ ] 补充搜索维度（目前应该是给定曲目的标题和作者，分别搜，不对结果直接取交集而是都汇报）

## 数据待补齐
- [x] **Phigros 曲目列表** — 目前有 `_policy.toml`（forbidden）但无具体曲目。需要找到 Phigros 本家曲目的完整列表（含曲名、曲师），否则搜 Phigros 歌名不会有命中
- [ ] **Paradigm:Reboot 曲目列表** — 同上，只有 policy 无曲目
- [ ] **Rayark 曲目列表** — 同上，覆盖 Cytus/deemo/兰空 系列
- [ ] **Disney 曲目列表** — 同上
- [ ] **Phigros 曲目关联 artistIds** — 曲师列表中可能有已在 `data/artists/` 或需要新建 artist 条目的
- [ ] **lowiro 曲目关联 artistIds** — lowiro 下部分曲目曲师（如 Ice、rN）已有 `data/artists/` 条目，可在对应 track 上加 `artistIds` 做关联
- [ ] **Vivid/Stasis 曲目可关联 artistIds** — 57 首歌的曲师中可能有已在 `data/artists/` 或需要新建 artist 条目的
- [ ] **曲师引用来源** — 目前各 artist 条目的 note 来自 docx 转述，缺少原文链接引用
