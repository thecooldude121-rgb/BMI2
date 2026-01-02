import React, { useState, useEffect } from 'react';
import { Users, ZoomIn, ZoomOut, Maximize2, Shield } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  hierarchy_level: number;
  parent_role_id?: string;
  description?: string;
  user_count?: number;
}

interface RoleHierarchyViewProps {
  roles: Role[];
  onSelectRole: (role: Role) => void;
  selectedRoleId?: string;
}

interface RoleNode {
  role: Role;
  children: RoleNode[];
  x: number;
  y: number;
}

export const RoleHierarchyView: React.FC<RoleHierarchyViewProps> = ({
  roles,
  onSelectRole,
  selectedRoleId
}) => {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hierarchy, setHierarchy] = useState<RoleNode[]>([]);

  const CARD_WIDTH = 200;
  const CARD_HEIGHT = 100;
  const HORIZONTAL_SPACING = 80;
  const VERTICAL_SPACING = 120;

  useEffect(() => {
    buildHierarchy();
  }, [roles]);

  const buildHierarchy = () => {
    const roleMap = new Map<string, RoleNode>();
    const rootNodes: RoleNode[] = [];

    roles.forEach(role => {
      roleMap.set(role.id, {
        role,
        children: [],
        x: 0,
        y: 0
      });
    });

    roles.forEach(role => {
      const node = roleMap.get(role.id);
      if (node) {
        if (role.parent_role_id && roleMap.has(role.parent_role_id)) {
          roleMap.get(role.parent_role_id)!.children.push(node);
        } else {
          rootNodes.push(node);
        }
      }
    });

    calculatePositions(rootNodes);
    setHierarchy(rootNodes);
  };

  const calculatePositions = (nodes: RoleNode[], startX = 400, startY = 50, level = 0) => {
    if (nodes.length === 0) return;

    const totalWidth = nodes.length * (CARD_WIDTH + HORIZONTAL_SPACING) - HORIZONTAL_SPACING;
    let currentX = startX - totalWidth / 2;

    nodes.forEach((node, index) => {
      node.x = currentX + (CARD_WIDTH / 2);
      node.y = startY + (level * (CARD_HEIGHT + VERTICAL_SPACING));

      if (node.children.length > 0) {
        calculatePositions(
          node.children,
          node.x,
          startY,
          level + 1
        );
      }

      currentX += CARD_WIDTH + HORIZONTAL_SPACING;
    });
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleFitToScreen = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const renderConnections = (nodes: RoleNode[], parentX?: number, parentY?: number): JSX.Element[] => {
    const lines: JSX.Element[] = [];

    nodes.forEach(node => {
      if (parentX !== undefined && parentY !== undefined) {
        const startX = parentX;
        const startY = parentY + (CARD_HEIGHT / 2);
        const endX = node.x;
        const endY = node.y - (CARD_HEIGHT / 2);
        const midY = (startY + endY) / 2;

        lines.push(
          <g key={`line-${node.role.id}`}>
            <path
              d={`M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`}
              stroke="#CBD5E0"
              strokeWidth="2"
              fill="none"
            />
          </g>
        );
      }

      if (node.children.length > 0) {
        lines.push(...renderConnections(node.children, node.x, node.y));
      }
    });

    return lines;
  };

  const renderRoleCard = (node: RoleNode): JSX.Element => {
    const isSelected = node.role.id === selectedRoleId;
    const cardX = node.x - (CARD_WIDTH / 2);
    const cardY = node.y - (CARD_HEIGHT / 2);

    return (
      <g key={node.role.id}>
        <foreignObject
          x={cardX}
          y={cardY}
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
        >
          <div
            onClick={() => onSelectRole(node.role)}
            className={`w-full h-full rounded-lg border-2 cursor-pointer transition-all ${
              isSelected
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
            }`}
          >
            <div className="p-3 h-full flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Shield className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    Level {node.role.hierarchy_level}
                  </span>
                </div>
              </div>

              <h3 className={`text-sm font-semibold mb-1 line-clamp-2 ${
                isSelected ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {node.role.name}
              </h3>

              {node.role.description && (
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {node.role.description}
                </p>
              )}

              <div className="mt-auto flex items-center text-xs text-gray-600">
                <Users className="h-3 w-3 mr-1" />
                <span>{node.role.user_count || 0} user{(node.role.user_count || 0) !== 1 ? 's' : ''}</span>
              </div>

              {node.children.length > 0 && (
                <div className="mt-1 text-xs text-gray-500">
                  {node.children.length} direct report{node.children.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </foreignObject>

        {node.children.map(child => renderRoleCard(child))}
      </g>
    );
  };

  const renderAllNodes = (nodes: RoleNode[]): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    nodes.forEach(node => {
      elements.push(renderRoleCard(node));
    });
    return elements;
  };

  if (hierarchy.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No roles to display in hierarchy view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gray-50 overflow-hidden">
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-white rounded-lg shadow-md border border-gray-200 p-2">
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4 text-gray-700" />
        </button>
        <div className="px-3 py-1 border-x border-gray-200">
          <span className="text-sm font-medium text-gray-700">{Math.round(zoom * 100)}%</span>
        </div>
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4 text-gray-700" />
        </button>
        <div className="border-l border-gray-200 pl-2">
          <button
            onClick={handleFitToScreen}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="h-4 w-4 text-gray-700" />
          </button>
        </div>
      </div>

      <div
        className={`h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <g>
            {renderConnections(hierarchy)}
            {renderAllNodes(hierarchy)}
          </g>
        </svg>
      </div>

      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md border border-gray-200 px-4 py-2">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border-2 border-gray-300 bg-white"></div>
            <span>Role Card</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border-2 border-blue-600 bg-blue-50"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <span>Reports To</span>
          </div>
        </div>
      </div>
    </div>
  );
};
