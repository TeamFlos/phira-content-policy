use std::sync::LazyLock;

use phira_content_policy_types::ContentPolicy;

mod loader;

pub const CONTENT_POLICY_JSON: &str =
    include_str!(concat!(env!("OUT_DIR"), "/content_policy.json"));

pub fn try_load_content_policy() -> serde_json::Result<ContentPolicy> {
    serde_json::from_str(CONTENT_POLICY_JSON)
}

static CONTENT_POLICY: LazyLock<ContentPolicy> =
    LazyLock::new(|| try_load_content_policy().expect("invalid embedded content policy JSON"));

pub fn content_policy() -> &'static ContentPolicy {
    &CONTENT_POLICY
}

pub use loader::load_content_policy;
