export interface Note {
  id: string;
  title: string;
  content: unknown;
  plainText: string | null;
  summary: string | null;
  userId: string;
  folderId: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags?: Tag[];
  folder?: Folder | null;
}

export interface Folder {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  userId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  notes?: Note[];
  children?: Folder[];
  parent?: Folder | null;
  _count?: {
    notes: number;
  };
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  notes?: Note[];
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
