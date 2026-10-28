import {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  ReactFlow,
  type Node,
  type NodeTypes,
} from '@bpflow/react';
import {
  ActivityNode,
  AnnotationNode,
  DataArtifact,
  EndEvent,
  ErrorEvent,
  EventGateway,
  ExclusiveGateway,
  FileArtifact,
  InclusiveGateway,
  LaneNode,
  MessageEvent,
  ParallelGateway,
  SignalEvent,
  StartEvent,
  TimeEvent,
  type BpmnData,
} from './bpmn/nodes';
import './bpmn/bpmn.css';
import './bpmn/learn.css';

const nodeTypes = {
  activity: ActivityNode,
  annotation: AnnotationNode,
  dataArtifact: DataArtifact,
  endEvent: EndEvent,
  errorEvent: ErrorEvent,
  eventGateway: EventGateway,
  exclusiveGateway: ExclusiveGateway,
  fileArtifact: FileArtifact,
  inclusiveGateway: InclusiveGateway,
  lane: LaneNode,
  messageEvent: MessageEvent,
  parallelGateway: ParallelGateway,
  signalEvent: SignalEvent,
  startEvent: StartEvent,
  timeEvent: TimeEvent,
} satisfies NodeTypes;

const activityNodes: Node<BpmnData>[] = [
  { id: 'task', type: 'activity', position: { x: 25, y: 30 }, data: { label: 'Review order', activityKind: 'task' } },
  { id: 'user', type: 'activity', position: { x: 220, y: 30 }, data: { label: 'Choose shoe size', activityKind: 'user' } },
  { id: 'service', type: 'activity', position: { x: 415, y: 30 }, data: { label: 'Take payment', activityKind: 'service' } },
  { id: 'manual', type: 'activity', position: { x: 610, y: 30 }, data: { label: 'Pack the shoes', activityKind: 'manual' } },
  { id: 'script', type: 'activity', position: { x: 220, y: 145 }, data: { label: 'Calculate postage', activityKind: 'script' } },
  { id: 'call', type: 'activity', position: { x: 415, y: 145 }, data: { label: 'Run returns process', activityKind: 'call' } },
];

const eventNodes: Node<BpmnData>[] = [
  { id: 'start', type: 'startEvent', position: { x: 30, y: 20 }, data: { label: 'Start event' } },
  { id: 'message-start', type: 'startEvent', position: { x: 190, y: 20 }, data: { label: 'Message start', eventMarker: 'message' } },
  { id: 'timer', type: 'timeEvent', position: { x: 350, y: 20 }, data: { label: 'Timer event' } },
  { id: 'message', type: 'messageEvent', position: { x: 510, y: 20 }, data: { label: 'Message event' } },
  { id: 'error', type: 'errorEvent', position: { x: 670, y: 20 }, data: { label: 'Error event' } },
  { id: 'signal', type: 'signalEvent', position: { x: 190, y: 155 }, data: { label: 'Signal event' } },
  { id: 'end', type: 'endEvent', position: { x: 430, y: 155 }, data: { label: 'End event' } },
  { id: 'error-end', type: 'endEvent', position: { x: 620, y: 155 }, data: { label: 'Error end', eventMarker: 'error' } },
];

const gatewayNodes: Node<BpmnData>[] = [
  { id: 'exclusive', type: 'exclusiveGateway', position: { x: 55, y: 35 }, data: { label: 'One path?' } },
  { id: 'parallel', type: 'parallelGateway', position: { x: 245, y: 35 }, data: { label: 'Do both' } },
  { id: 'inclusive', type: 'inclusiveGateway', position: { x: 435, y: 35 }, data: { label: 'One or more?' } },
  { id: 'event-based', type: 'eventGateway', position: { x: 625, y: 35 }, data: { label: 'Which happens?' } },
];

const artifactNodes: Node<BpmnData>[] = [
  { id: 'data-store', type: 'dataArtifact', position: { x: 55, y: 35 }, data: { label: 'Inventory data' } },
  { id: 'document', type: 'fileArtifact', position: { x: 280, y: 35 }, data: { label: 'Order document' } },
  { id: 'annotation', type: 'annotation', position: { x: 505, y: 45 }, data: { label: 'Business note', note: 'Annotate the process with context or guidance.' } },
];

const participantNodes: Node<BpmnData>[] = [
  {
    id: 'customer-lane',
    type: 'lane',
    position: { x: 25, y: 25 },
    data: { label: 'POOL · GOODSOLE ONLINE SHOP  /  LANE · CUSTOMER' },
    style: { width: 760, height: 82 },
    draggable: false,
    selectable: false,
    connectable: false,
  },
  {
    id: 'fulfillment-lane',
    type: 'lane',
    position: { x: 25, y: 125 },
    data: { label: 'POOL · GOODSOLE ONLINE SHOP  /  LANE · FULFILMENT' },
    style: { width: 760, height: 82 },
    draggable: false,
    selectable: false,
    connectable: false,
  },
];

