import type { JSX } from 'solid-js';
import { createSignal, createEffect, Show } from 'solid-js';
import type {
  ComponentColor,
  ComponentSize,
  ComponentVariant,
} from '@pathscale/ui/dist/components/types';
import { Button, Tooltip } from '@pathscale/ui';

export interface RtkMicToggleProps {
  meeting: any;
  size?: ComponentSize;
  color?: ComponentColor;
  variant?: ComponentVariant;
  startIcon?: JSX.Element;
  endIcon?: JSX.Element;
  t?: (key: string) => string;
  onStateUpdate?: (state: any) => void;
}

export function RtkMicToggle(props: RtkMicToggleProps) {
  const [audioEnabled, setAudioEnabled] = createSignal(false);
  const [canProduceAudio, setCanProduceAudio] = createSignal(false);
  const [micPermission, setMicPermission] = createSignal('NOT_REQUESTED');
  const [stageStatus, setStageStatus] = createSignal('OFF_STAGE');

  const t = props.t ?? ((k: string) => k);

  createEffect(() => {
    const m = props.meeting;
    if (!m) return;

    const onAudioUpdate = ({ audioEnabled }: any) => setAudioEnabled(audioEnabled);
    const onPermissionUpdate = ({ kind, message }: any) =>
      kind === 'audio' && setMicPermission(message);
    const onStageUpdate = () => {
      setStageStatus(m.stage?.status);
      setCanProduceAudio(m.self?.permissions?.canProduceAudio === 'ALLOWED');
    };

    m.self?.addListener?.('audioUpdate', onAudioUpdate);
    m.self?.addListener?.('mediaPermissionUpdate', onPermissionUpdate);
    m.stage?.addListener?.('stageStatusUpdate', onStageUpdate);

    return () => {
      m.self?.removeListener?.('audioUpdate', onAudioUpdate);
      m.self?.removeListener?.('mediaPermissionUpdate', onPermissionUpdate);
      m.stage?.removeListener?.('stageStatusUpdate', onStageUpdate);
    };
  });

  const hasPermissionError = () => ['DENIED', 'SYSTEM_DENIED'].includes(micPermission());

  const couldNotStart = () => micPermission() === 'COULD_NOT_START';

  const toggleMic = () => {
    const m = props.meeting;
    if (!m || !canProduceAudio()) return;

    if (hasPermissionError()) {
      props.onStateUpdate?.({
        activePermissionsMessage: { enabled: true, kind: 'audio' },
      });
      return;
    }

    const self = m.self;
    self?.audioEnabled ? self.disableAudio() : self.enableAudio();
  };

  const label = () => (audioEnabled() && !hasPermissionError() ? t('mic_on') : t('mic_off'));

  const tooltipLabel = () => {
    if (couldNotStart()) return t('perm_could_not_start.audio');
    if (micPermission() === 'SYSTEM_DENIED') return t('perm_sys_denied.audio');
    if (micPermission() === 'DENIED') return t('perm_denied.audio');
    return audioEnabled() ? t('disable_mic') : t('enable_mic');
  };

  return (
    <Show
      when={canProduceAudio() && !['OFF_STAGE', 'REQUESTED_TO_JOIN_STAGE'].includes(stageStatus())}
    >
      <Tooltip message={tooltipLabel()} position="top">
        <Button
          size={props.size ?? 'md'}
          color={hasPermissionError() ? 'error' : 'primary'}
          variant={props.variant ?? 'filled'}
          loading={false}
          active={audioEnabled()}
          disabled={hasPermissionError()}
          startIcon={props.startIcon}
          endIcon={props.endIcon}
          onClick={toggleMic}
        >
          {label()}
        </Button>
      </Tooltip>
    </Show>
  );
}

export default RtkMicToggle;
