export type InputMonitoringPermission = 'not_determined' | 'denied' | 'granted' | 'revoked_during_run' | 'needs_restart';

export function canStartShortcutCollector(permission: InputMonitoringPermission): boolean {
  return permission === 'granted';
}

export function permissionRecoveryAction(permission: InputMonitoringPermission): string {
  switch (permission) {
    case 'granted':
      return 'collector_can_start';
    case 'denied':
      return 'open_system_settings_input_monitoring';
    case 'revoked_during_run':
      return 'stop_collector_and_request_restart';
    case 'needs_restart':
      return 'restart_app_after_permission_change';
    case 'not_determined':
    default:
      return 'explain_privacy_before_permission_prompt';
  }
}

export function shouldPauseForSensitiveContext(input: { secureInput?: boolean; passwordField?: boolean; imeComposing?: boolean }): boolean {
  return Boolean(input.secureInput || input.passwordField || input.imeComposing);
}
