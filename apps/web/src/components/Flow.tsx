import { useCallback, useState } from 'react';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  Panel,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
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

const nodeTypes = {
  activity: ActivityNode,
  dataArtifact: DataArtifact,
  endEvent: EndEvent,
  eventGateway: EventGateway,
  exclusiveGateway: ExclusiveGateway,
  fileArtifact: FileArtifact,
  inclusiveGateway: InclusiveGateway,
  lane: LaneNode,
  messageEvent: MessageEvent,
  parallelGateway: ParallelGateway,
  annotation: AnnotationNode,
  errorEvent: ErrorEvent,
  signalEvent: SignalEvent,
  startEvent: StartEvent,
  timeEvent: TimeEvent,
} satisfies NodeTypes;

const initialNodes: Node<BpmnData>[] = [
  {
    id: 'goodsole-pool',
    type: 'lane',
    position: { x: 0, y: 0 },
    data: { label: 'GOODSOLE · ORDER-TO-DELIVERY POOL' },
    style: { width: 1400, height: 470, zIndex: -1 },
    className: 'bpmn-lane-node',
    zIndex: -1,
    draggable: false,
    selectable: false,
    connectable: false,
  },
  { id: 'order-start', type: 'startEvent', position: { x: 25, y: 165 }, data: { label: 'Order received', actor: 'CUSTOMER' } },
  { id: 'browse', type: 'activity', position: { x: 145, y: 150 }, data: { label: 'Browse shoes', activityKind: 'user', actor: 'CUSTOMER' } },
  { id: 'cart', type: 'activity', position: { x: 325, y: 150 }, data: { label: 'Build shopping cart', activityKind: 'task', actor: 'CUSTOMER' } },
  { id: 'payment', type: 'activity', position: { x: 505, y: 150 }, data: { label: 'Authorize payment', activityKind: 'service', actor: 'PAYMENT SERVICE' } },
  { id: 'payment-gateway', type: 'exclusiveGateway', position: { x: 695, y: 148 }, data: { label: 'Payment approved?' } },
  { id: 'payment-failed', type: 'endEvent', position: { x: 835, y: 15 }, data: { label: 'Order declined', eventMarker: 'error' } },
  { id: 'reserve-stock', type: 'activity', position: { x: 835, y: 150 }, data: { label: 'Reserve shoe size', activityKind: 'service', actor: 'STOCK SYSTEM' } },
  { id: 'stock-gateway', type: 'exclusiveGateway', position: { x: 1020, y: 148 }, data: { label: 'In stock?' } },
  { id: 'stock-unavailable', type: 'endEvent', position: { x: 1230, y: 340 }, data: { label: 'Refund & notify', eventMarker: 'error' } },
  { id: 'fulfillment-split', type: 'parallelGateway', position: { x: 1190, y: 148 }, data: { label: 'Fulfill order' } },
  { id: 'pack-order', type: 'activity', position: { x: 1025, y: 15 }, data: { label: 'Pick and pack shoes', activityKind: 'manual', actor: 'WAREHOUSE' } },
  { id: 'create-invoice', type: 'activity', position: { x: 1025, y: 300 }, data: { label: 'Create invoice', activityKind: 'script', actor: 'ORDER SYSTEM' } },
  { id: 'invoice-document', type: 'fileArtifact', position: { x: 1120, y: 400 }, data: { label: 'Order invoice' }, draggable: false, selectable: false },
  { id: 'fulfillment-join', type: 'parallelGateway', position: { x: 820, y: 300 }, data: { label: 'Ready to ship' } },
  { id: 'dispatch', type: 'activity', position: { x: 620, y: 300 }, data: { label: 'Dispatch parcel', activityKind: 'service', actor: 'CARRIER' } },
  { id: 'tracking-sent', type: 'messageEvent', position: { x: 430, y: 295 }, data: { label: 'Tracking sent' } },
  { id: 'delivery-window', type: 'timeEvent', position: { x: 260, y: 295 }, data: { label: 'Delivery window' } },
  { id: 'order-complete', type: 'endEvent', position: { x: 100, y: 300 }, data: { label: 'Shoes delivered' } },
];

const sequenceStyle = { stroke: '#62748c', strokeWidth: 1.8 };
const sequenceLabelStyle = { fill: '#42536a', fontSize: 11, fontWeight: 600 };
const sequenceEdge = (id: string, source: string, target: string, sourceSide = 'right', targetSide = 'left', label?: string): Edge => ({
  id,
  source,
  target,
  sourceHandle: `source-${sourceSide}`,
  targetHandle: `target-${targetSide}`,
  type: 'smoothstep',
  label,
  labelStyle: sequenceLabelStyle,
  labelBgStyle: { fill: '#fffdf8', fillOpacity: 0.96 },
  labelBgPadding: [6, 3],
  labelBgBorderRadius: 4,
  markerEnd: { type: MarkerType.ArrowClosed, color: '#62748c' },
  style: sequenceStyle,
});