type GallerySectionProps = {
  id: string;
  title: string;
  summary: string;
  nodes: Node<BpmnData>[];
  descriptions: { name: string; detail: string }[];
};

const sections: GallerySectionProps[] = [
  {
    id: 'activities',
    title: 'Activities',
    summary: 'Work performed during the process. The small icon identifies who—or what—does the work.',
    nodes: activityNodes,
    descriptions: [
      { name: 'Task', detail: 'A general unit of work when a more specific task type is unnecessary.' },
      { name: 'User task', detail: 'Work completed by a person with help from a software system.' },
      { name: 'Service task', detail: 'Work carried out automatically by an application or external service.' },
      { name: 'Manual task', detail: 'Work performed by a person without an automated process system.' },
      { name: 'Script task', detail: 'A script or expression runs automatically as part of the process.' },
      { name: 'Call activity', detail: 'Reuses a separately defined process or global task.' },
    ],
  },
  {
    id: 'events',
    title: 'Events',
    summary: 'Something that happens and affects the process. Their position marks when it occurs; the inner symbol shows what happened.',
    nodes: eventNodes,
    descriptions: [
      { name: 'Start event', detail: 'Marks what triggers a process instance.' },
      { name: 'Message start', detail: 'A received message starts the process.' },
      { name: 'Timer event', detail: 'A date, time, or duration triggers or delays work.' },
      { name: 'Message event', detail: 'A message is received or sent while work is in progress.' },
      { name: 'Error event', detail: 'Signals or catches an error that needs handling.' },
      { name: 'Signal event', detail: 'Broadcasts or catches a signal that can reach multiple processes.' },
      { name: 'End event', detail: 'Marks a normal outcome for this process path.' },
      { name: 'Error end', detail: 'Ends the path by throwing an error to be handled elsewhere.' },
    ],
  },
  {
    id: 'gateways',
    title: 'Gateways',
    summary: 'Control how sequence flows split into branches or come back together.',
    nodes: gatewayNodes,
    descriptions: [
      { name: 'Exclusive (XOR)', detail: 'Chooses exactly one outgoing path based on a condition.' },
      { name: 'Parallel (AND)', detail: 'Starts all outgoing paths, or waits for all incoming paths.' },
      { name: 'Inclusive (OR)', detail: 'Takes one or more outgoing paths whose conditions are true.' },
      { name: 'Event-based', detail: 'Selects a path based on which following event occurs first.' },
    ],
  },
  {
    id: 'artifacts',
    title: 'Data & annotations',
    summary: 'Show information used by work or add explanatory context without changing the process flow.',
    nodes: artifactNodes,
    descriptions: [
      { name: 'Data store', detail: 'Represents persistent information that can be read or updated by activities.' },
      { name: 'Data object', detail: 'Represents a document or information item used or produced by work.' },
      { name: 'Text annotation', detail: 'Adds a note to clarify part of the diagram.' },
    ],
  },
  {
    id: 'participants',
    title: 'Pools & lanes',
    summary: 'Organize a collaboration into participants and show which role or team is responsible for each activity.',
    nodes: participantNodes,
    descriptions: [
      { name: 'Pool', detail: 'A participant in a collaboration, such as a customer or the Goodsole shop.' },
      { name: 'Lane', detail: 'A subdivision of a pool that groups work by role, team, or responsibility.' },
    ],
  },
];

function GallerySection({ id, title, summary, nodes, descriptions }: GallerySectionProps) {
  return (
    <section className="learn-section" id={id} aria-labelledby={`${id}-title`}>
      <header className="learn-section__header">
        <div>
          <p className="learn-section__index">{String(sections.findIndex((section) => section.id === id) + 1).padStart(2, '0')} / 05</p>
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
        <p>{summary}</p>
      </header>
      <div className={`learn-flow learn-flow--${id}`}>
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          minZoom={0.45}
          maxZoom={1.5}
          nodesConnectable={false}
          nodesDraggable={id !== 'participants'}
          elementsSelectable={id !== 'participants'}
          aria-label={`${title} BPMN node examples`}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#dce3e9" />
          <Controls showInteractive={false} showZoom={false} position="top-right" />
          <Panel position="bottom-left" className="react-flow__attribution bpmn-attribution">
            <a href="https://reactflow.dev" target="_blank" rel="noreferrer">
              Built with React Flow
            </a>
          </Panel>
        </ReactFlow>
      </div>
      <ul className="learn-node-list">
        {descriptions.map(({ name, detail }) => (
          <li className="learn-node-list__item" key={name}>
            <strong>{name}</strong>
            <p>{detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function LearnFlow() {
  return (
    <div className="learn-gallery">
      {sections.map((section) => (
        <GallerySection key={section.id} {...section} />
      ))}
    </div>
  );
}
