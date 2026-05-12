import { RtkI18n } from '../lib/lang';

export interface JoinErrorInfo {
  /** Localized, user-friendly message suitable for display to end users. */
  message: string;
  /**
   * Raw SDK error code (e.g. '0002'), used for support reference display.
   * Undefined when the caught value is not a ClientError (no code available).
   */
  code: string | undefined;
}

/**
 * Maps a caught joinRoom() error to a user-friendly message and a support reference code.
 *
 * Use `err.code` as the primary branch — error codes are the stable SDK contract.
 * The secondary `err.message` check for '0014' is intentional: the SDK sets a distinct
 * message ('A firewall or network restriction may be blocking the connection.') for the
 * ICE failure sub-case, which requires different user advice than a generic media failure.
 *
 * Only codes '0002' and '0014' are thrown by Client.join() today. The default branch
 * handles any unknown or future codes gracefully.
 */
export function getJoinErrorInfo(t: RtkI18n, err: unknown): JoinErrorInfo {
  const code: string | undefined = (err as any)?.code;

  switch (code) {
    case '0002':
      return { message: t('join.network_error'), code };

    case '0014': {
      const isFirewall =
        typeof (err as any)?.message === 'string' && (err as any).message.includes('firewall');
      return {
        message: isFirewall ? t('join.media_firewall_error') : t('join.media_error'),
        code,
      };
    }

    default:
      return { message: t('join.default_error'), code };
  }
}