const initialEdges: Edge[] = [
  sequenceEdge('start-browse', 'order-start', 'browse'),
  sequenceEdge('browse-cart', 'browse', 'cart'),
  sequenceEdge('cart-payment', 'cart', 'payment'),
  sequenceEdge('payment-decision', 'payment', 'payment-gateway'),
  sequenceEdge('payment-declined', 'payment-gateway', 'payment-failed', 'top', 'left', 'No'),
  sequenceEdge('payment-approved', 'payment-gateway', 'reserve-stock', 'right', 'left', 'Yes'),
  sequenceEdge('reserve-check', 'reserve-stock', 'stock-gateway'),
  sequenceEdge('stock-missing', 'stock-gateway', 'stock-unavailable', 'bottom', 'top', 'No'),
  sequenceEdge('stock-available', 'stock-gateway', 'fulfillment-split', 'right', 'left', 'Yes'),
  sequenceEdge('split-pack', 'fulfillment-split', 'pack-order', 'top', 'right'),
  sequenceEdge('split-invoice', 'fulfillment-split', 'create-invoice', 'bottom', 'right'),
  sequenceEdge('pack-join', 'pack-order', 'fulfillment-join', 'left', 'top'),
  sequenceEdge('invoice-join', 'create-invoice', 'fulfillment-join', 'left', 'right'),
  sequenceEdge('join-dispatch', 'fulfillment-join', 'dispatch', 'left', 'right'),
  {
    ...sequenceEdge('dispatch-tracking', 'dispatch', 'tracking-sent', 'left', 'right', 'Tracking message'),
    markerEnd: { type: MarkerType.Arrow, color: '#718198' },
    style: { stroke: '#718198', strokeWidth: 1.6, strokeDasharray: '6 5' },
  },
  {
    id: 'invoice-association',
    source: 'create-invoice',
    target: 'invoice-document',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'smoothstep',
    style: { stroke: '#9aab9e', strokeWidth: 1.4, strokeDasharray: '2 5' },
  },
  sequenceEdge('tracking-delivery', 'tracking-sent', 'delivery-window', 'left', 'right'),
  sequenceEdge('delivery-complete', 'delivery-window', 'order-complete', 'left', 'right'),
];

export default function Flow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback((changes: NodeChange<Node<BpmnData>>[]) => {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((currentEdges) =>
      addEdge(
        {
          ...connection,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#62748c' },
          style: sequenceStyle,
        },
        currentEdges,
      ),
    );
  }, []);

  return (
    <section className="bpmn-workspace" aria-label="BPMN shoe order process diagram">
      <header className="bpmn-workspace__header">
        <div>
          <p className="bpmn-workspace__eyebrow">PROCESS MODEL · ONLINE RETAIL</p>
          <h2>From first click to front door</h2>
          <p className="bpmn-workspace__description">
            How fictional shoe shop <strong>Goodsole</strong> takes an order, checks stock,
            prepares a parcel, and gets it to the customer.
          </p>
        </div>
        <div className="bpmn-workspace__legend" aria-label="BPMN symbols shown">
          <span><i className="bpmn-legend-dot bpmn-legend-dot--event" /> Event</span>
          <span><i className="bpmn-legend-dot bpmn-legend-dot--task" /> Activity</span>
          <span><i className="bpmn-legend-diamond" /> Gateway</span>
          <span><i className="bpmn-legend-arrow" /> Sequence flow</span>
          <span><i className="bpmn-legend-arrow bpmn-legend-arrow--message" /> Message flow</span>
        </div>
      </header>

      <div className="bpmn-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.25}
          maxZoom={1.5}
          nodesConnectable
          edgesFocusable
          aria-label="Goodsole shoe order BPMN process"
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#dce3e9" />
          <Controls position="top-left" showInteractive={false} />
          <Panel position="bottom-left" className="react-flow__attribution bpmn-attribution">
            <a href="https://reactflow.dev" target="_blank" rel="noreferrer">
              Built with React Flow
            </a>
          </Panel>
        </ReactFlow>
      </div>

      <footer className="bpmn-workspace__footer">
        <span>Drag activities to explore the process · Scroll to zoom or use the controls to fit the diagram</span>
        <span>Decision paths are labeled · Parallel gateway splits packing and invoicing</span>
      </footer>
    </section>
  );
}
