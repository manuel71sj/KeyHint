#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "snake_case")]
pub enum PermissionState {
    NotDetermined,
    Denied,
    Granted,
    RevokedDuringRun,
    NeedsRestart,
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "snake_case")]
pub enum FilterDecision {
    Enqueue,
    IgnoreSecureInput,
    IgnoreImeComposing,
    IgnoreDeadKey,
    IgnorePlainText,
    IgnoreNoModifier,
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CandidateKeyEvent {
    pub key: String,
    pub modifiers: Vec<String>,
    pub secure_input_active: bool,
    pub ime_composing: bool,
    pub dead_key_sequence: bool,
    pub plain_text_input: bool,
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SanitizedKeyEvent {
    pub canonical_shortcut: String,
    pub stores_raw_text: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EventCollectorSpikeReport {
    pub permission_state: PermissionState,
    pub supported_permission_states: Vec<PermissionState>,
    pub collector_started: bool,
    pub event_tap_strategy: &'static str,
    pub callback_contract: &'static str,
    pub secure_input_policy: &'static str,
    pub ime_policy: &'static str,
    pub plain_text_policy: &'static str,
    pub stores_raw_text: bool,
    pub manual_checks: Vec<&'static str>,
}

#[cfg(test)]
pub fn classify_event(event: &CandidateKeyEvent) -> FilterDecision {
    if event.secure_input_active {
        return FilterDecision::IgnoreSecureInput;
    }
    if event.ime_composing {
        return FilterDecision::IgnoreImeComposing;
    }
    if event.dead_key_sequence {
        return FilterDecision::IgnoreDeadKey;
    }
    if event.plain_text_input {
        return FilterDecision::IgnorePlainText;
    }
    if event.modifiers.is_empty() {
        return FilterDecision::IgnoreNoModifier;
    }
    FilterDecision::Enqueue
}

#[cfg(test)]
pub fn sanitize_event(event: &CandidateKeyEvent) -> Option<SanitizedKeyEvent> {
    if classify_event(event) != FilterDecision::Enqueue {
        return None;
    }

    let mut parts = event.modifiers.clone();
    parts.push(event.key.to_uppercase());

    Some(SanitizedKeyEvent {
        canonical_shortcut: parts.join("+"),
        stores_raw_text: false,
    })
}

pub fn spike_report() -> EventCollectorSpikeReport {
    EventCollectorSpikeReport {
        permission_state: PermissionState::NotDetermined,
        supported_permission_states: vec![
            PermissionState::NotDetermined,
            PermissionState::Denied,
            PermissionState::Granted,
            PermissionState::RevokedDuringRun,
            PermissionState::NeedsRestart,
        ],
        collector_started: false,
        event_tap_strategy: "CGEventTap listen-only spike; do not start without explicit permission flow",
        callback_contract: "enqueue sanitized compact event only; no matching, UI rendering, storage, or network in callback",
        secure_input_policy: "pause and do not enqueue while Secure Event Input is active or suspected",
        ime_policy: "ignore IME composing/dead-key/plain-text candidates",
        plain_text_policy: "ignore modifier-less typing and never persist raw text/raw key stream",
        stores_raw_text: false,
        manual_checks: vec![
            "Input Monitoring grant/revoke/relaunch",
            "Secure Event Input suppression",
            "IME composing and dead key suppression",
            "password field suppression",
            "10x shortcut burst queue behavior",
        ],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn shortcut_event() -> CandidateKeyEvent {
        CandidateKeyEvent {
            key: "p".to_string(),
            modifiers: vec!["Command".to_string()],
            secure_input_active: false,
            ime_composing: false,
            dead_key_sequence: false,
            plain_text_input: false,
        }
    }

    #[test]
    fn enqueue_modifier_shortcuts_only() {
        let event = shortcut_event();
        assert_eq!(classify_event(&event), FilterDecision::Enqueue);
        let sanitized = sanitize_event(&event).expect("shortcut should sanitize");
        assert_eq!(sanitized.canonical_shortcut, "Command+P");
        assert!(!sanitized.stores_raw_text);
    }

    #[test]
    fn ignore_sensitive_or_plain_text_cases() {
        let mut event = shortcut_event();
        event.secure_input_active = true;
        assert_eq!(classify_event(&event), FilterDecision::IgnoreSecureInput);
        assert_eq!(sanitize_event(&event), None);

        let mut event = shortcut_event();
        event.ime_composing = true;
        assert_eq!(classify_event(&event), FilterDecision::IgnoreImeComposing);
        assert_eq!(sanitize_event(&event), None);

        let mut event = shortcut_event();
        event.dead_key_sequence = true;
        assert_eq!(classify_event(&event), FilterDecision::IgnoreDeadKey);
        assert_eq!(sanitize_event(&event), None);

        let mut event = shortcut_event();
        event.plain_text_input = true;
        assert_eq!(classify_event(&event), FilterDecision::IgnorePlainText);
        assert_eq!(sanitize_event(&event), None);

        let mut event = shortcut_event();
        event.modifiers.clear();
        assert_eq!(classify_event(&event), FilterDecision::IgnoreNoModifier);
        assert_eq!(sanitize_event(&event), None);
    }

    #[test]
    fn report_never_starts_collector_or_stores_raw_text() {
        let report = spike_report();
        assert_eq!(report.permission_state, PermissionState::NotDetermined);
        assert_eq!(report.supported_permission_states.len(), 5);
        assert!(!report.collector_started);
        assert!(!report.stores_raw_text);
    }
}
