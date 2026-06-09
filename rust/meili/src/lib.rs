use phira_content_policy_types::{ContentPolicy, Status};
use serde::{Deserialize, Serialize};

/// Meilisearch 查询时 `filter=type` 用的枚举值。
/// 序列化值与 [`ContentPolicyMeiliDoc`] 的 tag 一致。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ContentPolicyEntityType {
    Track,
    Artist,
    RightsHolder,
}

/// Meilisearch 索引文档。三种实体独立 doc，
/// track 内嵌所属 RH 信息，artist/RH policy 不在 track doc 里 denormalize。
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ContentPolicyMeiliDoc {
    Track {
        name: String,
        artist: String,
        #[serde(skip_serializing_if = "Vec::is_empty")]
        aliases: Vec<String>,
        /// `None` 表示继承所属 Rights Holder 的 policy
        #[serde(skip_serializing_if = "Option::is_none")]
        status: Option<Status>,
        #[serde(skip_serializing_if = "Option::is_none")]
        note: Option<String>,
        /// 所属版权方名称。独立曲目为 `None`。
        #[serde(skip_serializing_if = "Option::is_none")]
        rh_name: Option<String>,
        /// 所属版权方 status。独立曲目为 `None`。
        #[serde(skip_serializing_if = "Option::is_none")]
        rh_status: Option<Status>,
        /// 所属版权方备注。独立曲目为 `None`。
        #[serde(skip_serializing_if = "Option::is_none")]
        rh_note: Option<String>,
    },
    Artist {
        name: String,
        #[serde(skip_serializing_if = "Vec::is_empty")]
        aliases: Vec<String>,
        status: Status,
        #[serde(skip_serializing_if = "Option::is_none")]
        reason: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        note: Option<String>,
    },
    RightsHolder {
        name: String,
        status: Status,
        #[serde(skip_serializing_if = "Option::is_none")]
        note: Option<String>,
        track_count: usize,
    },
}

/// 从 [`ContentPolicy`] 构建 Meilisearch 索引文档。
///
/// 只做数据转换，不涉及 Meilisearch SDK / HTTP。
pub fn build_meili_index(policy: ContentPolicy) -> Vec<ContentPolicyMeiliDoc> {
    let mut docs = Vec::new();

    // 版权方下曲目——内嵌 RH 信息
    for (_rh_id, rh) in policy.rights_holders {
        let track_count = rh.tracks.len();
        for track in rh.tracks {
            docs.push(ContentPolicyMeiliDoc::Track {
                name: track.name,
                artist: track.artist,
                aliases: track.aliases,
                status: track.status,
                note: track.note,
                rh_name: Some(rh.policy.name.clone()),
                rh_status: Some(rh.policy.status),
                rh_note: rh.policy.note.clone(),
            });
        }
        docs.push(ContentPolicyMeiliDoc::RightsHolder {
            name: rh.policy.name,
            status: rh.policy.status,
            note: rh.policy.note,
            track_count,
        });
    }

    // 独立曲目——无 RH
    for track in policy.independent_tracks {
        docs.push(ContentPolicyMeiliDoc::Track {
            name: track.name,
            artist: track.artist,
            aliases: track.aliases,
            status: Some(track.status),
            note: track.note,
            rh_name: None,
            rh_status: None,
            rh_note: None,
        });
    }

    // 艺人
    for (_artist_id, artist) in policy.artists {
        docs.push(ContentPolicyMeiliDoc::Artist {
            name: artist.name,
            aliases: artist.aliases,
            status: artist.status,
            reason: artist.reason,
            note: artist.note,
        });
    }

    docs
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn entity_type_matches_meili_doc_tag() {
        // 用最小 dummy 构造三种 doc，验证 tag 值一致
        let track_doc = ContentPolicyMeiliDoc::Track {
            name: "T".into(),
            artist: "A".into(),
            aliases: vec![],
            status: None,
            note: None,
            rh_name: None,
            rh_status: None,
            rh_note: None,
        };
        let track_json = serde_json::to_value(&track_doc).unwrap();
        assert_eq!(
            track_json["type"].as_str().unwrap(),
            serde_json::to_value(ContentPolicyEntityType::Track)
                .unwrap()
                .as_str()
                .unwrap()
        );

        let artist_doc = ContentPolicyMeiliDoc::Artist {
            name: "A".into(),
            aliases: vec![],
            status: Status::Free,
            reason: None,
            note: None,
        };
        let artist_json = serde_json::to_value(&artist_doc).unwrap();
        assert_eq!(
            artist_json["type"].as_str().unwrap(),
            serde_json::to_value(ContentPolicyEntityType::Artist)
                .unwrap()
                .as_str()
                .unwrap()
        );

        let rh_doc = ContentPolicyMeiliDoc::RightsHolder {
            name: "R".into(),
            status: Status::Forbidden,
            note: None,
            track_count: 0,
        };
        let rh_json = serde_json::to_value(&rh_doc).unwrap();
        assert_eq!(
            rh_json["type"].as_str().unwrap(),
            serde_json::to_value(ContentPolicyEntityType::RightsHolder)
                .unwrap()
                .as_str()
                .unwrap()
        );
    }
}
