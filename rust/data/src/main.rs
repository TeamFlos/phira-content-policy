fn main() {
    let policy = phira_content_policy_data::content_policy();
    serde_json::to_writer_pretty(std::io::stdout(), policy).unwrap();
}
