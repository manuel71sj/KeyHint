#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ResolverState {
    Resolved,
    NoActiveApp,
    StaleContext,
    ResolverUnavailable,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveAppContext {
    pub state: ResolverState,
    pub bundle_id: Option<String>,
    pub display_name: Option<String>,
    pub observed_at_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveAppSpikeReport {
    pub resolver_strategy: &'static str,
    pub supported_states: Vec<ResolverState>,
    pub sample_context: ActiveAppContext,
    pub can_store_unknown: bool,
    pub storage_guard: &'static str,
}

pub fn can_store_unknown_candidate(context: &ActiveAppContext, event_observed_at_ms: u64) -> bool {
    if context.state != ResolverState::Resolved {
        return false;
    }
    if context.bundle_id.as_deref().unwrap_or_default().is_empty() {
        return false;
    }
    if context.display_name.as_deref().unwrap_or_default().is_empty() {
        return false;
    }
    context.observed_at_ms >= event_observed_at_ms.saturating_sub(250)
}

pub fn spike_report() -> ActiveAppSpikeReport {
    let sample_context = ActiveAppContext {
        state: ResolverState::ResolverUnavailable,
        bundle_id: None,
        display_name: None,
        observed_at_ms: 0,
    };

    ActiveAppSpikeReport {
        resolver_strategy: "NSWorkspace frontmost application or osascript/System Events fallback; explicit nil/stale guard",
        supported_states: vec![
            ResolverState::Resolved,
            ResolverState::NoActiveApp,
            ResolverState::StaleContext,
            ResolverState::ResolverUnavailable,
        ],
        can_store_unknown: can_store_unknown_candidate(&sample_context, 0),
        sample_context,
        storage_guard: "UnknownCandidate is stored only when active app context is resolved, has bundle id/display name, and is not stale.",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn resolved_context() -> ActiveAppContext {
        ActiveAppContext {
            state: ResolverState::Resolved,
            bundle_id: Some("com.todesktop.230313mzl4w4u92".to_string()),
            display_name: Some("Cursor".to_string()),
            observed_at_ms: 1_000,
        }
    }

    #[test]
    fn stores_unknown_only_for_resolved_fresh_context() {
        assert!(can_store_unknown_candidate(&resolved_context(), 900));

        let mut context = resolved_context();
        context.state = ResolverState::NoActiveApp;
        assert!(!can_store_unknown_candidate(&context, 900));

        let mut context = resolved_context();
        context.state = ResolverState::StaleContext;
        assert!(!can_store_unknown_candidate(&context, 900));

        let mut context = resolved_context();
        context.bundle_id = None;
        assert!(!can_store_unknown_candidate(&context, 900));

        let mut context = resolved_context();
        context.display_name = None;
        assert!(!can_store_unknown_candidate(&context, 900));

        let context = resolved_context();
        assert!(!can_store_unknown_candidate(&context, 2_000));
    }

    #[test]
    fn spike_report_defaults_to_no_storage() {
        let report = spike_report();
        assert_eq!(report.supported_states.len(), 4);
        assert_eq!(report.sample_context.state, ResolverState::ResolverUnavailable);
        assert!(!report.can_store_unknown);
    }
}
