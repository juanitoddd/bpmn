import { useCallback, useEffect, useMemo, useState } from 'react';
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
import './bpmn/goodsole.css';

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

type ShoeScenario = 'paymentDeclined' | 'outOfStock' | 'fulfilled';

interface ShoeStep {
  label: string;
  description: string;
  nodeIds: string[];
  outgoingEdgeIds?: string[];
  associatedEdgeIds?: string[];
}

const routes: Record<ShoeScenario, ShoeStep[]> = {
  paymentDeclined: [
    { label: 'Order received', description: 'Goodsole receives the customer’s shoe order.', nodeIds: ['order-start'], outgoingEdgeIds: ['start-browse'] },
    { label: 'Browse shoes', description: 'The customer explores the available shoes.', nodeIds: ['browse'], outgoingEdgeIds: ['browse-cart'] },
    { label: 'Build shopping cart', description: 'The customer adds the chosen shoe and size to their cart.', nodeIds: ['cart'], outgoingEdgeIds: ['cart-payment'] },
    { label: 'Authorize payment', description: 'The payment service checks the customer’s payment method.', nodeIds: ['payment'], outgoingEdgeIds: ['payment-decision'] },
    { label: 'Payment approved?', description: 'The payment is declined, so the order cannot continue.', nodeIds: ['payment-gateway'], outgoingEdgeIds: ['payment-declined'] },
    { label: 'Order declined', description: 'Goodsole informs the customer that the order was declined.', nodeIds: ['payment-failed'] },
  ],
  outOfStock: [
    { label: 'Order received', description: 'Goodsole receives the customer’s shoe order.', nodeIds: ['order-start'], outgoingEdgeIds: ['start-browse'] },
    { label: 'Browse shoes', description: 'The customer explores the available shoes.', nodeIds: ['browse'], outgoingEdgeIds: ['browse-cart'] },
    { label: 'Build shopping cart', description: 'The customer adds the chosen shoe and size to their cart.', nodeIds: ['cart'], outgoingEdgeIds: ['cart-payment'] },
    { label: 'Authorize payment', description: 'The payment service checks the customer’s payment method.', nodeIds: ['payment'], outgoingEdgeIds: ['payment-decision'] },
    { label: 'Payment approved?', description: 'The payment is approved, so Goodsole can check inventory.', nodeIds: ['payment-gateway'], outgoingEdgeIds: ['payment-approved'] },
    { label: 'Reserve shoe size', description: 'The stock system checks the requested shoe size.', nodeIds: ['reserve-stock'], outgoingEdgeIds: ['reserve-check'] },
    { label: 'In stock?', description: 'The requested size is unavailable, so Goodsole stops fulfillment.', nodeIds: ['stock-gateway'], outgoingEdgeIds: ['stock-missing'] },
    { label: 'Refund & notify', description: 'Goodsole refunds the order and notifies the customer that the size is unavailable.', nodeIds: ['stock-unavailable'] },
  ],
  fulfilled: [
    { label: 'Order received', description: 'Goodsole receives the customer’s shoe order.', nodeIds: ['order-start'], outgoingEdgeIds: ['start-browse'] },
    { label: 'Browse shoes', description: 'The customer explores the available shoes.', nodeIds: ['browse'], outgoingEdgeIds: ['browse-cart'] },
    { label: 'Build shopping cart', description: 'The customer adds the chosen shoe and size to their cart.', nodeIds: ['cart'], outgoingEdgeIds: ['cart-payment'] },
    { label: 'Authorize payment', description: 'The payment service checks the customer’s payment method.', nodeIds: ['payment'], outgoingEdgeIds: ['payment-decision'] },
    { label: 'Payment approved?', description: 'Payment is approved. The process continues to check stock.', nodeIds: ['payment-gateway'], outgoingEdgeIds: ['payment-approved'] },
    { label: 'Reserve shoe size', description: 'The stock system confirms that the requested size is available.', nodeIds: ['reserve-stock'], outgoingEdgeIds: ['reserve-check'] },
    { label: 'In stock?', description: 'The shoe is available, so Goodsole starts fulfillment.', nodeIds: ['stock-gateway'], outgoingEdgeIds: ['stock-available'] },
    { label: 'Fulfill order', description: 'The parallel gateway starts picking and packing and invoice creation at the same time.', nodeIds: ['fulfillment-split'], outgoingEdgeIds: ['split-pack', 'split-invoice'] },
    {
      label: 'Pack shoes and create invoice',
      description: 'The warehouse packs the shoes while the order system creates an invoice; these activities happen in parallel.',
      nodeIds: ['pack-order', 'create-invoice', 'invoice-document'],
      outgoingEdgeIds: ['pack-join', 'invoice-join'],
      associatedEdgeIds: ['invoice-association'],
    },
    { label: 'Ready to ship', description: 'Both parallel activities are complete, so the order can be dispatched.', nodeIds: ['fulfillment-join'], outgoingEdgeIds: ['join-dispatch'] },
    { label: 'Dispatch parcel', description: 'The carrier takes the packed shoe order for delivery.', nodeIds: ['dispatch'], outgoingEdgeIds: ['dispatch-tracking'] },
    { label: 'Tracking sent', description: 'Goodsole sends the customer a parcel tracking update.', nodeIds: ['tracking-sent'], outgoingEdgeIds: ['tracking-delivery'] },
    { label: 'Delivery window', description: 'The parcel arrives during the expected delivery window.', nodeIds: ['delivery-window'], outgoingEdgeIds: ['delivery-complete'] },
    { label: 'Shoes delivered', description: 'The customer receives the shoes and the order is complete.', nodeIds: ['order-complete'] },
  ],
};

