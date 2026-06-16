#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "snake_case")]
pub enum HudRendererKind {
    TauriWindow,
    NativePanelFallback,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "snake_case")]
pub enum HudScenario {
    StandardDesktop,
    FullscreenSpaces,
    StageManager,
    MultiDisplay,
    RemoteDesktop,
    ReducedMotion,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HudCapability {
    pub scenario: HudScenario,
    pub primary: HudRendererKind,
    pub fallback: Option<HudRendererKind>,
    pub requires_manual_check: bool,
    pub note: &'static str,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HudRendererSpikeReport {
    pub interface_contract: &'static str,
    pub focus_policy: &'static str,
    pub default_position: &'static str,
    pub max_width_px: u16,
    pub capabilities: Vec<HudCapability>,
}

pub fn capability_matrix() -> Vec<HudCapability> {
    vec![
        HudCapability {
            scenario: HudScenario::StandardDesktop,
            primary: HudRendererKind::TauriWindow,
            fallback: Some(HudRendererKind::NativePanelFallback),
            requires_manual_check: false,
            note: "Tauri HUD window is acceptable when it does not take focus.",
        },
        HudCapability {
            scenario: HudScenario::FullscreenSpaces,
            primary: HudRendererKind::NativePanelFallback,
            fallback: Some(HudRendererKind::TauriWindow),
            requires_manual_check: true,
            note: "Fullscreen Spaces behavior must be dogfooded with NSPanel/NSWindow fallback.",
        },
        HudCapability {
            scenario: HudScenario::StageManager,
            primary: HudRendererKind::NativePanelFallback,
            fallback: Some(HudRendererKind::TauriWindow),
            requires_manual_check: true,
            note: "Stage Manager can alter active window/display assumptions.",
        },
        HudCapability {
            scenario: HudScenario::MultiDisplay,
            primary: HudRendererKind::TauriWindow,
            fallback: Some(HudRendererKind::NativePanelFallback),
            requires_manual_check: true,
            note: "HUD should prefer foreground app/window display and safe area.",
        },
        HudCapability {
            scenario: HudScenario::RemoteDesktop,
            primary: HudRendererKind::NativePanelFallback,
            fallback: None,
            requires_manual_check: true,
            note: "Remote/session lock behavior is native-spike only until dogfood evidence exists.",
        },
        HudCapability {
            scenario: HudScenario::ReducedMotion,
            primary: HudRendererKind::TauriWindow,
            fallback: Some(HudRendererKind::NativePanelFallback),
            requires_manual_check: false,
            note: "Use opacity-only/no-slide animation.",
        },
    ]
}

pub fn spike_report() -> HudRendererSpikeReport {
    HudRendererSpikeReport {
        interface_contract: "HudRenderer.show(state) must be non-interactive, focus-safe, and replace in-flight HUD state.",
        focus_policy: "HUD must never steal keyboard focus; Settings owns editing and correction.",
        default_position: "active display bottom-center above Dock/safe area",
        max_width_px: 520,
        capabilities: capability_matrix(),
    }
}

pub fn requires_native_fallback(scenario: HudScenario) -> bool {
    capability_matrix()
        .into_iter()
        .find(|capability| capability.scenario == scenario)
        .map(|capability| capability.primary == HudRendererKind::NativePanelFallback)
        .unwrap_or(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matrix_covers_known_risky_scenarios() {
        let matrix = capability_matrix();
        assert_eq!(matrix.len(), 6);
        assert!(matrix.iter().any(|item| item.scenario == HudScenario::FullscreenSpaces));
        assert!(matrix.iter().any(|item| item.scenario == HudScenario::StageManager));
        assert!(matrix.iter().any(|item| item.scenario == HudScenario::MultiDisplay));
    }

    #[test]
    fn risky_modes_prefer_native_fallback() {
        assert!(requires_native_fallback(HudScenario::FullscreenSpaces));
        assert!(requires_native_fallback(HudScenario::StageManager));
        assert!(requires_native_fallback(HudScenario::RemoteDesktop));
        assert!(!requires_native_fallback(HudScenario::StandardDesktop));
    }

    #[test]
    fn report_preserves_focus_safe_contract() {
        let report = spike_report();
        assert!(report.focus_policy.contains("never steal keyboard focus"));
        assert_eq!(report.max_width_px, 520);
    }
}
