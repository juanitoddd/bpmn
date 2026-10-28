import { Handle, Position, type Node, type NodeProps } from '@bpflow/react';

export type ActivityKind = 'task' | 'user' | 'service' | 'manual' | 'script' | 'call';
export type GatewayKind = 'exclusive' | 'parallel' | 'inclusive' | 'event';
export type EventKind = 'start' | 'intermediate' | 'end';
export type EventMarker = 'none' | 'message' | 'timer' | 'error' | 'signal';

export type BpmnData = {
  label: string;
  actor?: string;
  activityKind?: ActivityKind;
  eventMarker?: EventMarker;
  note?: string;
};

type BpmnNode = Node<BpmnData>;
type BpmnNodeProps = NodeProps<BpmnNode>;

const connectionPoints = [
  { side: 'top', position: Position.Top },
  { side: 'right', position: Position.Right },
  { side: 'bottom', position: Position.Bottom },
  { side: 'left', position: Position.Left },
] as const;

function ConnectionHandles() {
  return (
    <>
      {connectionPoints.flatMap(({ side, position }) => [
        <Handle
          key={`target-${side}`}
          className="bpmn-handle"
          id={`target-${side}`}
          type="target"
          position={position}
        />,
        <Handle
          key={`source-${side}`}
          className="bpmn-handle"
          id={`source-${side}`}
          type="source"
          position={position}
        />,
      ])}
    </>
  );
}

function ActivityIcon({ kind }: { kind: ActivityKind }) {
  if (kind === 'user') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="7" r="3" />
        <path d="M3.5 19v-1.5a5.5 5.5 0 0 1 11 0V19zM16 8h5m-2.5-2.5v5" />
      </svg>
    );
  }

  if (kind === 'service') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 3h6l.7 2.2 2 .9 2.1-.9 3 5.2-1.5 1.8v2.2l1.5 1.8-3 5.2-2.1-.9-2 .9L15 23H9l-.7-2.2-2-.9-2.1.9-3-5.2 1.5-1.8v-2.2L1.2 9.8l3-5.2 2.1.9 2-.9z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    );
  }

  if (kind === 'manual') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 11V5a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6l1-2a1.5 1.5 0 0 1 2.7 1.2l-2.1 6A5 5 0 0 1 14 20h-2a5 5 0 0 1-4.3-2.4L5 13.8A1.6 1.6 0 0 1 8 12z" />
      </svg>
    );
  }

  if (kind === 'script' || kind === 'call') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-2-12-4 14" />
      </svg>
    );
  }

  return null;
}

export function ActivityNode({ data }: BpmnNodeProps) {
  const kind = data.activityKind ?? 'task';

  return (
    <div className={`bpmn-activity bpmn-activity--${kind}`}>
      <ConnectionHandles />
      <div className="bpmn-activity__topline">
        <ActivityIcon kind={kind} />
        <span>{kind === 'call' ? 'CALL ACTIVITY' : `${kind.toUpperCase()} TASK`}</span>
      </div>
      <strong className="bpmn-activity__label">{data.label}</strong>
      {data.actor && <span className="bpmn-activity__actor">{data.actor}</span>}
    </div>
  );
}

function EventSymbol({ marker }: { marker: EventMarker }) {
  if (marker === 'timer') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 8v5l3 2M9 2h6" />
      </svg>
    );
  }

  if (marker === 'message') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
      </svg>
    );
  }

  if (marker === 'error') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m13 2-8 12h6l-1 8 9-13h-6z" />
      </svg>
    );
  }

  if (marker === 'signal') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 4 9 16H3z" />
      </svg>
    );
  }

  return null;
}

function EventNode({ data, kind, marker }: BpmnNodeProps & { kind: EventKind; marker: EventMarker }) {
  return (
    <div className="bpmn-event-wrap">
      <ConnectionHandles />
      <div className={`bpmn-event bpmn-event--${kind}`}>
        {marker !== 'none' && <EventSymbol marker={marker} />}
      </div>
      <strong className="bpmn-event__label">{data.label}</strong>
      {data.actor && <span className="bpmn-event__actor">{data.actor}</span>}
    </div>
  );
}

