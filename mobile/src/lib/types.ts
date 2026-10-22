export type Loan = {
  id: number;
  userId: number;
  friendName: string;
  amountPaise: number;
  dueDate: string;
  repaidAt: string | null;
};

export type Summary = {
  totalLentPaise: number;
  totalRepaidPaise: number;
  overduePaise: number;
};

export type LoginResult = {
  token: string;
  user: { id: number; phone: string };
};
