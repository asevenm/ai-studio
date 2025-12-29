'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Transformer, Rect, Line } from 'react-konva';
import useImage from 'use-image';
import { useStore } from '@/store/useStore';
import { KonvaEventObject } from 'konva/lib/Node';
import PlatformGuides from './PlatformGuides';

const GUIDELINE_OFFSET = 5;

type GuideLine = {
    vertical: boolean;
    position: number;
    diff: number;
    snap: 'start' | 'center' | 'end';
    offset: number;
};

const Guides = ({ lines }: { lines: any[] }) => {
    return (
        <>
            {lines.map((line, i) => (
                <Line
                    key={i}
                    points={line.points}
                    stroke="rgb(0, 161, 255)"
                    strokeWidth={1}
                    dash={[4, 6]}
                />
            ))}
        </>
    );
};

const URLImage = ({ src, layerProps, isSelected, onSelect, onChange, onDragMove, onDragEnd }: any) => {
  const [image] = useImage(src);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected) {
      trRef.current?.nodes([shapeRef.current]);
      trRef.current?.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        image={image}
        ref={shapeRef}
        {...layerProps}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
            onDragEnd(e);
            onChange({
                x: e.target.x(),
                y: e.target.y(),
            });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

const TextLayer = ({ layerProps, isSelected, onSelect, onChange, onDblClick, isEditing, onDragMove, onDragEnd }: any) => {
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);
  
    useEffect(() => {
      if (isSelected && !isEditing) {
        trRef.current?.nodes([shapeRef.current]);
        trRef.current?.getLayer().batchDraw();
      }
    }, [isSelected, isEditing]);

    return (
        <>
            <Text
                ref={shapeRef}
                {...layerProps}
                draggable={!isEditing}
                visible={!isEditing}
                onClick={onSelect}
                onTap={onSelect}
                onDblClick={(e) => {
                    const textNode = e.target as any;
                    const stage = textNode.getStage();
                    // We need to calculate absolute position relative to the window, not just stage
                    // Because stage itself is transformed
                    const textPosition = textNode.absolutePosition();
                    const stageBox = stage?.container().getBoundingClientRect();
                    
                    if (stageBox) {
                        const areaPosition = {
                            x: stageBox.left + textPosition.x,
                            y: stageBox.top + textPosition.y,
                            width: textNode.width() * textNode.scaleX() * stage!.scaleX(),
                            height: textNode.height() * textNode.scaleY() * stage!.scaleY(),
                            fontSize: textNode.fontSize() * stage!.scaleX(), // Approximation for visual scaling
                            rotation: textNode.rotation() + stage!.rotation(),
                        };
                        onDblClick(areaPosition, layerProps);
                    }
                }}
                onDragMove={onDragMove}
                onDragEnd={(e) => {
                    onDragEnd(e);
                    onChange({
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={() => {
                     const node = shapeRef.current;
                     onChange({
                         x: node.x(),
                         y: node.y(),
                         rotation: node.rotation(),
                         scaleX: node.scaleX(),
                         scaleY: node.scaleY()
                     })
                }}
            />
             {isSelected && !isEditing && (
                <Transformer
                  ref={trRef}
                />
              )}
        </>
    )
}

export default function EditorStage() {
  const { layers, selectedId, selectLayer, updateLayer, saveHistory, activeTool, setCanvasTransform, canvasTransform } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  // Store the raw props of the layer being edited to render the textarea correctly
  const [editingLayerProps, setEditingLayerProps] = useState<any>(null);
  const [editPos, setEditPos] = useState({ x: 0, y: 0, width: 0, height: 0, fontSize: 0, rotation: 0 });
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [guides, setGuides] = useState<any[]>([]);

  const stageRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelect = (id: string) => {
    if (activeTool !== 'select') return; // Only select in select mode
    if (editingId && editingId !== id) {
        setEditingId(null);
    }
    selectLayer(id);
  };

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectLayer(null);
      setEditingId(null);
    }
  };

  const handleChange = (id: string, newAttrs: any) => {
      updateLayer(id, newAttrs);
      saveHistory();
  }
  
  const handleTextDblClick = (pos: any, layerProps: any) => {
      if (activeTool !== 'select') return;
      setEditingId(layerProps.id);
      setEditPos(pos);
      setEditingLayerProps(layerProps);
  }

  // Snapping Logic
  const getLineGuideStops = (skipShape: any) => {
      const stage = stageRef.current;
      if (!stage) return { vertical: [], horizontal: [] };

      // Add stage center and edges if needed, for now just center
      const vertical = [0, stage.width() / 2, stage.width()];
      const horizontal = [0, stage.height() / 2, stage.height()];

      stage.find('.object').forEach((guideItem: any) => {
          if (guideItem === skipShape) {
              return;
          }
          const box = guideItem.getClientRect({ relativeTo: stage });
          // vertical
          vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
          // horizontal
          horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
      });
      return { vertical, horizontal };
  };

  const getObjectSnappingEdges = (node: any) => {
      const box = node.getClientRect({ relativeTo: stageRef.current });
      return {
          vertical: [
              { guide: box.x, offset: Math.round(node.x() - box.x), snap: 'start' },
              { guide: box.x + box.width / 2, offset: Math.round(node.x() - box.x - box.width / 2), snap: 'center' },
              { guide: box.x + box.width, offset: Math.round(node.x() - box.x - box.width), snap: 'end' },
          ],
          horizontal: [
              { guide: box.y, offset: Math.round(node.y() - box.y), snap: 'start' },
              { guide: box.y + box.height / 2, offset: Math.round(node.y() - box.y - box.height / 2), snap: 'center' },
              { guide: box.y + box.height, offset: Math.round(node.y() - box.y - box.height), snap: 'end' },
          ],
      };
  };

  const getGuides = (lineGuideStops: any, itemBounds: any) => {
      const resultV: any[] = [];
      const resultH: any[] = [];

      lineGuideStops.vertical.forEach((lineGuide: number) => {
          itemBounds.vertical.forEach((itemBound: any) => {
              const diff = Math.abs(lineGuide - itemBound.guide);
              if (diff < GUIDELINE_OFFSET) {
                  resultV.push({ lineGuide: lineGuide, diff: diff, snap: itemBound.snap, offset: itemBound.offset });
              }
          });
      });

      lineGuideStops.horizontal.forEach((lineGuide: number) => {
          itemBounds.horizontal.forEach((itemBound: any) => {
              const diff = Math.abs(lineGuide - itemBound.guide);
              if (diff < GUIDELINE_OFFSET) {
                  resultH.push({ lineGuide: lineGuide, diff: diff, snap: itemBound.snap, offset: itemBound.offset });
              }
          });
      });

      const guides: any[] = [];

      // Find best vertical
      const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
      if (minV) {
          guides.push({ lineGuide: minV.lineGuide, offset: minV.offset, orientation: 'V', snap: minV.snap });
      }

      // Find best horizontal
      const minH = resultH.sort((a, b) => a.diff - b.diff)[0];
      if (minH) {
          guides.push({ lineGuide: minH.lineGuide, offset: minH.offset, orientation: 'H', snap: minH.snap });
      }

      return guides;
  };

  const drawGuides = (guides: any[]) => {
     const newLines = guides.map(g => {
         if (g.orientation === 'H') {
             return { points: [-6000, g.lineGuide, 6000, g.lineGuide] };
         }
         return { points: [g.lineGuide, -6000, g.lineGuide, 6000] };
     });
     setGuides(newLines);
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
      const layer = e.target;
      // Clear previous guides
      setGuides([]);

      // Get snapping stops
      const lineGuideStops = getLineGuideStops(layer);
      // Get object edges
      const itemBounds = getObjectSnappingEdges(layer);
      // Find matches
      const guides = getGuides(lineGuideStops, itemBounds);

      if (guides.length === 0) return;

      drawGuides(guides);

      // Force snap
      guides.forEach((guide) => {
         if (guide.orientation === 'V') {
             layer.x(guide.lineGuide + guide.offset);
         } else {
             layer.y(guide.lineGuide + guide.offset);
         }
      });
  };

  const handleDragEndWithGuides = (e: KonvaEventObject<DragEvent>) => {
      setGuides([]);
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Limit scale
    newScale = Math.max(0.1, Math.min(newScale, 5));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    
    setCanvasTransform({ x: newPos.x, y: newPos.y, scale: newScale });
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
      // If the stage itself was dragged
      if (e.target === stageRef.current) {
          setCanvasTransform({
              x: e.target.x(),
              y: e.target.y(),
              scale: stageRef.current.scaleX()
          });
      }
  };

  // Determine cursor style
  const cursorStyle = activeTool === 'hand' ? 'grab' : 'default';

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50">
    <Stage
      width={size.width}
      height={size.height}
      onMouseDown={checkDeselect}
      onTouchStart={checkDeselect}
      onWheel={handleWheel}
      draggable={activeTool === 'hand'} // Only draggable in hand mode
      onDragEnd={handleDragEnd}
      ref={stageRef}
      style={{ cursor: cursorStyle }}
    >
      <Layer>
        {/* Infinite Grid Background (Visual Cue) */}
        {/* Ideally we'd use a pattern fill or custom shape for a grid that scales effectively. 
            For now, just a massive rect to catch clicks, or rely on Stage background color. */}
        {/* <Rect x={-50000} y={-50000} width={100000} height={100000} fill="#f8f9fa" listening={false} /> */}
        
        {layers.map((layer, i) => {
          const commonProps = {
              layerProps: {
                  x: layer.x,
                  y: layer.y,
                  width: layer.width,
                  height: layer.height,
                  rotation: layer.rotation,
                  id: layer.id,
                  fill: layer.fill,
                  text: layer.text,
                  fontSize: layer.fontSize,
                  scaleX: (layer as any).scaleX || 1,
                  scaleY: (layer as any).scaleY || 1,
                  name: 'object' // Add name class for snapping selector
              },
              isSelected: layer.id === selectedId,
              onSelect: () => handleSelect(layer.id),
              onChange: (newAttrs: any) => handleChange(layer.id, newAttrs),
              onDragMove: handleDragMove,
              onDragEnd: handleDragEndWithGuides
          };

          if (layer.type === 'background' || layer.type === 'product') {
             return <URLImage key={layer.id} {...commonProps} src={layer.src} />;
          } else if (layer.type === 'text') {
             return <TextLayer 
                key={layer.id}
                {...commonProps} 
                isEditing={editingId === layer.id}
                onDblClick={(pos: any, props: any) => handleTextDblClick(pos, props)}
            />;
          }
          return null;
        })}
        <Guides lines={guides} />
        <PlatformGuides />
      </Layer>
    </Stage>
    
    {editingId && editingLayerProps && (
         <textarea
         value={editingLayerProps.text}
         onChange={(e) => {
             // Update local temp state or store directly
             updateLayer(editingId, { text: e.target.value });
             // Update the prop we are reading from so controlled input works
             setEditingLayerProps({ ...editingLayerProps, text: e.target.value });
         }}
         onBlur={() => setEditingId(null)}
         onKeyDown={(e) => {
             if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 setEditingId(null);
                 saveHistory();
             }
         }}
         style={{
             position: 'absolute',
             top: editPos.y + 'px',
             left: editPos.x + 'px',
             // Approximate styling to match canvas
             fontSize: editPos.fontSize + 'px',
             lineHeight: 1, // Konva default
             color: editingLayerProps.fill || 'black',
             border: 'none',
             background: 'transparent',
             padding: 0,
             margin: 0,
             outline: '1px solid #0096fd',
             overflow: 'hidden',
             resize: 'none',
             zIndex: 100,
             minWidth: '100px',
             width: editPos.width + 50 + 'px', // Give some extra room
             height: 'auto',
             transform: `rotate(${editPos.rotation}deg)`,
             transformOrigin: 'top left'
         }}
         autoFocus
     />
    )}
    </div>
  );
}