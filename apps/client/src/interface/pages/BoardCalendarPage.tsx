import { FunctionComponent } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { useParams } from 'wouter-preact';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface Task {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  columnId: string;
  assignee?: {
    id: string;
    name: string;
    avatar: string;
  };
}

export const BoardCalendarPage: FunctionComponent = () => {
  const { id } = useParams();
  const calendarRef = useRef<HTMLDivElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Datos simulados para desarrollo
  const mockTasks: Task[] = [
    {
      id: 'task1',
      title: 'Implementar autenticación',
      start: '2024-04-10T10:00:00',
      end: '2024-04-10T12:00:00',
      color: '#4CAF50',
      columnId: 'todo'
    },
    {
      id: 'task2',
      title: 'Diseñar interfaz de usuario',
      start: '2024-04-11',
      allDay: true,
      color: '#2196F3',
      columnId: 'in-progress'
    },
    {
      id: 'task3',
      title: 'Reunión de planificación',
      start: '2024-04-12T14:00:00',
      end: '2024-04-12T15:30:00',
      color: '#FFC107',
      columnId: 'todo'
    },
    {
      id: 'task4',
      title: 'Revisar pull requests',
      start: '2024-04-13T09:00:00',
      end: '2024-04-13T11:00:00',
      color: '#9C27B0',
      columnId: 'in-progress'
    },
    {
      id: 'task5',
      title: 'Implementar drag and drop',
      start: '2024-04-14',
      end: '2024-04-16',
      color: '#FF9800',
      columnId: 'in-progress'
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setTasks(mockTasks);
      setIsLoading(false);
    }, 500);
  }, [id]);

  useEffect(() => {
    if (isLoading || !calendarRef.current) return;

    // Convertir tareas a formato de eventos para FullCalendar
    const events = tasks.map(task => ({
      id: task.id,
      title: task.title,
      start: task.start,
      end: task.end,
      allDay: task.allDay,
      backgroundColor: task.color,
      borderColor: task.color,
      extendedProps: {
        columnId: task.columnId,
        assignee: task.assignee
      }
    }));

    // Inicializar calendario
    const calendar = new Calendar(calendarRef.current, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      events,
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      height: 'auto',
      eventClick: (info) => {
        // Aquí se manejaría la acción de clic en un evento
        console.log('Evento seleccionado:', info.event);
        // Abrir modal de detalles de tarea
      },
      select: (info) => {
        // Aquí se manejaría la acción de seleccionar un rango de fechas
        console.log('Rango seleccionado:', info);
        // Abrir modal para crear nueva tarea
      },
      eventDrop: (info) => {
        // Aquí se manejaría la acción de arrastrar y soltar un evento
        console.log('Evento movido:', info.event);
        // Actualizar tarea en backend
      },
      eventResize: (info) => {
        // Aquí se manejaría la acción de redimensionar un evento
        console.log('Evento redimensionado:', info.event);
        // Actualizar tarea en backend
      }
    });

    calendar.render();

    return () => {
      calendar.destroy();
    };
  }, [isLoading, tasks]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendario del Tablero</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div ref={calendarRef} className="calendar-container min-h-[800px]"></div>
        )}
      </div>
    </div>
  );
}; 