import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type LayerType = 'background' | 'product' | 'text';

export interface Layer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  src?: string; // For images
  text?: string; // For text
  fontSize?: number;
  fill?: string;
  zIndex: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnail?: string | null;
  platform?: string | null;
}

export interface SourceImage {
  id: string;
  url: string;
  viewType: string;
}

export interface ImageSet {
  id: string;
  name: string;
  configType: string;
  status: string;
  images: GeneratedImage[];
  sourceImages: SourceImage[];
}

interface State {
  layers: Layer[];
  selectedId: string | null;
  history: Layer[][];
  historyStep: number;
  canvasTransform: { x: number; y: number; scale: number };
  activeTool: 'select' | 'hand' | 'text' | 'shape';
  platform: string | null;
  projectInfo: any | null;
  imageSet: ImageSet | null;
}

interface Actions {
  setLayers: (layers: Layer[]) => void;
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, attrs: Partial<Layer>) => void;
  selectLayer: (id: string | null) => void;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  setCanvasTransform: (transform: { x: number; y: number; scale: number }) => void;
  setActiveTool: (tool: 'select' | 'hand' | 'text' | 'shape') => void;
  setPlatform: (platform: string | null) => void;
  setProjectInfo: (info: any) => void;
  setImageSet: (imageSet: ImageSet | null) => void;
  addImageToCanvas: (image: GeneratedImage) => void;
}

export const useStore = create<State & Actions>()(
  immer((set) => ({
    layers: [],
    selectedId: null,
    history: [[]],
    historyStep: 0,
    canvasTransform: { x: 0, y: 0, scale: 1 },
    activeTool: 'select',
    platform: null,
    projectInfo: null,
    imageSet: null,

    setProjectInfo: (info) =>
      set((state) => {
        state.projectInfo = info;
      }),

    setActiveTool: (tool) =>
      set((state) => {
        state.activeTool = tool;
      }),

    setLayers: (layers) =>
      set((state) => {
        state.layers = layers;
      }),

    addLayer: (layer) =>
      set((state) => {
        state.layers.push(layer);
        state.layers.sort((a, b) => a.zIndex - b.zIndex);
      }),

    updateLayer: (id, attrs) =>
      set((state) => {
        const index = state.layers.findIndex((l) => l.id === id);
        if (index !== -1) {
          state.layers[index] = { ...state.layers[index], ...attrs };
        }
      }),

    selectLayer: (id) =>
      set((state) => {
        state.selectedId = id;
      }),

    saveHistory: () =>
      set((state) => {
        const newHistory = state.history.slice(0, state.historyStep + 1);
        newHistory.push(JSON.parse(JSON.stringify(state.layers)));
        state.history = newHistory;
        state.historyStep = newHistory.length - 1;
      }),

    undo: () =>
      set((state) => {
        if (state.historyStep > 0) {
          state.historyStep -= 1;
          state.layers = JSON.parse(JSON.stringify(state.history[state.historyStep]));
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyStep < state.history.length - 1) {
          state.historyStep += 1;
          state.layers = JSON.parse(JSON.stringify(state.history[state.historyStep]));
        }
      }),

    setCanvasTransform: (transform) =>
      set((state) => {
        state.canvasTransform = transform;
      }),

    setPlatform: (platform) =>
      set((state) => {
        state.platform = platform;
      }),

    setImageSet: (imageSet) =>
      set((state) => {
        state.imageSet = imageSet;
      }),

    addImageToCanvas: (image) =>
      set((state) => {
        const maxZIndex = state.layers.length > 0
          ? Math.max(...state.layers.map(l => l.zIndex))
          : 0;

        const newLayer: Layer = {
          id: `product-${image.id}-${Date.now()}`,
          type: 'product',
          x: 100,
          y: 100,
          width: 400,
          height: 400,
          rotation: 0,
          src: image.url,
          zIndex: maxZIndex + 1,
        };

        state.layers.push(newLayer);
        state.selectedId = newLayer.id;
      }),
  }))
);