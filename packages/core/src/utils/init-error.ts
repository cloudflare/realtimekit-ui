import type { RtkI18n } from '../lib/lang';
import type { PreJoinError } from '../types/props';

/**
 * Maps a Core SDK init-phase error to a user-friendly message and support reference code.
 *
 * Called by the `initErrorListener` in `rtk-meeting` and `rtk-ui-provider` when a
 * `ClientError` window event fires before the meeting object is available.
 *
 * Only the codes below represent genuine `Client.init()` failures; any other code
 * (e.g. non-fatal media/device errors) is not an init failure and returns `null`.
 *  - 0004 — Invalid auth token (401, 403, 404, malformed JWT); `err.reason` picks a specific message
 *  - 0001 — Failed to initialize (network, timeout, server 5xx, catch-all)
 *  - 0010 — Browser not supported (no RTCPeerConnection)
 *  - 0904 — Could not load preset/permissions
 *  - 0102 — Prerequisite module missing
 *  - 0404 — Missing socket prerequisites (peerId, meetingId, authToken)
 */
export function getInitErrorInfo(t: RtkI18n, err: unknown): PreJoinError | null {
  const code: string | undefined = (err as any)?.code;

  switch (code) {
    case '0004':
      switch ((err as any)?.reason) {
        case 'participant_token_not_yet_valid':
          return { message: t('init.token_not_yet_valid'), code };
        case 'participant_token_expired':
          return { message: t('init.token_expired'), code };
        case 'participant_token_revoked':
          return { message: t('init.token_revoked'), code };
        case 'participant_token_invalid':
          return { message: t('init.token_invalid'), code };
        case 'meeting_inactive':
          return { message: t('init.meeting_inactive'), code };
        default:
          return { message: t('init.auth_error'), code };
      }

    case '0001':
      return { message: t('init.network_error'), code };

    case '0010':
      return { message: t('init.browser_error'), code };

    case '0904':
    case '0102':
    case '0404':
      return { message: t('init.default_error'), code };

    default:
      return null;
  }
}
