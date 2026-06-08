use std::sync::LazyLock;

use phira_content_policy_types::ContentPolicy;

mod loader;

static CONTENT_POLICY: LazyLock<ContentPolicy> = LazyLock::new(|| {
    let json = include_str!(concat!(env!("OUT_DIR"), "/content_policy.json"));
    serde_json::from_str(json).expect("embedded content policy JSON is valid")
});

pub fn content_policy() -> &'static ContentPolicy {
    &CONTENT_POLICY
}

pub use loader::load_content_policy;
