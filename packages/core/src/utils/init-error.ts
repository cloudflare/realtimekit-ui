import type { RtkI18n } from '../lib/lang';
import type { PreJoinError } from '../types/props';

/**
 * Maps a Core SDK init-phase error to a user-friendly message and support reference code.
 *
 * Called by the `initErrorListener` in `rtk-meeting` and `rtk-ui-provider` when a
 * `ClientError` window event fires before the meeting object is available.
 *
 * Only handles error codes thrown by `Client.init()`:
 *  - 0004 — Invalid auth token (401, 403, 404, malformed JWT)
 *  - 0001 — Failed to initialize (network, timeout, server 5xx, catch-all)
 *  - 0010 — Browser not supported (no RTCPeerConnection)
 */
export function getInitErrorInfo(t: RtkI18n, err: unknown): PreJoinError {
  const code: string | undefined = (err as any)?.code;

  switch (code) {
    case '0004':
      return { message: t('init.auth_error'), code };

    case '0001':
      return { message: t('init.network_error'), code };

    case '0010':
      return { message: t('init.browser_error'), code };

    default:
      return { message: t('init.default_error'), code };
  }
}
