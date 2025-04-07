declare module '@hello-pangea/dnd' {
  import { ComponentChildren } from 'preact';
  
  export interface DraggableProps {
    draggableId: string;
    index: number;
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => ComponentChildren;
  }

  export interface DroppableProps {
    droppableId: string;
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => ComponentChildren;
  }

  export interface DraggableProvided {
    draggableProps: any;
    dragHandleProps: any;
    innerRef: (element?: HTMLElement | null) => void;
  }

  export interface DroppableProvided {
    droppableProps: any;
    innerRef: (element?: HTMLElement | null) => void;
    placeholder: ComponentChildren;
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    draggingOver: string | null;
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith: string | null;
  }

  export interface DropResult {
    draggableId: string;
    type: string;
    source: {
      droppableId: string;
      index: number;
    };
    destination?: {
      droppableId: string;
      index: number;
    };
    reason: 'DROP' | 'CANCEL';
  }

  export const DragDropContext: preact.FunctionComponent<{
    onDragEnd: (result: DropResult) => void;
    children: ComponentChildren;
  }>;

  export const Draggable: preact.FunctionComponent<DraggableProps>;
  export const Droppable: preact.FunctionComponent<DroppableProps>;
} 