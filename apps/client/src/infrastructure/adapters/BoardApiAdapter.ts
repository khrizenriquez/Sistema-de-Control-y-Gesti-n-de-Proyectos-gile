import { BoardData, UpdateBoardOrder } from '../../domain/services/BoardService';

export class BoardApiAdapter {
  async getBoardData(boardId: string): Promise<BoardData> {
    // Simular llamada a API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: boardId,
          title: 'Project Board',
          description: 'Manage your projects and tasks',
          columns: [
            {
              id: 'resources',
              title: 'Resources',
              cards: [
                {
                  id: 'card-1',
                  title: 'Financials & Growth Data',
                  attachments: 5,
                },
                {
                  id: 'card-2',
                  title: '2017 Goals And KPIs',
                  attachments: 2,
                },
                {
                  id: 'card-3',
                  title: 'Brand Guide',
                  attachments: 1,
                },
                {
                  id: 'card-4',
                  title: 'Employee Manual',
                  attachments: 1,
                },
              ],
            },
            {
              id: 'todo',
              title: 'To Do',
              cards: [
                {
                  id: 'card-5',
                  title: 'Build A Better Burrito: 7 Layers To Success',
                  checklistProgress: {
                    completed: 0,
                    total: 7,
                  },
                  assignee: {
                    id: 'user-1',
                    name: 'John Doe',
                    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
                  },
                },
                {
                  id: 'card-6',
                  title: 'Nacho Ordinary Birthday - Event Space Rentals',
                  assignee: {
                    id: 'user-2',
                    name: 'Jane Smith',
                    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
                  },
                },
                {
                  id: 'card-7',
                  title: 'Taco Drone Delivery Service',
                  dueDate: 'Nov 10',
                  attachments: 3,
                  assignee: {
                    id: 'user-3',
                    name: 'Bob Wilson',
                    avatar: 'https://ui-avatars.com/api/?name=Bob+Wilson&background=random',
                  },
                },
                {
                  id: 'card-8',
                  title: 'Superbowl Ad - "Super Salad Bowls"',
                  dueDate: 'Dec 12',
                  assignee: {
                    id: 'user-4',
                    name: 'Alice Johnson',
                    avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=random',
                  },
                },
              ],
            },
            {
              id: 'doing',
              title: 'Doing',
              cards: [
                {
                  id: 'card-9',
                  title: 'The Taco Truck World Tour',
                  dueDate: 'Oct 5',
                  assignee: {
                    id: 'user-1',
                    name: 'John Doe',
                    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
                  },
                },
                {
                  id: 'card-10',
                  title: 'Operation "Awesome Sauce" - A Recipe For Profit',
                  dueDate: 'Oct 18',
                  attachments: 3,
                  checklistProgress: {
                    completed: 2,
                    total: 5,
                  },
                  assignee: {
                    id: 'user-3',
                    name: 'Bob Wilson',
                    avatar: 'https://ui-avatars.com/api/?name=Bob+Wilson&background=random',
                  },
                },
                {
                  id: 'card-11',
                  title: '#NoFiller Instagram Campaign',
                  attachments: 3,
                  assignee: {
                    id: 'user-5',
                    name: 'Charlie Brown',
                    avatar: 'https://ui-avatars.com/api/?name=Charlie+Brown&background=random',
                  },
                },
                {
                  id: 'card-12',
                  title: 'Global Franchise Opportunities',
                  checklistProgress: {
                    completed: 4,
                    total: 9,
                  },
                  assignee: {
                    id: 'user-2',
                    name: 'Jane Smith',
                    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
                  },
                },
              ],
            },
            {
              id: 'done',
              title: 'Done',
              cards: [
                {
                  id: 'card-13',
                  title: 'Focus Group: Corn vs. Flour Tortillas',
                  assignee: {
                    id: 'user-4',
                    name: 'Alice Johnson',
                    avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=random',
                  },
                },
                {
                  id: 'card-14',
                  title: 'New Swag: Socks, Scarves & Salsa',
                  attachments: 5,
                  assignee: {
                    id: 'user-5',
                    name: 'Charlie Brown',
                    avatar: 'https://ui-avatars.com/api/?name=Charlie+Brown&background=random',
                  },
                },
                {
                  id: 'card-15',
                  title: 'Eco Friendly Utensils & Napkins',
                  checklistProgress: {
                    completed: 3,
                    total: 3,
                  },
                  assignee: {
                    id: 'user-3',
                    name: 'Bob Wilson',
                    avatar: 'https://ui-avatars.com/api/?name=Bob+Wilson&background=random',
                  },
                },
                {
                  id: 'card-16',
                  title: 'Update Yelp Listing',
                  attachments: 1,
                  assignee: {
                    id: 'user-4',
                    name: 'Alice Johnson',
                    avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=random',
                  },
                },
                {
                  id: 'card-17',
                  title: 'Grand Opening Celebration',
                  dueDate: 'Aug 11, 2016',
                  assignee: {
                    id: 'user-1',
                    name: 'John Doe',
                    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
                  },
                },
              ],
            },
          ],
        });
      }, 1000);
    });
  }

  async updateCardOrder(update: UpdateBoardOrder): Promise<boolean> {
    // Simular llamada a API
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('API: Updating card order:', update);
        resolve(true);
      }, 500);
    });
  }
} 