use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let manifest_dir = env::var_os("CARGO_MANIFEST_DIR").unwrap();
    let data_dir = Path::new(&manifest_dir).join("..").join("..").join("data");

    println!("cargo:rerun-if-changed=../../data");
    println!("cargo:rerun-if-changed=src/loader.rs");

    #[path = "src/loader.rs"]
    mod loader;

    let policy = loader::load_content_policy(&data_dir).expect("failed to load content policy");

    let json = serde_json::to_string_pretty(&policy).expect("failed to serialize");
    let dest = Path::new(&out_dir).join("content_policy.json");
    fs::write(&dest, json).expect("failed to write content_policy.json");
}