export function StartEvent(props: BpmnNodeProps) {
  return <EventNode {...props} kind="start" marker={props.data.eventMarker ?? 'none'} />;
}

export function EndEvent(props: BpmnNodeProps) {
  return <EventNode {...props} kind="end" marker={props.data.eventMarker ?? 'none'} />;
}

export function TimeEvent(props: BpmnNodeProps) {
  return <EventNode {...props} kind="intermediate" marker="timer" />;
}

export function MessageEvent(props: BpmnNodeProps) {
  return <EventNode {...props} kind="intermediate" marker="message" />;
}

export function ErrorEvent(props: BpmnNodeProps) {
  return <EventNode {...props} kind="intermediate" marker="error" />;
}

export function SignalEvent(props: BpmnNodeProps) {
  return <EventNode {...props} kind="intermediate" marker="signal" />;
}

function GatewaySymbol({ kind }: { kind: GatewayKind }) {
  if (kind === 'parallel') {
    return <path d="M50 28v44M28 50h44" />;
  }

  if (kind === 'inclusive') {
    return <circle cx="50" cy="50" r="15" />;
  }

  if (kind === 'event') {
    return <path d="m50 31 16 12-6 19H40l-6-19z" />;
  }

  return (
    <>
      <path d="m36 36 28 28m0-28L36 64" />
    </>
  );
}

function GatewayNode({ data, kind }: BpmnNodeProps & { kind: GatewayKind }) {
  const labels: Record<GatewayKind, string> = {
    exclusive: 'EXCLUSIVE',
    parallel: 'PARALLEL',
    inclusive: 'INCLUSIVE',
    event: 'EVENT-BASED',
  };

  return (
    <div className="bpmn-gateway-wrap">
      <ConnectionHandles />
      <div className="bpmn-gateway-shape">
        <svg className={`bpmn-gateway bpmn-gateway--${kind}`} viewBox="0 0 100 100" aria-hidden="true">
          <path className="bpmn-gateway__diamond" d="M50 3 97 50 50 97 3 50z" />
          <g className="bpmn-gateway__symbol">
            <GatewaySymbol kind={kind} />
          </g>
        </svg>
      </div>
      <div className="bpmn-gateway-caption">
        <strong className="bpmn-gateway__label">{data.label}</strong>
        <span className="bpmn-gateway__kind">{labels[kind]} GATEWAY</span>
      </div>
    </div>
  );
}

export function ExclusiveGateway(props: BpmnNodeProps) {
  return <GatewayNode {...props} kind="exclusive" />;
}

export function ParallelGateway(props: BpmnNodeProps) {
  return <GatewayNode {...props} kind="parallel" />;
}

export function InclusiveGateway(props: BpmnNodeProps) {
  return <GatewayNode {...props} kind="inclusive" />;
}

export function EventGateway(props: BpmnNodeProps) {
  return <GatewayNode {...props} kind="event" />;
}

export function DataArtifact({ data }: BpmnNodeProps) {
  return (
    <div className="bpmn-artifact-wrap">
      <ConnectionHandles />
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <ellipse cx="24" cy="10" rx="17" ry="6" />
        <path d="M7 10v27c0 3 8 6 17 6s17-3 17-6V10M7 19c0 3 8 6 17 6s17-3 17-6M7 28c0 3 8 6 17 6s17-3 17-6" />
      </svg>
      <strong>{data.label}</strong>
    </div>
  );
}

export function FileArtifact({ data }: BpmnNodeProps) {
  return (
    <div className="bpmn-artifact-wrap">
      <ConnectionHandles />
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M11 4h17l10 10v30H11zM28 4v11h10M17 25h15M17 32h15M17 39h10" />
      </svg>
      <strong>{data.label}</strong>
    </div>
  );
}

export function AnnotationNode({ data }: BpmnNodeProps) {
  return (
    <div className="bpmn-annotation">
      <ConnectionHandles />
      <span>{data.note ?? data.label}</span>
    </div>
  );
}

export function LaneNode({ data, width, height }: BpmnNodeProps) {
  return (
    <div
      className="bpmn-lane"
      style={{ width: width ?? '100%', height: height ?? '100%' }}
      aria-label={`${data.label} lane`}
    >
      <span className="bpmn-lane__label">{data.label}</span>
    </div>
  );
}
