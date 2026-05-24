export interface Driver {
  id?: number;
  name?: string;
  last_name?: string;
  license?: string;
  phone?: string;
  email?: string;
  status?: string;
  personId?: string;
  person?: {
    id: string;
    userId: string;
    name: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
}