function isShoeScenario(value: string): value is ShoeScenario {
  return value === 'paymentDeclined' || value === 'outOfStock' || value === 'fulfilled';
}

export default function Flow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [scenario, setScenario] = useState<ShoeScenario>('fulfilled');
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const route = routes[scenario];
  const currentStep = route[step];
  const currentNodeIds = useMemo(() => new Set(currentStep.nodeIds), [currentStep]);
  const visitedNodeIds = useMemo(
    () => new Set(route.slice(0, step).flatMap((routeStep) => routeStep.nodeIds)),
    [route, step],
  );
  const visitedEdgeIds = useMemo(
    () => new Set(route.slice(0, step).flatMap((routeStep) => routeStep.outgoingEdgeIds ?? [])),
    [route, step],
  );
  const currentEdgeIds = useMemo(
    () => new Set([...currentStep.outgoingEdgeIds ?? [], ...currentStep.associatedEdgeIds ?? []]),
    [currentStep],
  );
  const routeNodeIds = useMemo(
    () => new Set(route.flatMap((routeStep) => routeStep.nodeIds)),
    [route],
  );
  const displayedNodes = useMemo(
    () =>
      nodes.map((node) => {
        const classNames = (node.className ?? '').split(/\s+/).filter(Boolean);

        if (node.type !== 'lane') {
          if (currentNodeIds.has(node.id)) {
            classNames.push('bpmn-step-current');
          } else if (visitedNodeIds.has(node.id)) {
            classNames.push('bpmn-step-complete');
          } else if (!routeNodeIds.has(node.id)) {
            classNames.push('bpmn-step-alternate');
          }
        }

        return { ...node, className: [...new Set(classNames)].join(' ') };
      }),
    [currentNodeIds, nodes, routeNodeIds, visitedNodeIds],
  );
  const displayedEdges = useMemo(
    () =>
      edges.map((edge) => {
        const isCurrent = currentEdgeIds.has(edge.id);
        const isVisited = visitedEdgeIds.has(edge.id);
        const isOnRoute = route.some((routeStep) =>
          [...routeStep.outgoingEdgeIds ?? [], ...routeStep.associatedEdgeIds ?? []].includes(edge.id),
        );

        return {
          ...edge,
          animated: isCurrent && !currentStep.associatedEdgeIds?.includes(edge.id),
          style: {
            ...edge.style,
            opacity: isCurrent || isVisited ? 1 : isOnRoute ? 0.36 : 0.12,
            strokeWidth: isCurrent || isVisited ? 2.8 : 1.8,
          },
        };
      }),
    [currentEdgeIds, currentStep.associatedEdgeIds, edges, route, visitedEdgeIds],
  );

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = window.setInterval(() => {
      setStep((currentStepIndex) => Math.min(route.length - 1, currentStepIndex + 1));
    }, 1400);

    return () => window.clearInterval(timer);
  }, [isPlaying, route]);

  useEffect(() => {
    if (isPlaying && step >= route.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, route.length, step]);

  const selectScenario = (value: string) => {
    if (!isShoeScenario(value)) {
      return;
    }

    setIsPlaying(false);
    setScenario(value);
    setStep(0);
  };

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

      <section className="goodsole-stepper" aria-label="Process walkthrough controls">
        <div className="goodsole-stepper__top">
          <label className="goodsole-stepper__scenario">
            <span>Order outcome</span>
            <select value={scenario} onChange={(event) => selectScenario(event.currentTarget.value)}>
              <option value="fulfilled">Payment and stock approved</option>
              <option value="outOfStock">Shoe size unavailable</option>
              <option value="paymentDeclined">Payment declined</option>
            </select>
          </label>
          <p className="goodsole-stepper__route">
            <span className="goodsole-stepper__live-dot" />
            {scenario === 'fulfilled'
              ? 'Successful order · parallel packing and invoicing'
              : scenario === 'outOfStock'
                ? 'Approved payment · unavailable stock'
                : 'Payment declined · order stopped'}
          </p>
        </div>

        <div className="goodsole-stepper__controls">
          <button
            className="goodsole-stepper__button goodsole-stepper__play"
            type="button"
            onClick={() => {
              if (step === route.length - 1) {
                setStep(0);
              }
              setIsPlaying((playing) => !playing);
            }}
            aria-label={isPlaying ? 'Pause process' : step === route.length - 1 ? 'Replay process' : 'Play process'}
          >
            {isPlaying ? 'Pause' : step === route.length - 1 ? 'Replay' : 'Play'}
          </button>
          <button
            className="goodsole-stepper__button"
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setStep((currentStepIndex) => Math.max(0, currentStepIndex - 1));
            }}
            disabled={step === 0}
          >
            Previous
          </button>
          <label className="goodsole-stepper__range">
            <span className="sr-only">Process step</span>
            <input
              type="range"
              min={0}
              max={route.length - 1}
              value={step}
              onChange={(event) => {
                setIsPlaying(false);
                setStep(Number(event.currentTarget.value));
              }}
            />
          </label>
          <button
            className="goodsole-stepper__button"
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setStep((currentStepIndex) => Math.min(route.length - 1, currentStepIndex + 1));
            }}
            disabled={step === route.length - 1}
          >
            Next
          </button>
          <span className="goodsole-stepper__count">
            {step + 1} <span>/ {route.length}</span>
          </span>
        </div>

        <div className="goodsole-stepper__current" aria-live="polite">
          <span>NOW</span>
          <div>
            <strong>{currentStep.label}</strong>
            <p>{currentStep.description}</p>
          </div>
        </div>
      </section>

      <div className="bpmn-canvas">
        <ReactFlow
          nodes={displayedNodes}
          edges={displayedEdges}
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
