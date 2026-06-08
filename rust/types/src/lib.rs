use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Status {
    /// 无限制
    Free,
    /// 需要额外许可或满足特定条件
    Restricted,
    /// 禁止使用
    Forbidden,
}

/** 版权持有方/厂牌（如 lowiro、Rayark）的自身 policy */
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RightsHolderPolicy {
    pub name: String,
    pub status: Status,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

/**
 * 一首具体曲目。归属于某个 Rights Holder，
 * 可通过 artist_ids 关联到 Artist 条目
 */
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackEntry {
    pub name: String,
    pub artist: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artist_ids: Option<Vec<String>>,
    pub status: Status,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

/**
 * 艺人/创作者个体。拥有自身的 policy（如黑名单、二创要求），
 * 不包含曲目数据
 */
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Artist {
    pub name: String,
    pub status: Status,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub references: Option<Vec<String>>,
}

/**
 * 加载后的一个 Rights Holder 全量数据。
 * policy 来自 _policy.toml，tracks 来自其余 toml 文件的曲目合集
 */
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedRightsHolder {
    pub policy: RightsHolderPolicy,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tracks: Vec<TrackEntry>,
}

/**
 * 内容策略数据库的完整数据集。
 *
 * rights_holders 的 key 为 data/rights_holders/ 下的目录名，
 * artists 的 key 为 data/artists/ 下的文件名（不含 .toml 后缀）。
 * 查询时所有维度并列展示，综合结论取最严格 status
 */
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentPolicy {
    #[serde(default)]
    pub rights_holders: HashMap<String, ResolvedRightsHolder>,
    #[serde(default)]
    pub artists: HashMap<String, Artist>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub independent_tracks: Vec<TrackEntry>,
}
