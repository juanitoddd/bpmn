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
  EndEvent,
  ExclusiveGateway,
  LaneNode,
  MessageEvent,
  StartEvent,
  type BpmnData,
} from './bpmn/nodes';
import './bpmn/bpmn.css';
import './bpmn/furniture.css';

const nodeTypes = {
  activity: ActivityNode,
  endEvent: EndEvent,
  exclusiveGateway: ExclusiveGateway,
  lane: LaneNode,
  messageEvent: MessageEvent,
  startEvent: StartEvent,
} satisfies NodeTypes;

const initialNodes: Node<BpmnData>[] = [
  {
    id: 'seller-pool',
    type: 'lane',
    position: { x: 0, y: 0 },
    data: { label: 'ATELIER NOIR · SELLER' },
    style: { width: 1180, height: 230, zIndex: -1 },
    className: 'bpmn-lane-node furniture-pool-node',
    zIndex: -1,
    draggable: false,
    selectable: false,
    connectable: false,
  },
  {
    id: 'supplier-pool',
    type: 'lane',
    position: { x: 0, y: 260 },
    data: { label: 'HOUSE SUPPLIER · MAKER & SHIPPER' },
    style: { width: 1180, height: 190, zIndex: -1 },
    className: 'bpmn-lane-node furniture-pool-node',
    zIndex: -1,
    draggable: false,
    selectable: false,
    connectable: false,
  },
  { id: 'inquiry', type: 'startEvent', position: { x: 35, y: 78 }, data: { label: 'Client inquiry', actor: 'CLIENT' } },
  { id: 'review-request', type: 'activity', position: { x: 145, y: 65 }, data: { label: 'Review furniture request', activityKind: 'user', actor: 'SELLER' } },
  { id: 'check-stock', type: 'activity', position: { x: 345, y: 65 }, data: { label: 'Check showroom stock', activityKind: 'service', actor: 'SELLER' } },
  { id: 'stock-decision', type: 'exclusiveGateway', position: { x: 555, y: 63 }, data: { label: 'In stock?' } },
  { id: 'request-from-supplier', type: 'activity', position: { x: 350, y: 148 }, data: { label: 'Request item from supplier', activityKind: 'user', actor: 'SELLER' } },
  { id: 'supplier-update', type: 'messageEvent', position: { x: 825, y: 155 }, data: { label: 'Supplier confirms dispatch', actor: 'SELLER' } },
  { id: 'arrange-delivery', type: 'activity', position: { x: 790, y: 65 }, data: { label: 'Arrange client delivery', activityKind: 'user', actor: 'SELLER' } },
  { id: 'sale-complete', type: 'endEvent', position: { x: 1040, y: 78 }, data: { label: 'Furniture delivered', actor: 'CLIENT' } },
  { id: 'supplier-order', type: 'startEvent', position: { x: 360, y: 332 }, data: { label: 'Order received', eventMarker: 'message', actor: 'SUPPLIER' } },
  { id: 'prepare-order', type: 'activity', position: { x: 510, y: 319 }, data: { label: 'Prepare furniture', activityKind: 'manual', actor: 'SUPPLIER' } },
  { id: 'dispatch-order', type: 'activity', position: { x: 740, y: 319 }, data: { label: 'Dispatch to seller', activityKind: 'service', actor: 'SUPPLIER' } },
  { id: 'supplier-ready', type: 'endEvent', position: { x: 970, y: 332 }, data: { label: 'Item dispatched' } },
];

const sequenceStyle = { stroke: '#62748c', strokeWidth: 1.8 };
const messageStyle = { stroke: '#8b7896', strokeWidth: 1.8, strokeDasharray: '7 5' };

function sequence(id: string, source: string, target: string, label?: string): Edge {
  return {
    id,
    source,
    target,
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'smoothstep',
    label,
    labelStyle: { fill: '#42536a', fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: '#fffdf8', fillOpacity: 0.96 },
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 4,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#62748c' },
    style: sequenceStyle,
  };
}

const initialEdges: Edge[] = [
  sequence('inquiry-review', 'inquiry', 'review-request'),
  sequence('review-stock', 'review-request', 'check-stock'),
  sequence('stock-decision', 'check-stock', 'stock-decision'),
  sequence('stock-available', 'stock-decision', 'arrange-delivery', 'Yes · already in showroom'),
  {
    ...sequence('stock-needed', 'stock-decision', 'request-from-supplier', 'No · order from maker'),
    sourceHandle: 'source-bottom',
    targetHandle: 'target-right',
  },
  {
    ...sequence('supplier-message', 'request-from-supplier', 'supplier-order'),
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    label: 'Purchase order',
    markerEnd: { type: MarkerType.Arrow, color: '#8b7896' },
    style: messageStyle,
  },
  sequence('supplier-receives', 'supplier-order', 'prepare-order'),
  sequence('supplier-prepares', 'prepare-order', 'dispatch-order'),
  sequence('supplier-completes', 'dispatch-order', 'supplier-ready'),
  {
    ...sequence('dispatch-confirmation', 'supplier-ready', 'supplier-update'),
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    label: 'Dispatch confirmation',
    markerEnd: { type: MarkerType.Arrow, color: '#8b7896' },
    style: messageStyle,
  },
  {
    ...sequence('supplier-delivery-arranged', 'supplier-update', 'arrange-delivery'),
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
  },
  sequence('client-delivery', 'arrange-delivery', 'sale-complete'),
];

export default function FurnitureFlow() {
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
    <section className="bpmn-workspace furniture-workspace" aria-label="Atelier Noir furniture order process">
      <header className="bpmn-workspace__header">
        <div>
          <p className="bpmn-workspace__eyebrow">PROCESS MODEL · LUXURY FURNITURE</p>
          <h2>One order, two possible journeys</h2>
          <p className="bpmn-workspace__description">
            Atelier Noir checks its showroom first. If a piece is not in stock, its seller
            orders it from a furniture maker before arranging delivery.
          </p>
        </div>
        <div className="bpmn-workspace__legend" aria-label="Flow types">
          <span><i className="bpmn-legend-arrow" /> Work sequence</span>
          <span><i className="bpmn-legend-arrow bpmn-legend-arrow--message" /> Supplier message</span>
        </div>
      </header>

      <div className="furniture-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.35}
          maxZoom={1.6}
          nodesConnectable
          aria-label="Luxury furniture order diagram with seller and supplier pools"
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#dce3e9" />
          <Controls showInteractive={false} position="top-left" />
          <Panel position="bottom-left" className="react-flow__attribution bpmn-attribution">
            <a href="https://reactflow.dev" target="_blank" rel="noreferrer">Built with React Flow</a>
          </Panel>
        </ReactFlow>
      </div>

      <footer className="bpmn-workspace__footer">
        <span>Solid arrows show work within each business.</span>
        <span>Dashed arrows show messages exchanged between seller and supplier.</span>
      </footer>
    </section>
  );
}
