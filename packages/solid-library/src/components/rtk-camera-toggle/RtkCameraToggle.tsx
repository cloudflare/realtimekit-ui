import type { JSX } from 'solid-js';
import { createSignal, createEffect, onCleanup, Show } from 'solid-js';
import type { ComponentSize, ComponentVariant } from '@pathscale/ui/dist/components/types';
import { Button, Tooltip, toastStore } from '@pathscale/ui';

export interface RtkCameraToggleProps {
  meeting?: any;
  size?: ComponentSize;
  variant?: ComponentVariant;
  videoOnIcon?: JSX.Element;
  videoOffIcon?: JSX.Element;
}

export default function RtkCameraToggle(props: RtkCameraToggleProps) {
  const [videoEnabled, setVideoEnabled] = createSignal(false);
  const [canProduceVideo, setCanProduceVideo] = createSignal(false);
  const [stageStatus, setStageStatus] = createSignal('OFF_STAGE');
  const [videoPermission, setVideoPermission] = createSignal('NOT_REQUESTED');

  const hasPermissionError = () =>
    videoPermission() === 'DENIED' || videoPermission() === 'SYSTEM_DENIED';

  createEffect(() => {
    const meeting = props.meeting;
    if (!meeting) return;

    const self = meeting.self;
    const stage = meeting.stage;

    setVideoEnabled(self.videoEnabled);
    setCanProduceVideo(self.permissions.canProduceVideo === 'ALLOWED');
    setStageStatus(stage?.status || 'OFF_STAGE');
    setVideoPermission(self.mediaPermissions?.video || 'NOT_REQUESTED');

    const onVideoUpdate = ({ videoEnabled }: any) => setVideoEnabled(videoEnabled);
    const onStageStatus = () => setStageStatus(stage.status);
    const onPermissionUpdate = ({ kind, message }: any) => {
      if (kind === 'video') setVideoPermission(message);
    };

    self.addListener?.('videoUpdate', onVideoUpdate);
    stage?.addListener?.('stageStatusUpdate', onStageStatus);
    self.addListener?.('mediaPermissionUpdate', onPermissionUpdate);

    onCleanup(() => {
      self.removeListener?.('videoUpdate', onVideoUpdate);
      stage?.removeListener?.('stageStatusUpdate', onStageStatus);
      self.removeListener?.('mediaPermissionUpdate', onPermissionUpdate);
    });
  });

  const toggleCamera = () => {
    const meeting = props.meeting;
    if (!meeting) return;

    const self = meeting.self;
    if (!self || !canProduceVideo()) return;

    if (hasPermissionError()) {
      toastStore.showError(
        'Camera permission denied. Please enable camera permissions in your browser.'
      );

      return;
    }

    if (self.videoEnabled) {
      self.disableVideo();
      toastStore.showInfo('Camera turned off.');
    } else {
      self.enableVideo();
      toastStore.showSuccess('Camera turned on.');
    }
  };

  return (
    <Show
      when={
        canProduceVideo() &&
        !['OFF_STAGE', 'REQUESTED_TO_JOIN_STAGE'].includes(stageStatus()) &&
        props.meeting?.meta?.viewType !== 'AUDIO_ROOM'
      }
    >
      <Tooltip message={videoEnabled() ? 'Disable video' : 'Enable video'}>
        <Button
          color={videoEnabled() ? 'primary' : 'error'}
          variant={props.variant ?? 'filled'}
          size={props.size ?? 'md'}
          onClick={toggleCamera}
          startIcon={videoEnabled() ? props.videoOnIcon : props.videoOffIcon}
        >
          {videoEnabled() ? 'Video On' : 'Video Off'}
        </Button>
      </Tooltip>
    </Show>
  );
}
